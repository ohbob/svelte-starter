import { env } from "$env/dynamic/private";
import { PUBLIC_BASE_URL } from "$env/static/public";
import { addMinutes, endOfDay, startOfDay } from "date-fns";
import { and, eq, gte, lte } from "drizzle-orm";
import { google } from "googleapis";
import { db } from "./db";
import { availability, bookings, calendarIntegrations, companies, meetingTypes } from "./schema";

export class CalendarManager {
	private oauth2Client;
	private calendar;

	constructor() {
		this.oauth2Client = new google.auth.OAuth2(
			env.GOOGLE_CLIENT_ID,
			env.GOOGLE_CLIENT_SECRET,
			`${PUBLIC_BASE_URL}/api/calendar/callback`
		);

		this.calendar = google.calendar({ version: "v3", auth: this.oauth2Client });
	}

	// Generate auth URL - takes userId for the integration
	generateAuthUrl(userId: string): string {
		const scopes = [
			"https://www.googleapis.com/auth/calendar",
			"https://www.googleapis.com/auth/calendar.events",
			"https://www.googleapis.com/auth/calendar.freebusy",
			"https://www.googleapis.com/auth/calendar.readonly",
		];

		return this.oauth2Client.generateAuthUrl({
			access_type: "offline",
			scope: scopes,
			prompt: "consent",
			state: userId, // Pass userId in state for callback
		});
	}

	// Handle OAuth callback - uses userId for integration
	async handleCallback(code: string, userId: string): Promise<void> {
		try {
			console.log("Getting tokens for user:", userId);
			const { tokens } = await this.oauth2Client.getToken(code);
			console.log("Tokens received:", {
				hasAccessToken: !!tokens.access_token,
				hasRefreshToken: !!tokens.refresh_token,
				expiryDate: tokens.expiry_date,
			});

			// Set credentials to get calendar list
			this.oauth2Client.setCredentials(tokens);

			// Get primary calendar
			console.log("Fetching calendar list...");
			const calendarList = await this.calendar.calendarList.list();
			console.log("Calendar list received:", {
				itemCount: calendarList.data.items?.length || 0,
			});

			const primaryCalendar = calendarList.data.items?.find((cal: any) => cal.primary);

			if (!primaryCalendar) {
				console.error(
					"No primary calendar found in:",
					calendarList.data.items?.map((cal: any) => ({
						id: cal.id,
						summary: cal.summary,
						primary: cal.primary,
					}))
				);
				throw new Error("No primary calendar found");
			}

			console.log("Primary calendar found:", {
				id: primaryCalendar.id,
				summary: primaryCalendar.summary,
			});

			// Deactivate any existing integrations for this user
			await db
				.update(calendarIntegrations)
				.set({
					isActive: false,
					updatedAt: new Date(),
				})
				.where(
					and(eq(calendarIntegrations.userId, userId), eq(calendarIntegrations.isActive, true))
				);

			// Store integration in database
			console.log("Storing calendar integration in database...");
			await db.insert(calendarIntegrations).values({
				userId,
				provider: "google",
				accessToken: tokens.access_token!,
				refreshToken: tokens.refresh_token,
				expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
				calendarId: primaryCalendar.id!,
				selectedCalendarId: primaryCalendar.id!,
				selectedCalendarName: primaryCalendar.summary,
			});

			console.log("Calendar integration stored successfully");
			console.log("Calendar integration completed for user:", userId);
		} catch (error) {
			const err = error as Error;
			console.error("Calendar callback error details:", {
				message: err.message,
				code: (err as any).code,
				status: (err as any).status,
				userId,
			});
			throw new Error(`Failed to connect calendar: ${err.message}`);
		}
	}

	// Get user's calendar integration (private method)
	private async getCalendarIntegration(userId: string) {
		const integration = await db.query.calendarIntegrations.findFirst({
			where: and(eq(calendarIntegrations.userId, userId), eq(calendarIntegrations.isActive, true)),
		});

		if (!integration) {
			throw new Error("No calendar integration found for user");
		}

		// Check if token needs refresh
		if (integration.expiresAt && integration.expiresAt <= new Date()) {
			await this.refreshToken(integration);
		}

		return integration;
	}

