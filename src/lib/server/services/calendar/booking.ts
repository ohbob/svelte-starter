import { addMinutes, format } from "date-fns";
import { and, asc, desc, eq, gte, inArray } from "drizzle-orm";
import { CalendarManager } from "../../calendar";
import { db } from "../../db";
import { notification } from "../../notifications";
import { bookingAnswers, bookingQuestions, bookings, companies, meetingTypes } from "../../schema";

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
	private calendarManager: CalendarManager;

	constructor() {
		this.calendarManager = new CalendarManager();
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

		// Create calendar event
		try {
			const eventId = await this.calendarManager.createEvent({
				hostUserId: meetingType.company.userId,
				hostCompanyId: meetingType.companyId,
				guestName: data.guestName,
				guestEmail: data.guestEmail,
				startTime: data.startTime,
				endTime,
				meetingType,
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

		await notification.success(
			"Booking Confirmed",
			`Your meeting "${meetingType.name}" has been scheduled for ${format(data.startTime, "PPP 'at' p")}.`,
			{ userId: data.hostUserId }
		);

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
				await this.calendarManager.cancelEvent(
					booking.meetingType.company.userId,
					booking.googleEventId
				);
			} catch (error) {
				console.error("Failed to cancel calendar event:", error);
			}
		}

		await notification.info(
			"Booking Cancelled",
			`The meeting "${booking.meetingType.name}" scheduled for ${format(booking.startTime, "PPP 'at' p")} has been cancelled.`,
			{ userId }
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
}
