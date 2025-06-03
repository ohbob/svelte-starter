import { addMinutes, format } from "date-fns";
import { and, asc, desc, eq, gte, inArray } from "drizzle-orm";
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
				const eventId = await this.calendarService.createEvent({
					companyId: meetingType.companyId,
					guestName: data.guestName,
					guestEmail: data.guestEmail,
					startTime: data.startTime,
					endTime,
					meetingTypeName: meetingType.name,
					duration: meetingType.duration,
					notes: data.guestNotes,
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

		// Cancel calendar event
		if (booking.googleEventId) {
			try {
				await this.calendarService.cancelEvent(
					booking.meetingType.companyId,
					booking.googleEventId
				);
			} catch (error) {
				console.error("Failed to cancel calendar event:", error);
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
			orderBy: [desc(bookings.startTime)],
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
			orderBy: [desc(bookings.startTime)],
			with: {
				meetingType: {
					with: {
						company: true,
					},
				},
			},
		});
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
			const eventId = await this.calendarService.createEvent({
				companyId: booking.meetingType.companyId,
				guestName: booking.guestName,
				guestEmail: booking.guestEmail,
				startTime: booking.startTime,
				endTime: booking.endTime,
				meetingTypeName: booking.meetingType.name,
				duration: booking.meetingType.duration,
				notes: booking.guestNotes || undefined,
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

		// Notify host about rejection
		await this.notification.info(
			"Booking Rejected",
			`You have rejected the meeting request from ${booking.guestName} for "${booking.meetingType.name}" scheduled for ${format(booking.startTime, "PPP 'at' p")}.`,
			userId
		);

		return rejected[0];
	}
}
