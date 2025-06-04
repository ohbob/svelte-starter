import { randomUUID } from "crypto";
import { addMinutes, format } from "date-fns";
import { and, asc, count, desc, eq, gte, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "../../db";
import { bookingAnswers, bookingQuestions, bookings, companies, meetingTypes } from "../../schema";
import { NotificationService } from "../notification";
import { CalendarIntegrationService } from "./integration";

export interface CreateBookingData {
	meetingTypeId: string;
	hostUserId: string;
	guestName: string;
	guestEmail: string;
	guestPhone?: string;
	guestNotes?: string;
	startTime: Date;
	answers?: { questionId: string; answer: string }[];
}

export interface BookingQuestion {
	question: string;
	type: string;
	options?: string;
	isRequired: boolean;
}

export interface BookingFilters {
	search?: string;
	status?: string;
	page?: number;
	limit?: number;
}

export interface BookingsResult {
	bookings: any[];
	total: number;
}

export class BookingService {
	private calendarService: CalendarIntegrationService;
	private notification: NotificationService;

	constructor() {
		this.calendarService = new CalendarIntegrationService();
		this.notification = new NotificationService();
	}

	async create(data: CreateBookingData) {
		const meetingType = await db.query.meetingTypes.findFirst({
			where: and(eq(meetingTypes.id, data.meetingTypeId), eq(meetingTypes.isActive, true)),
			with: {
				company: true,
			},
		});

		if (!meetingType) {
			throw new Error("Meeting type not found");
		}

		const endTime = addMinutes(data.startTime, meetingType.duration);

		// Determine initial status based on meeting type settings
		const initialStatus = meetingType.requiresConfirmation ? "pending" : "confirmed";

		// Create the booking
		const booking = await db
			.insert(bookings)
			.values({
				meetingTypeId: data.meetingTypeId,
				hostUserId: data.hostUserId,
				guestName: data.guestName,
				guestEmail: data.guestEmail,
				guestPhone: data.guestPhone,
				guestNotes: data.guestNotes,
				startTime: data.startTime,
				endTime,
				status: initialStatus,
				cancellationToken: randomUUID(), // Generate secure cancellation token
			})
			.returning();

		// Save answers if provided
		if (data.answers && data.answers.length > 0) {
			await db.insert(bookingAnswers).values(
				data.answers.map((answer) => ({
					bookingId: booking[0].id,
					questionId: answer.questionId,
					answer: answer.answer,
				}))
			);
		}

		// Only create calendar event if booking doesn't require confirmation
		if (!meetingType.requiresConfirmation) {
			try {
				// Ensure meeting type has a selected calendar
				if (!meetingType.selectedCalendarId) {
					throw new Error(
						`Meeting type "${meetingType.name}" must have a selected calendar before bookings can be created.`
					);
				}

				const eventId = await this.calendarService.createEvent({
					companyId: meetingType.companyId,
					companySlug: meetingType.company.slug,
					guestName: data.guestName,
					guestEmail: data.guestEmail,
					startTime: data.startTime,
					endTime,
					meetingTypeName: meetingType.name,
					duration: meetingType.duration,
					notes: data.guestNotes,
					calendarId: meetingType.selectedCalendarId, // Required - no fallback
					cancellationToken: booking[0].cancellationToken || undefined, // Include cancellation token
				});

				// Update booking with Google event ID
				await db
					.update(bookings)
					.set({ googleEventId: eventId })
					.where(eq(bookings.id, booking[0].id));
			} catch (error) {
				console.error("Failed to create calendar event:", error);
				// Don't fail the booking if calendar creation fails
			}
		}

		// Send appropriate notification based on confirmation requirement
		if (meetingType.requiresConfirmation) {
			// Notify host about pending booking
			await this.notification.info(
				"New Booking Request",
				`${data.guestName} has requested a meeting "${meetingType.name}" for ${format(data.startTime, "PPP 'at' p")}. Please review and confirm.`,
				data.hostUserId
			);
		} else {
			// Notify host about confirmed booking
			await this.notification.success(
				"Booking Confirmed",
				`Your meeting "${meetingType.name}" has been scheduled for ${format(data.startTime, "PPP 'at' p")}.`,
				data.hostUserId
			);
		}

		return booking[0];
	}

	async cancel(bookingId: string, userId: string, reason?: string) {
		const booking = await db.query.bookings.findFirst({
			where: eq(bookings.id, bookingId),
			with: {
				meetingType: {
					with: {
						company: true,
					},
				},
			},
		});

		if (!booking || booking.meetingType.company.userId !== userId) {
			throw new Error("Booking not found or unauthorized");
		}

		// Update booking status
		const cancelled = await db
			.update(bookings)
			.set({
				status: "cancelled",
				cancellationReason: reason,
				updatedAt: new Date(),
			})
			.where(eq(bookings.id, bookingId))
			.returning();

		// Cancel calendar event and clear the googleEventId
		if (booking.googleEventId) {
			try {
				await this.calendarService.cancelEvent(
					booking.meetingType.companyId,
					booking.googleEventId,
					booking.meetingType.selectedCalendarId || undefined // Pass the specific calendar ID
				);

				// Clear the googleEventId since the event has been cancelled
				await db.update(bookings).set({ googleEventId: null }).where(eq(bookings.id, bookingId));
			} catch (error) {
				console.error("Failed to cancel calendar event:", error);
				// Still clear the googleEventId even if calendar cancellation fails
				// to prevent showing "In Calendar" for cancelled bookings
				await db.update(bookings).set({ googleEventId: null }).where(eq(bookings.id, bookingId));
			}
		}

		await this.notification.info(
			"Booking Cancelled",
			`The meeting "${booking.meetingType.name}" scheduled for ${format(booking.startTime, "PPP 'at' p")} has been cancelled.`,
			userId
		);

		return cancelled[0];
	}

	async getByUser(userId: string, status?: string) {
		const userCompanies = await db.query.companies.findMany({
			where: eq(companies.userId, userId),
		});

		const companyIds = userCompanies.map((c) => c.id);

		if (companyIds.length === 0) {
			return [];
		}

		// Get meeting types for user's companies first
		const userMeetingTypes = await db.query.meetingTypes.findMany({
			where: inArray(meetingTypes.companyId, companyIds),
		});

		const meetingTypeIds = userMeetingTypes.map((mt) => mt.id);

		if (meetingTypeIds.length === 0) {
			return [];
		}

		const foundBookings = await db.query.bookings.findMany({
			where: and(
				inArray(bookings.meetingTypeId, meetingTypeIds),
				status ? eq(bookings.status, status) : undefined
			),
			orderBy: [desc(bookings.createdAt)],
			with: {
				meetingType: {
					with: {
						company: true,
					},
				},
			},
		});

		return foundBookings;
	}

	async getUpcoming(userId: string) {
		const userCompanies = await db.query.companies.findMany({
			where: eq(companies.userId, userId),
		});

		const companyIds = userCompanies.map((c) => c.id);

		if (companyIds.length === 0) {
			return [];
		}

		// Get meeting types for user's companies first
		const userMeetingTypes = await db.query.meetingTypes.findMany({
			where: inArray(meetingTypes.companyId, companyIds),
		});

		const meetingTypeIds = userMeetingTypes.map((mt) => mt.id);

		if (meetingTypeIds.length === 0) {
			return [];
		}

		return await db.query.bookings.findMany({
			where: and(
				inArray(bookings.meetingTypeId, meetingTypeIds),
				eq(bookings.status, "confirmed"),
				gte(bookings.startTime, new Date())
			),
			orderBy: [asc(bookings.startTime)],
			with: {
				meetingType: {
					with: {
						company: true,
					},
				},
			},
		});
	}

	async getUpcomingByCompany(companyId: string, userId: string) {
		// Verify user owns this company
		const company = await db.query.companies.findFirst({
			where: and(eq(companies.id, companyId), eq(companies.userId, userId)),
		});

		if (!company) {
			return [];
		}

		// Get meeting types for this specific company
		const companyMeetingTypes = await db.query.meetingTypes.findMany({
			where: eq(meetingTypes.companyId, companyId),
		});

		const meetingTypeIds = companyMeetingTypes.map((mt) => mt.id);

		if (meetingTypeIds.length === 0) {
			return [];
		}

		return await db.query.bookings.findMany({
			where: and(
				inArray(bookings.meetingTypeId, meetingTypeIds),
				eq(bookings.status, "confirmed"),
				gte(bookings.startTime, new Date())
			),
			orderBy: [asc(bookings.startTime)],
			with: {
				meetingType: {
					with: {
						company: true,
					},
				},
			},
		});
	}

	async getByCompany(companyId: string, userId: string, status?: string) {
		// Verify user owns this company
		const company = await db.query.companies.findFirst({
			where: and(eq(companies.id, companyId), eq(companies.userId, userId)),
		});

		if (!company) {
			return [];
		}

		// Get meeting types for this specific company
		const companyMeetingTypes = await db.query.meetingTypes.findMany({
			where: eq(meetingTypes.companyId, companyId),
		});

		const meetingTypeIds = companyMeetingTypes.map((mt) => mt.id);

		if (meetingTypeIds.length === 0) {
			return [];
		}

		return await db.query.bookings.findMany({
			where: and(
				inArray(bookings.meetingTypeId, meetingTypeIds),
				status ? eq(bookings.status, status) : undefined
			),
			orderBy: [desc(bookings.createdAt)],
			with: {
				meetingType: {
					with: {
						company: true,
					},
				},
			},
		});
	}

	async getByCompanyWithFilters(
		companyId: string,
		userId: string,
		filters: BookingFilters
	): Promise<BookingsResult> {
		// Verify user owns this company
		const company = await db.query.companies.findFirst({
			where: and(eq(companies.id, companyId), eq(companies.userId, userId)),
		});

		if (!company) {
			return { bookings: [], total: 0 };
		}

		// Get meeting types for this specific company
		const companyMeetingTypes = await db.query.meetingTypes.findMany({
			where: eq(meetingTypes.companyId, companyId),
		});

		const meetingTypeIds = companyMeetingTypes.map((mt) => mt.id);

		if (meetingTypeIds.length === 0) {
			return { bookings: [], total: 0 };
		}

		// Build where conditions
		const whereConditions = [inArray(bookings.meetingTypeId, meetingTypeIds)];

		// Add status filter
		if (filters.status) {
			whereConditions.push(eq(bookings.status, filters.status));
		}

		// Add search filter
		if (filters.search) {
			const searchTerm = `%${filters.search}%`;
			whereConditions.push(
				or(ilike(bookings.guestName, searchTerm), ilike(bookings.guestEmail, searchTerm))
			);
		}

		const whereClause = and(...whereConditions);

		// Get total count
		const totalResult = await db.select({ count: count() }).from(bookings).where(whereClause);

		const total = totalResult[0]?.count || 0;

		// Get paginated results
		const page = filters.page || 1;
		const limit = filters.limit || 10;
		const offset = (page - 1) * limit;

		const bookingsResult = await db.query.bookings.findMany({
			where: whereClause,
			orderBy: [
				// First, order by status priority (confirmed and pending first)
				sql`CASE 
					WHEN ${bookings.status} = 'confirmed' THEN 0 
					WHEN ${bookings.status} = 'pending' THEN 1 
					WHEN ${bookings.status} = 'completed' THEN 2
					WHEN ${bookings.status} = 'cancelled' THEN 3
					WHEN ${bookings.status} = 'rejected' THEN 4
					ELSE 5 
				END`,
				// Then order by start time (most recent first)
				desc(bookings.startTime),
			],
			limit,
			offset,
			with: {
				meetingType: {
					with: {
						company: true,
					},
				},
			},
		});

		return {
			bookings: bookingsResult,
			total,
		};
	}

	async addHostNote(bookingId: string, userId: string, note: string) {
		const booking = await db.query.bookings.findFirst({
			where: eq(bookings.id, bookingId),
			with: {
				meetingType: {
					with: {
						company: true,
					},
				},
			},
		});

		if (!booking || booking.meetingType.company.userId !== userId) {
			throw new Error("Booking not found or unauthorized");
		}

		// Update booking with host note
		const updated = await db
			.update(bookings)
			.set({
				hostNotes: note,
				updatedAt: new Date(),
			})
			.where(eq(bookings.id, bookingId))
			.returning();

		return updated[0];
	}

	// === BOOKING QUESTIONS ===

	async addQuestions(meetingTypeId: string, userId: string, questions: BookingQuestion[]) {
		// Verify user owns the company that owns this meeting type
		const meetingType = await db.query.meetingTypes.findFirst({
			where: eq(meetingTypes.id, meetingTypeId),
			with: {
				company: true,
			},
		});

		if (!meetingType || meetingType.company.userId !== userId) {
			throw new Error("Meeting type not found or unauthorized");
		}

		// Delete existing questions
		await db.delete(bookingQuestions).where(eq(bookingQuestions.meetingTypeId, meetingTypeId));

		// Insert new questions
		if (questions.length > 0) {
			await db.insert(bookingQuestions).values(
				questions.map((q, index) => ({
					meetingTypeId,
					question: q.question,
					type: q.type,
					options: q.options,
					isRequired: q.isRequired,
					order: index,
				}))
			);
		}

		return true;
	}

	async getQuestions(meetingTypeId: string) {
		return await db.query.bookingQuestions.findMany({
			where: eq(bookingQuestions.meetingTypeId, meetingTypeId),
			orderBy: [asc(bookingQuestions.order)],
		});
	}

	// === BOOKING APPROVAL ===

	async approve(bookingId: string, userId: string) {
		const booking = await db.query.bookings.findFirst({
			where: eq(bookings.id, bookingId),
			with: {
				meetingType: {
					with: {
						company: true,
					},
				},
			},
		});

		if (!booking || booking.meetingType.company.userId !== userId) {
			throw new Error("Booking not found or unauthorized");
		}

		if (booking.status !== "pending") {
			throw new Error("Booking is not pending approval");
		}

		// Update booking status to confirmed
		const approved = await db
			.update(bookings)
			.set({
				status: "confirmed",
				updatedAt: new Date(),
			})
			.where(eq(bookings.id, bookingId))
			.returning();

		// Create calendar event now that it's approved
		try {
			// Ensure meeting type has a selected calendar
			if (!booking.meetingType.selectedCalendarId) {
				throw new Error(
					`Meeting type "${booking.meetingType.name}" must have a selected calendar before events can be created.`
				);
			}

			const eventId = await this.calendarService.createEvent({
				companyId: booking.meetingType.companyId,
				companySlug: booking.meetingType.company.slug,
				guestName: booking.guestName,
				guestEmail: booking.guestEmail,
				startTime: booking.startTime,
				endTime: booking.endTime,
				meetingTypeName: booking.meetingType.name,
				duration: booking.meetingType.duration,
				notes: booking.guestNotes || undefined,
				calendarId: booking.meetingType.selectedCalendarId, // Required - no fallback
				cancellationToken: booking.cancellationToken || undefined, // Include cancellation token
			});

			// Update booking with Google event ID
			await db.update(bookings).set({ googleEventId: eventId }).where(eq(bookings.id, bookingId));
		} catch (error) {
			console.error("Failed to create calendar event:", error);
			// Don't fail the approval if calendar creation fails
		}

		// Notify host about approval
		await this.notification.success(
			"Booking Approved",
			`You have approved the meeting "${booking.meetingType.name}" with ${booking.guestName} for ${format(booking.startTime, "PPP 'at' p")}.`,
			userId
		);

		return approved[0];
	}

	async reject(bookingId: string, userId: string, reason?: string) {
		const booking = await db.query.bookings.findFirst({
			where: eq(bookings.id, bookingId),
			with: {
				meetingType: {
					with: {
						company: true,
					},
				},
			},
		});

		if (!booking || booking.meetingType.company.userId !== userId) {
			throw new Error("Booking not found or unauthorized");
		}

		if (booking.status !== "pending") {
			throw new Error("Booking is not pending approval");
		}

		// Update booking status to rejected
		const rejected = await db
			.update(bookings)
			.set({
				status: "rejected",
				cancellationReason: reason,
				updatedAt: new Date(),
			})
			.where(eq(bookings.id, bookingId))
			.returning();

		// If booking had a calendar event (shouldn't happen for pending bookings, but just in case)
		if (booking.googleEventId) {
			try {
				await this.calendarService.cancelEvent(
					booking.meetingType.companyId,
					booking.googleEventId,
					booking.meetingType.selectedCalendarId || undefined
				);

				// Clear the googleEventId since the event has been cancelled
				await db.update(bookings).set({ googleEventId: null }).where(eq(bookings.id, bookingId));
			} catch (error) {
				console.error("Failed to cancel calendar event:", error);
				// Still clear the googleEventId even if calendar cancellation fails
				await db.update(bookings).set({ googleEventId: null }).where(eq(bookings.id, bookingId));
			}
		}

		// Notify host about rejection
		await this.notification.info(
			"Booking Rejected",
			`You have rejected the meeting request from ${booking.guestName} for "${booking.meetingType.name}" scheduled for ${format(booking.startTime, "PPP 'at' p")}.`,
			userId
		);

		return rejected[0];
	}

	// === CLIENT CANCELLATION ===

	async cancelByClient(cancellationToken: string, reason: string) {
		console.log(`[CANCEL_BY_CLIENT] Starting cancellation for token: ${cancellationToken}`);

		if (!reason || reason.trim().length === 0) {
			console.log(`[CANCEL_BY_CLIENT] Error: No reason provided`);
			throw new Error("Cancellation reason is required");
		}

		console.log(`[CANCEL_BY_CLIENT] Finding booking with token: ${cancellationToken}`);
		const booking = await db.query.bookings.findFirst({
			where: eq(bookings.cancellationToken, cancellationToken),
			with: {
				meetingType: {
					with: {
						company: true,
					},
				},
			},
		});

		if (!booking) {
			console.log(`[CANCEL_BY_CLIENT] Error: Booking not found for token: ${cancellationToken}`);
			throw new Error("Booking not found or invalid cancellation link");
		}

		console.log(`[CANCEL_BY_CLIENT] Found booking: ${booking.id}, status: ${booking.status}`);

		if (booking.status === "cancelled") {
			console.log(`[CANCEL_BY_CLIENT] Error: Booking already cancelled`);
			throw new Error("Booking is already cancelled");
		}

		if (booking.status !== "confirmed" && booking.status !== "pending") {
			console.log(`[CANCEL_BY_CLIENT] Error: Invalid status for cancellation: ${booking.status}`);
			throw new Error("Booking cannot be cancelled");
		}

		// Check if booking is more than 24 hours away
		const now = new Date();
		const bookingTime = new Date(booking.startTime);
		const hoursUntilBooking = (bookingTime.getTime() - now.getTime()) / (1000 * 60 * 60);

		console.log(`[CANCEL_BY_CLIENT] Hours until booking: ${hoursUntilBooking}`);

		if (hoursUntilBooking <= 24) {
			console.log(`[CANCEL_BY_CLIENT] Error: Too close to booking time`);
			throw new Error(
				"Bookings can only be cancelled more than 24 hours in advance. Please contact us directly for last-minute cancellations."
			);
		}

		console.log(`[CANCEL_BY_CLIENT] Updating booking status to cancelled`);
		// Update booking status to cancelled with client reason
		const cancelled = await db
			.update(bookings)
			.set({
				status: "cancelled",
				cancellationReason: `Client cancellation: ${reason.trim()}`,
				updatedAt: new Date(),
			})
			.where(eq(bookings.id, booking.id))
			.returning();

		console.log(
			`[CANCEL_BY_CLIENT] Database update successful, cancelled booking: ${cancelled[0]?.id}`
		);

		// Cancel calendar event and clear the googleEventId
		if (booking.googleEventId) {
			console.log(`[CANCEL_BY_CLIENT] Cancelling calendar event: ${booking.googleEventId}`);
			try {
				await this.calendarService.cancelEvent(
					booking.meetingType.companyId,
					booking.googleEventId,
					booking.meetingType.selectedCalendarId || undefined
				);

				console.log(`[CANCEL_BY_CLIENT] Calendar event cancelled successfully`);

				// Clear the googleEventId since the event has been cancelled
				await db.update(bookings).set({ googleEventId: null }).where(eq(bookings.id, booking.id));

				console.log(`[CANCEL_BY_CLIENT] Cleared googleEventId from database`);
			} catch (error) {
				console.error("Failed to cancel calendar event:", error);
				// Still clear the googleEventId even if calendar cancellation fails
				await db.update(bookings).set({ googleEventId: null }).where(eq(bookings.id, booking.id));
				console.log(`[CANCEL_BY_CLIENT] Cleared googleEventId despite calendar error`);
			}
		} else {
			console.log(`[CANCEL_BY_CLIENT] No calendar event to cancel`);
		}

		console.log(`[CANCEL_BY_CLIENT] Sending notification to host: ${booking.hostUserId}`);
		// Notify host about client cancellation with reason
		try {
			await this.notification.info(
				"Booking Cancelled by Client",
				`${booking.guestName} has cancelled their meeting "${booking.meetingType.name}" scheduled for ${format(booking.startTime, "PPP 'at' p")}.\n\nReason: ${reason}`,
				booking.hostUserId
			);
			console.log(`[CANCEL_BY_CLIENT] Notification sent successfully`);
		} catch (error) {
			console.error(`[CANCEL_BY_CLIENT] Failed to send notification:`, error);
			// Don't fail the cancellation if notification fails
		}

		console.log(`[CANCEL_BY_CLIENT] Cancellation completed successfully`);
		return cancelled[0];
	}

	async getBookingByToken(cancellationToken: string) {
		return await db.query.bookings.findFirst({
			where: eq(bookings.cancellationToken, cancellationToken),
			with: {
				meetingType: {
					with: {
						company: true,
					},
				},
			},
		});
	}
}