	// Refresh expired access token
	private async refreshToken(integration: typeof calendarIntegrations.$inferSelect) {
		if (!integration.refreshToken) {
			throw new Error("No refresh token available");
		}

		this.oauth2Client.setCredentials({
			refresh_token: integration.refreshToken,
		});

		const { credentials } = await this.oauth2Client.refreshAccessToken();

		await db
			.update(calendarIntegrations)
			.set({
				accessToken: credentials.access_token!,
				expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
				updatedAt: new Date(),
			})
			.where(eq(calendarIntegrations.id, integration.id));
	}

	// Setup auth for user (private method)
	private async setupAuthForUser(userId: string) {
		const integration = await this.getCalendarIntegration(userId);

		this.oauth2Client.setCredentials({
			access_token: integration.accessToken,
			refresh_token: integration.refreshToken,
		});

		return integration;
	}

	// Create calendar event for booking - takes userId for calendar, companyId for booking data
	async createEvent(bookingData: {
		hostUserId: string;
		hostCompanyId: string;
		guestName: string;
		guestEmail: string;
		startTime: Date;
		endTime: Date;
		meetingType: typeof meetingTypes.$inferSelect;
		notes?: string;
	}): Promise<string> {
		const integration = await this.setupAuthForUser(bookingData.hostUserId);

		const event = {
			summary: `${bookingData.meetingType.name} with ${bookingData.guestName}`,
			description: `
Meeting Type: ${bookingData.meetingType.name}
Duration: ${bookingData.meetingType.duration} minutes
Guest: ${bookingData.guestName} (${bookingData.guestEmail})
${bookingData.notes ? `\nNotes: ${bookingData.notes}` : ""}
			`.trim(),
			start: {
				dateTime: bookingData.startTime.toISOString(),
				timeZone: "UTC",
			},
			end: {
				dateTime: bookingData.endTime.toISOString(),
				timeZone: "UTC",
			},
			attendees: [{ email: bookingData.guestEmail, displayName: bookingData.guestName }],
			reminders: {
				useDefault: false,
				overrides: [
					{ method: "email", minutes: 24 * 60 }, // 1 day before
					{ method: "popup", minutes: 15 }, // 15 minutes before
				],
			},
		};

		const response = await this.calendar.events.insert({
			calendarId: integration.selectedCalendarId || integration.calendarId!,
			requestBody: event,
			sendUpdates: "all",
		});

		if (!response.data.id) {
			throw new Error("Failed to create calendar event");
		}

		return response.data.id;
	}

	// Get available time slots - takes userId for calendar, companyId for availability
	async getAvailableSlots(
		userId: string,
		companyId: string,
		date: Date,
		duration: number
	): Promise<{ start: Date; end: Date }[]> {
		const integration = await this.setupAuthForUser(userId);

		// Get company's availability for this day of week
		const dayOfWeek = date.getDay();
		const companyAvailability = await db.query.availability.findMany({
			where: and(
				eq(availability.companyId, companyId),
				eq(availability.dayOfWeek, dayOfWeek),
				eq(availability.isActive, true)
			),
		});

		if (companyAvailability.length === 0) {
			return []; // No availability set for this day
		}

		// Get existing bookings for this date and company
		const dayStart = startOfDay(date);
		const dayEnd = endOfDay(date);

		const existingBookings = await db.query.bookings.findMany({
			where: and(
				eq(bookings.hostUserId, userId),
				gte(bookings.startTime, dayStart),
				lte(bookings.startTime, dayEnd),
				eq(bookings.status, "confirmed")
			),
		});

		// Get busy times from Google Calendar
		const busyTimes = await this.getBusyTimes(integration, dayStart, dayEnd);

		// Generate available slots
		const slots: { start: Date; end: Date }[] = [];

		for (const avail of companyAvailability) {
			const [startHour, startMinute] = avail.startTime.split(":").map(Number);
			const [endHour, endMinute] = avail.endTime.split(":").map(Number);

			let slotStart = new Date(date);
			slotStart.setHours(startHour, startMinute, 0, 0);

			const availEnd = new Date(date);
			availEnd.setHours(endHour, endMinute, 0, 0);

			// Generate slots every 15 minutes
			while (slotStart < availEnd) {
				const slotEnd = addMinutes(slotStart, duration);

				if (slotEnd <= availEnd) {
					// Check if slot conflicts with existing bookings or busy times
					const hasConflict = [
						...existingBookings.map((b) => ({ start: b.startTime, end: b.endTime })),
						...busyTimes,
					].some((busy) => slotStart < busy.end && slotEnd > busy.start);

					if (!hasConflict) {
						slots.push({ start: new Date(slotStart), end: new Date(slotEnd) });
					}
				}

				slotStart = addMinutes(slotStart, 15); // 15-minute intervals
			}
		}

		return slots;
	}

