import { addMinutes, format } from "date-fns";
import { and, asc, desc, eq, gte, ne } from "drizzle-orm";
import { CalendarManager } from "./calendar";
import { db } from "./db";
import { notification } from "./notifications";
import { availability, bookingAnswers, bookingQuestions, bookings, meetingTypes } from "./schema";

export class SchedulingManager {
	private calendarManager: CalendarManager;

	constructor() {
		this.calendarManager = new CalendarManager();
	}

	// Create a new meeting type
	async createMeetingType(data: {
		userId: string;
		name: string;
		description?: string;
		duration: number;
		price?: number;
		color?: string;
		requiresConfirmation?: boolean;
		bufferTimeBefore?: number;
		bufferTimeAfter?: number;
		maxBookingsPerDay?: number;
	}) {
		const slug = await this.generateUniqueSlug(data.name, data.userId);

		const meetingType = await db
			.insert(meetingTypes)
			.values({
				...data,
				slug,
				price: data.price || 0,
				color: data.color || "#3b82f6",
				requiresConfirmation: data.requiresConfirmation || false,
				bufferTimeBefore: data.bufferTimeBefore || 0,
				bufferTimeAfter: data.bufferTimeAfter || 0,
			})
			.returning();

		await notification.success(
			"Meeting Type Created",
			`"${data.name}" meeting type has been created successfully.`,
			{ userId: data.userId }
		);

		return meetingType[0];
	}

	// Update meeting type
	async updateMeetingType(
		meetingTypeId: string,
		userId: string,
		data: Partial<typeof meetingTypes.$inferInsert>
	) {
		if (data.name) {
			data.slug = await this.generateUniqueSlug(data.name, userId, meetingTypeId);
		}

		const updated = await db
			.update(meetingTypes)
			.set({ ...data, updatedAt: new Date() })
			.where(and(eq(meetingTypes.id, meetingTypeId), eq(meetingTypes.userId, userId)))
			.returning();

		if (updated.length === 0) {
			throw new Error("Meeting type not found or unauthorized");
		}

		await notification.info(
			"Meeting Type Updated",
			`Your meeting type has been updated successfully.`,
			{ userId }
		);

		return updated[0];
	}

	// Delete meeting type
	async deleteMeetingType(meetingTypeId: string, userId: string) {
		const deleted = await db
			.update(meetingTypes)
			.set({ isActive: false, updatedAt: new Date() })
			.where(and(eq(meetingTypes.id, meetingTypeId), eq(meetingTypes.userId, userId)))
			.returning();

		if (deleted.length === 0) {
			throw new Error("Meeting type not found or unauthorized");
		}

		await notification.info(
			"Meeting Type Deleted",
			`"${deleted[0].name}" meeting type has been deleted.`,
			{ userId }
		);

		return deleted[0];
	}

	// Get user's meeting types
	async getMeetingTypes(userId: string) {
		return await db.query.meetingTypes.findMany({
			where: and(eq(meetingTypes.userId, userId), eq(meetingTypes.isActive, true)),
			orderBy: [asc(meetingTypes.createdAt)],
		});
	}

	// Get public meeting type by slug
	async getPublicMeetingType(userId: string, slug: string) {
		const meetingType = await db.query.meetingTypes.findFirst({
			where: and(
				eq(meetingTypes.userId, userId),
				eq(meetingTypes.slug, slug),
				eq(meetingTypes.isActive, true)
			),
		});

		if (!meetingType) {
			throw new Error("Meeting type not found");
		}

		return meetingType;
	}

	// Set user availability
	async setAvailability(
		userId: string,
		availabilityData: {
			dayOfWeek: number;
			startTime: string;
			endTime: string;
		}[]
	) {
		// Delete existing availability
		await db.delete(availability).where(eq(availability.userId, userId));

		// Insert new availability
		if (availabilityData.length > 0) {
			await db.insert(availability).values(
				availabilityData.map((avail) => ({
					userId,
					...avail,
				}))
			);
		}

		await notification.success(
			"Availability Updated",
			"Your availability has been updated successfully.",
			{ userId }
		);
	}

	// Get user availability
	async getAvailability(userId: string) {
		return await db.query.availability.findMany({
			where: and(eq(availability.userId, userId), eq(availability.isActive, true)),
			orderBy: [asc(availability.dayOfWeek), asc(availability.startTime)],
		});
	}

	// Get available slots for booking
	async getAvailableSlots(userId: string, meetingTypeId: string, date: Date) {
		const meetingType = await db.query.meetingTypes.findFirst({
			where: and(
				eq(meetingTypes.id, meetingTypeId),
				eq(meetingTypes.userId, userId),
				eq(meetingTypes.isActive, true)
			),
		});

		if (!meetingType) {
			throw new Error("Meeting type not found");
		}

		// Check if user has calendar connected
		const isConnected = await this.calendarManager.isCalendarConnected(userId);
		if (!isConnected) {
			throw new Error("Calendar not connected");
		}

		// Get available slots from calendar manager
		const slots = await this.calendarManager.getAvailableSlots(
			userId,
			date,
			meetingType.duration +
				(meetingType.bufferTimeBefore || 0) +
				(meetingType.bufferTimeAfter || 0)
		);

		// Apply buffer times to actual booking slots
		return slots.map((slot) => ({
			start: addMinutes(slot.start, meetingType.bufferTimeBefore || 0),
			end: addMinutes(slot.start, (meetingType.bufferTimeBefore || 0) + meetingType.duration),
		}));
	}

