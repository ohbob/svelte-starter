import { env } from "$env/dynamic/private";
import { PUBLIC_BASE_URL } from "$env/static/public";
import { and, eq } from "drizzle-orm";
import { google } from "googleapis";
import { db } from "../../db";
import { calendarIntegrations, companies } from "../../schema";

export interface CalendarIntegrationData {
	isConnected: boolean;
	integration: typeof calendarIntegrations.$inferSelect | null;
}

export class CalendarIntegrationService {
	private oauth2Client;
	private calendar;

	// Simple in-memory cache for available calendars
	private calendarCache = new Map<string, { calendars: any[]; timestamp: number }>();
	// Cache for busy times to avoid repeated API calls
	private busyTimesCache = new Map<
		string,
		{ busyTimes: { start: Date; end: Date }[]; timestamp: number }
	>();
	private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes for calendar lists
	private readonly BUSY_TIMES_CACHE_TTL = 2 * 60 * 1000; // 2 minutes for busy times (more critical)

	constructor() {
		this.oauth2Client = new google.auth.OAuth2(
			env.GOOGLE_CLIENT_ID,
			env.GOOGLE_CLIENT_SECRET,
			env.GOOGLE_REDIRECT_URI
		);

		this.calendar = google.calendar({ version: "v3", auth: this.oauth2Client });
	}

	// Helper method to get userId from companyId
	private async getUserIdFromCompanyId(companyId: string): Promise<string> {
		const company = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);

		if (!company.length) {
			throw new Error("Company not found");
		}