	// Get busy times from Google Calendar using Events API (more reliable than Freebusy)
	private async getBusyTimes(
		integration: typeof calendarIntegrations.$inferSelect,
		timeMin: Date,
		timeMax: Date
	): Promise<{ start: Date; end: Date }[]> {
		try {
			const calendarId = integration.selectedCalendarId || integration.calendarId!;

			// Use Events API instead of Freebusy API for better all-day event detection
			const response = await this.calendar.events.list({
				calendarId,
				timeMin: timeMin.toISOString(),
				timeMax: timeMax.toISOString(),
				singleEvents: true,
				orderBy: "startTime",
			});

			const events = response.data.items || [];
			const busyTimes: { start: Date; end: Date }[] = [];

			for (const event of events) {
				// Skip cancelled events
				if (event.status === "cancelled") {
					continue;
				}

				// Skip transparent (free) events UNLESS they are all-day events
				// All-day events should typically block booking slots regardless of transparency
				const isAllDay = !!event.start?.date;
				if (event.transparency === "transparent" && !isAllDay) {
					continue;
				}

				let eventStart: Date;
				let eventEnd: Date;

				if (event.start?.date) {
					// All-day event - block the entire day
					eventStart = new Date(event.start.date + "T00:00:00");
					eventEnd =
						new Date(event.end?.date + "T00:00:00") ||
						new Date(eventStart.getTime() + 24 * 60 * 60 * 1000);
				} else if (event.start?.dateTime) {
					// Timed event
					eventStart = new Date(event.start.dateTime);
					eventEnd = new Date(event.end?.dateTime || eventStart.getTime() + 60 * 60 * 1000); // Default 1 hour if no end
				} else {
					continue; // Skip events without proper time info
				}

				busyTimes.push({ start: eventStart, end: eventEnd });
			}

			return busyTimes;
		} catch (error) {
			console.error("Error fetching busy times from Events API:", error);
			return [];
		}
	}

	// Cancel calendar event
	async cancelEvent(userId: string, eventId: string): Promise<void> {
		await this.setupAuthForUser(userId);
		const integration = await this.getCalendarIntegration(userId);

		await this.calendar.events.delete({
			calendarId: integration.selectedCalendarId || integration.calendarId!,
			eventId,
			sendUpdates: "all",
		});
	}

	// Check if user has calendar connected
	async isCalendarConnected(userId: string): Promise<boolean> {
		try {
			const integration = await db.query.calendarIntegrations.findFirst({
				where: and(
					eq(calendarIntegrations.userId, userId),
					eq(calendarIntegrations.isActive, true)
				),
			});
			return !!integration;
		} catch (error) {
			console.error("Error checking calendar connection:", error);
			return false;
		}
	}

	// Disconnect calendar
	async disconnectCalendar(userId: string): Promise<void> {
		await db
			.update(calendarIntegrations)
			.set({
				isActive: false,
				updatedAt: new Date(),
			})
			.where(and(eq(calendarIntegrations.userId, userId), eq(calendarIntegrations.isActive, true)));
	}

	// Get user's calendar integration (public method)
	async getIntegration(userId: string) {
		return await db.query.calendarIntegrations.findFirst({
			where: and(eq(calendarIntegrations.userId, userId), eq(calendarIntegrations.isActive, true)),
		});
	}