	// Create a booking
	async createBooking(data: {
		meetingTypeId: string;
		hostUserId: string;
		guestName: string;
		guestEmail: string;
		guestPhone?: string;
		guestNotes?: string;
		startTime: Date;
		answers?: { questionId: string; answer: string }[];
	}) {
		// Get meeting type
		const meetingType = await db.query.meetingTypes.findFirst({
			where: and(
				eq(meetingTypes.id, data.meetingTypeId),
				eq(meetingTypes.userId, data.hostUserId),
				eq(meetingTypes.isActive, true)
			),
		});

		if (!meetingType) {
			throw new Error("Meeting type not found");
		}

		// Calculate end time
		const endTime = addMinutes(data.startTime, meetingType.duration);

		// Check if slot is still available
		const availableSlots = await this.getAvailableSlots(
			data.hostUserId,
			data.meetingTypeId,
			data.startTime
		);

		const isSlotAvailable = availableSlots.some(
			(slot) => slot.start.getTime() === data.startTime.getTime()
		);

		if (!isSlotAvailable) {
			throw new Error("Selected time slot is no longer available");
		}

		// Create calendar event
		const googleEventId = await this.calendarManager.createEvent({
			hostUserId: data.hostUserId,
			guestName: data.guestName,
			guestEmail: data.guestEmail,
			startTime: data.startTime,
			endTime,
			meetingType,
			notes: data.guestNotes,
		});

		// Create booking in database
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
				googleEventId,
				status: meetingType.requiresConfirmation ? "pending" : "confirmed",
			})
			.returning();

		// Save custom question answers
		if (data.answers && data.answers.length > 0) {
			await db.insert(bookingAnswers).values(
				data.answers.map((answer) => ({
					bookingId: booking[0].id,
					questionId: answer.questionId,
					answer: answer.answer,
				}))
			);
		}

		// Send notifications
		await notification.success(
			"Meeting Booked",
			`Your meeting "${meetingType.name}" has been scheduled for ${format(data.startTime, "PPP p")}.`,
			{ userId: data.hostUserId }
		);

		return booking[0];
	}

	// Cancel booking
	async cancelBooking(bookingId: string, userId: string, reason?: string) {
		const booking = await db.query.bookings.findFirst({
			where: and(eq(bookings.id, bookingId), eq(bookings.hostUserId, userId)),
			with: {
				meetingType: true,
			},
		});

		if (!booking) {
			throw new Error("Booking not found or unauthorized");
		}

		if (booking.status === "cancelled") {
			throw new Error("Booking is already cancelled");
		}

		// Cancel calendar event
		if (booking.googleEventId) {
			try {
				await this.calendarManager.cancelEvent(userId, booking.googleEventId);
			} catch (error) {
				console.error("Failed to cancel calendar event:", error);
			}
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

		await notification.warning(
			"Meeting Cancelled",
			`Your meeting "${booking.meetingType.name}" has been cancelled.`,
			{ userId }
		);

		return cancelled[0];
	}

	// Get user's bookings
	async getBookings(userId: string, status?: string) {
		const whereConditions = [eq(bookings.hostUserId, userId)];

		if (status) {
			whereConditions.push(eq(bookings.status, status));
		}

		return await db.query.bookings.findMany({
			where: and(...whereConditions),
			with: {
				meetingType: true,
			},
			orderBy: [desc(bookings.startTime)],
		});
	}

	// Get upcoming bookings
	async getUpcomingBookings(userId: string) {
		return await db.query.bookings.findMany({
			where: and(
				eq(bookings.hostUserId, userId),
				eq(bookings.status, "confirmed"),
				gte(bookings.startTime, new Date())
			),
			with: {
				meetingType: true,
			},
			orderBy: [asc(bookings.startTime)],
		});
	}

	// Helper: Generate URL-friendly slug
	private generateSlug(name: string): string {
		return name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "");
	}

	// Helper: Generate unique slug for user
	private async generateUniqueSlug(
		name: string,
		userId: string,
		excludeId?: string
	): Promise<string> {
		const baseSlug = this.generateSlug(name);
		let slug = baseSlug;
		let counter = 1;

		while (true) {
			const whereConditions = [eq(meetingTypes.userId, userId), eq(meetingTypes.slug, slug)];

			if (excludeId) {
				whereConditions.push(ne(meetingTypes.id, excludeId));
			}

			const existing = await db.query.meetingTypes.findFirst({
				where: and(...whereConditions),
			});

			if (!existing) {
				return slug;
			}

			counter++;
			slug = `${baseSlug}-${counter}`;
		}
	}

	// Add custom questions to meeting type
	async addMeetingTypeQuestions(
		meetingTypeId: string,
		userId: string,
		questions: {
			question: string;
			type: string;
			options?: string;
			isRequired: boolean;
		}[]
	) {
		// Verify ownership
		const meetingType = await db.query.meetingTypes.findFirst({
			where: and(eq(meetingTypes.id, meetingTypeId), eq(meetingTypes.userId, userId)),
		});

		if (!meetingType) {
			throw new Error("Meeting type not found or unauthorized");
		}

		// Delete existing questions
		await db.delete(bookingQuestions).where(eq(bookingQuestions.meetingTypeId, meetingTypeId));

		// Add new questions
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

	// Get meeting type questions
	async getMeetingTypeQuestions(meetingTypeId: string) {
		return await db.query.bookingQuestions.findMany({
			where: eq(bookingQuestions.meetingTypeId, meetingTypeId),
			orderBy: [asc(bookingQuestions.order)],
		});
	}
}