		return company[0].userId;
	}

	// Generate auth URL for company-based integration (converts to userId internally)
	generateAuthUrl(companyId: string): string {
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
			state: companyId, // Pass companyId in state for callback
		});
	}

	// Handle OAuth callback for company-based integration (converts to userId internally)
	async handleCallback(code: string, companyId: string): Promise<void> {
		try {
			console.log("Getting tokens for company:", companyId);

			// Get userId from companyId
			const userId = await this.getUserIdFromCompanyId(companyId);

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
			console.log("Calendar integration completed for company:", companyId);
		} catch (error) {
			const err = error as Error;
			console.error("Calendar callback error details:", {
				message: err.message,
				code: (err as any).code,
				status: (err as any).status,
				companyId,
			});
			throw new Error(`Failed to connect calendar: ${err.message}`);
		}
	}

	// Get company's calendar integration (converts companyId to userId)
	async getCalendarIntegration(companyId: string) {
		const userId = await this.getUserIdFromCompanyId(companyId);

		const integration = await db.query.calendarIntegrations.findFirst({
			where: and(eq(calendarIntegrations.userId, userId), eq(calendarIntegrations.isActive, true)),
		});

		if (!integration) {
			return null;
		}

		// Check if token needs refresh
		if (integration.expiresAt && integration.expiresAt <= new Date()) {
			await this.refreshToken(integration);
			// Refetch the updated integration
			return (
				(await db.query.calendarIntegrations.findFirst({
					where: and(
						eq(calendarIntegrations.userId, userId),
						eq(calendarIntegrations.isActive, true)
					),
				})) || null
			);
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

	// Setup auth for company (converts companyId to userId)
	private async setupAuthForCompany(companyId: string) {
		const integration = await this.getCalendarIntegration(companyId);

		if (!integration) {
			throw new Error("No calendar integration found for company");
		}

		this.oauth2Client.setCredentials({
			access_token: integration.accessToken,
			refresh_token: integration.refreshToken,
		});

		return integration;
	}

	// Get calendar status for company
	async getCalendarStatus(companyId: string): Promise<CalendarIntegrationData> {
		try {
			const integration = await this.getCalendarIntegration(companyId);
			return {
				isConnected: !!integration,
				integration,
			};
		} catch (error) {
			console.error("Error getting calendar status:", error);
			return {
				isConnected: false,
				integration: null,
			};
		}
	}

	// Check if calendar is connected for company
	async isCalendarConnected(companyId: string): Promise<boolean> {
		const status = await this.getCalendarStatus(companyId);
		return status.isConnected;
	}

	// Get available calendars for company
	async getAvailableCalendars(companyId: string): Promise<any[]> {
		try {
			// Check cache first
			const cached = this.calendarCache.get(companyId);
			const now = Date.now();

			if (cached && now - cached.timestamp < this.CACHE_TTL) {
				return cached.calendars;
			}

			await this.setupAuthForCompany(companyId);

			const calendarList = await this.calendar.calendarList.list();
			const calendars = calendarList.data.items || [];

			// Cache the result
			this.calendarCache.set(companyId, {
				calendars,
				timestamp: now,
			});

			return calendars;
		} catch (error) {
			console.error("Error getting available calendars:", error);
			return [];
		}
	}

	// Select calendar for company
	async selectCalendar(
		companyId: string,
		calendarId: string
	): Promise<typeof calendarIntegrations.$inferSelect> {
		const integration = await this.getCalendarIntegration(companyId);

		if (!integration) {
			throw new Error("No calendar integration found for company");
		}

		// Setup auth to get calendar details
		await this.setupAuthForCompany(companyId);

		// Get calendar details
		const calendar = await this.calendar.calendars.get({ calendarId });

		// Update the selected calendar
		const [updatedIntegration] = await db
			.update(calendarIntegrations)
			.set({
				selectedCalendarId: calendarId,
				selectedCalendarName: calendar.data.summary || null,
				updatedAt: new Date(),
			})
			.where(eq(calendarIntegrations.id, integration.id))
			.returning();

		return updatedIntegration;
	}

	// Clear calendar cache for company
	private clearCalendarCache(companyId: string): void {
		this.calendarCache.delete(companyId);
	}

	// Clear busy times cache for company (when bookings are made)
	private clearBusyTimesCache(companyId: string): void {
		// Clear all cache entries for this company
		const keysToDelete = [];
		for (const [key] of this.busyTimesCache) {
			if (key.startsWith(`${companyId}-`)) {
				keysToDelete.push(key);
			}
		}
		keysToDelete.forEach((key) => this.busyTimesCache.delete(key));
		console.log(`Cleared ${keysToDelete.length} busy times cache entries for company ${companyId}`);
	}

	// Clear all caches for company (used when disconnecting or major changes)
	private clearAllCaches(companyId: string): void {
		this.clearCalendarCache(companyId);
		this.clearBusyTimesCache(companyId);
	}

	// Disconnect calendar for company
	async disconnectCalendar(companyId: string): Promise<void> {
		const userId = await this.getUserIdFromCompanyId(companyId);

		await db
			.update(calendarIntegrations)
			.set({
				isActive: false,
				updatedAt: new Date(),
			})
			.where(and(eq(calendarIntegrations.userId, userId), eq(calendarIntegrations.isActive, true)));

		// Clear cache when disconnecting
		this.clearAllCaches(companyId);
	}

	// Create calendar event for booking
	async createEvent(bookingData: {
		companyId: string;
		companySlug: string;
		guestName: string;
		guestEmail: string;
		startTime: Date;
		endTime: Date;
		meetingTypeName: string;
		duration: number;
		notes?: string;
		calendarId?: string; // Optional specific calendar ID for this event
		cancellationToken?: string; // Cancellation token for client cancellation
	}): Promise<string> {
		const integration = await this.setupAuthForCompany(bookingData.companyId);

		// Use the specific calendar ID if provided, otherwise fall back to company default
		const targetCalendarId =
			bookingData.calendarId || integration.selectedCalendarId || integration.calendarId;

		if (!targetCalendarId) {
			throw new Error("No calendar ID available for event creation");
		}

		console.log(`Creating calendar event in calendar: ${targetCalendarId}`);

		// Build the event description with cancellation link if token is provided
		let description = `
Meeting Type: ${bookingData.meetingTypeName}
Duration: ${bookingData.duration} minutes
Guest: ${bookingData.guestName} (${bookingData.guestEmail})
${bookingData.notes ? `\nNotes: ${bookingData.notes}` : ""}`;

		// Add cancellation link if token is provided
		if (bookingData.cancellationToken) {
			const cancellationUrl = `${PUBLIC_BASE_URL}/c/${bookingData.companySlug}/meeting/cancel/${bookingData.cancellationToken}`;
			description += `\n\n🔗 Cancel this meeting: ${cancellationUrl}`;
		}

		const event = {
			summary: `${bookingData.meetingTypeName} with ${bookingData.guestName}`,
			description: description.trim(),
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
					{ method: "email", minutes: 24 * 60 }, // 24 hours before
					{ method: "popup", minutes: 15 }, // 15 minutes before
				],
			},
		};

		const response = await this.calendar.events.insert({
			calendarId: targetCalendarId,
			requestBody: event,
			sendUpdates: "all",
		});

		if (!response.data?.id) {
			throw new Error("Failed to create calendar event");
		}

		console.log(`Calendar event created successfully: ${response.data.id}`);

		// Clear relevant caches when a booking is made
		this.clearAllCaches(bookingData.companyId);

		return response.data.id;
	}

	// Cancel calendar event
	async cancelEvent(companyId: string, eventId: string, calendarId?: string): Promise<void> {
		const integration = await this.setupAuthForCompany(companyId);

		// Use the specific calendar ID if provided, otherwise fall back to company default
		const targetCalendarId = calendarId || integration.selectedCalendarId || integration.calendarId;

		if (!targetCalendarId) {
			throw new Error("No calendar ID available for event cancellation");
		}

		console.log(`Cancelling calendar event: ${eventId} from calendar: ${targetCalendarId}`);

		try {
			await this.calendar.events.delete({
				calendarId: targetCalendarId,
				eventId,
				sendUpdates: "all",
			});
			console.log(`Successfully cancelled calendar event: ${eventId}`);
		} catch (error) {
			console.error(`Failed to cancel calendar event ${eventId}:`, error);
			throw error;
		}

		// Clear relevant caches when an event is cancelled
		this.clearAllCaches(companyId);
	}

	// Get busy times for availability checking (with caching)
	async getBusyTimes(
		companyId: string,
		timeMin: Date,
		timeMax: Date
	): Promise<{ start: Date; end: Date }[]> {
		try {
			// Create cache key based on company, calendar, and time range
			const cacheKey = `${companyId}-${timeMin.toISOString()}-${timeMax.toISOString()}`;
			const cached = this.busyTimesCache.get(cacheKey);
			const now = Date.now();

			// Return cached result if still valid
			if (cached && now - cached.timestamp < this.BUSY_TIMES_CACHE_TTL) {
				console.log(`Using cached busy times for ${companyId}`);
				return cached.busyTimes;
			}

			const integration = await this.setupAuthForCompany(companyId);

			const response = await this.calendar.freebusy.query({
				requestBody: {
					timeMin: timeMin.toISOString(),
					timeMax: timeMax.toISOString(),
					items: [{ id: integration.selectedCalendarId || integration.calendarId || undefined }],
				},
			});

			const calendarId = integration.selectedCalendarId || integration.calendarId;
			const busyTimes = response.data.calendars?.[calendarId || ""]?.busy || [];

			const result = busyTimes.map((busy: any) => ({
				start: new Date(busy.start),
				end: new Date(busy.end),
			}));

			// Cache the result
			this.busyTimesCache.set(cacheKey, {
				busyTimes: result,
				timestamp: now,
			});

			console.log(`Fetched and cached ${result.length} busy periods for ${companyId}`);
			return result;
		} catch (error) {
			console.error("Error getting busy times:", error);
			return [];
		}
	}

	// Get busy times for a specific calendar (used by meeting type booking pages)
	async getBusyTimesForCalendar(
		companyId: string,
		calendarId: string | null,
		timeMin: Date,
		timeMax: Date
	): Promise<{ start: Date; end: Date }[]> {
		try {
			// Create cache key based on specific calendar and time range
			const targetCalendarId = calendarId || "default";
			const cacheKey = `${companyId}-${targetCalendarId}-${timeMin.toISOString()}-${timeMax.toISOString()}`;
			const cached = this.busyTimesCache.get(cacheKey);
			const now = Date.now();

			// Return cached result if still valid
			if (cached && now - cached.timestamp < this.BUSY_TIMES_CACHE_TTL) {
				console.log(`Using cached busy times for calendar ${targetCalendarId}`);
				return cached.busyTimes;
			}

			const integration = await this.setupAuthForCompany(companyId);

			// Use the specific calendar ID or fall back to company default
			const calendarToCheck =
				calendarId || integration.selectedCalendarId || integration.calendarId;

			if (!calendarToCheck) {
				console.warn(`No calendar ID available for company ${companyId}`);
				return [];
			}

			console.log(
				`Fetching busy times for calendar ${calendarToCheck} from ${timeMin.toISOString()} to ${timeMax.toISOString()}`
			);

			const response = await this.calendar.freebusy.query({
				requestBody: {
					timeMin: timeMin.toISOString(),
					timeMax: timeMax.toISOString(),
					items: [{ id: calendarToCheck }],
				},
			});

			const busyTimes = response.data.calendars?.[calendarToCheck]?.busy || [];
			console.log(
				`Found ${busyTimes.length} busy periods for ${timeMin.toISOString().split("T")[0]} to ${timeMax.toISOString().split("T")[0]}`
			);

			if (busyTimes.length > 0) {
				console.log(
					`Busy times: ${busyTimes.map((bt: any) => `${bt.start} - ${bt.end}`).join(", ")}`
				);
			}

			const result = busyTimes.map((busy: any) => ({
				start: new Date(busy.start),
				end: new Date(busy.end),
			}));

			// Cache the result
			this.busyTimesCache.set(cacheKey, {
				busyTimes: result,
				timestamp: now,
			});

			return result;
		} catch (error) {
			console.error("Error getting busy times for calendar:", error);
			return [];
		}
	}

	// Public method to clear busy times cache (can be called from booking services)
	public invalidateBusyTimesCache(companyId: string): void {
		this.clearBusyTimesCache(companyId);
	}

	// Public method to clear all caches (can be called from other services)
	public invalidateAllCaches(companyId: string): void {
		this.clearAllCaches(companyId);
	}
}