	// Get available calendars for user
	async getAvailableCalendars(userId: string): Promise<any[]> {
		try {
			await this.setupAuthForUser(userId);
			const calendarList = await this.calendar.calendarList.list();
			return calendarList.data.items || [];
		} catch (error) {
			console.error("Error fetching available calendars:", error);
			return [];
		}
	}

	// Select a specific calendar for the user
	async selectCalendar(
		userId: string,
		calendarId: string
	): Promise<typeof calendarIntegrations.$inferSelect> {
		// First, get the calendar details to store the name
		await this.setupAuthForUser(userId);
		const calendarList = await this.calendar.calendarList.list();
		const selectedCalendar = calendarList.data.items?.find((cal: any) => cal.id === calendarId);

		if (!selectedCalendar) {
			throw new Error("Calendar not found");
		}

		await db
			.update(calendarIntegrations)
			.set({
				selectedCalendarId: calendarId,
				selectedCalendarName: selectedCalendar.summary,
				updatedAt: new Date(),
			})
			.where(and(eq(calendarIntegrations.userId, userId), eq(calendarIntegrations.isActive, true)));

		// Return the updated integration
		const updatedIntegration = await db.query.calendarIntegrations.findFirst({
			where: and(eq(calendarIntegrations.userId, userId), eq(calendarIntegrations.isActive, true)),
		});

		if (!updatedIntegration) {
			throw new Error("Failed to retrieve updated integration");
		}

		return updatedIntegration;
	}

	// Get calendar status for user
	async getCalendarStatus(userId: string): Promise<{
		isConnected: boolean;
		integration: typeof calendarIntegrations.$inferSelect | null;
	}> {
		try {
			const integration = await db.query.calendarIntegrations.findFirst({
				where: and(
					eq(calendarIntegrations.userId, userId),
					eq(calendarIntegrations.isActive, true)
				),
			});

			return {
				isConnected: !!integration,
				integration: integration || null,
			};
		} catch (error) {
			console.error("Error getting calendar status:", error);
			return {
				isConnected: false,
				integration: null,
			};
		}
	}

	// Helper method to get userId from companyId (for backward compatibility)
	private async getUserIdFromCompanyId(companyId: string): Promise<string> {
		const company = await db.query.companies.findFirst({
			where: eq(companies.id, companyId),
		});

		if (!company) {
			throw new Error("Company not found");
		}

		return company.userId;
	}

	// Backward compatibility wrapper methods that accept companyId and resolve to userId

	// Get calendar status by company (resolves to user)
	async getCalendarStatusByCompany(companyId: string): Promise<{
		isConnected: boolean;
		integration: typeof calendarIntegrations.$inferSelect | null;
	}> {
		const userId = await this.getUserIdFromCompanyId(companyId);
		return this.getCalendarStatus(userId);
	}

	// Check if calendar is connected by company (resolves to user)
	async isCalendarConnectedByCompany(companyId: string): Promise<boolean> {
		const userId = await this.getUserIdFromCompanyId(companyId);
		return this.isCalendarConnected(userId);
	}

	// Get integration by company (resolves to user)
	async getIntegrationByCompany(companyId: string) {
		const userId = await this.getUserIdFromCompanyId(companyId);
		return this.getIntegration(userId);
	}

	// Get available calendars by company (resolves to user)
	async getAvailableCalendarsByCompany(companyId: string): Promise<any[]> {
		const userId = await this.getUserIdFromCompanyId(companyId);
		return this.getAvailableCalendars(userId);
	}

	// Select calendar by company (resolves to user)
	async selectCalendarByCompany(
		companyId: string,
		calendarId: string
	): Promise<typeof calendarIntegrations.$inferSelect> {
		const userId = await this.getUserIdFromCompanyId(companyId);
		return this.selectCalendar(userId, calendarId);
	}

	// Disconnect calendar by company (resolves to user)
	async disconnectCalendarByCompany(companyId: string): Promise<void> {
		const userId = await this.getUserIdFromCompanyId(companyId);
		return this.disconnectCalendar(userId);
	}
}
