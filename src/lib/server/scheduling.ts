import { addMinutes, format } from "date-fns";
import { and, asc, desc, eq, gte, inArray, ne } from "drizzle-orm";
import { CalendarManager } from "./calendar";
import { db } from "./db";
import { notification } from "./notifications";
import {
	availability,
	availabilitySlots,
	availabilityTemplates,
	bookingAnswers,
	bookingQuestions,
	bookings,
	companies,
	meetingTypes,
} from "./schema";

export class SchedulingManager {
	private calendarManager: CalendarManager;

	constructor() {
		this.calendarManager = new CalendarManager();
	}

	// Create a new meeting type for a company
	async createMeetingType(data: {
		companyId: string;
		userId: string; // For notifications
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
		// Verify user owns the company
		const company = await db.query.companies.findFirst({
			where: and(eq(companies.id, data.companyId), eq(companies.userId, data.userId)),
		});

		if (!company) {
			throw new Error("Company not found or unauthorized");
		}

		const slug = await this.generateUniqueSlug(data.name, data.companyId);

		const meetingType = await db
			.insert(meetingTypes)
			.values({
				companyId: data.companyId,
				name: data.name,
				description: data.description,
				duration: data.duration,
				slug,
				price: data.price || 0,
				color: data.color || "#3b82f6",
				requiresConfirmation: data.requiresConfirmation || false,
				bufferTimeBefore: data.bufferTimeBefore || 0,
				bufferTimeAfter: data.bufferTimeAfter || 0,
				maxBookingsPerDay: data.maxBookingsPerDay,
			})
			.returning();

		await notification.success(
			"Meeting Type Created",
			`"${data.name}" meeting type has been created successfully for ${company.name}.`,
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
		// First verify the user owns the company that owns this meeting type
		const meetingType = await db.query.meetingTypes.findFirst({
			where: eq(meetingTypes.id, meetingTypeId),
			with: {
				company: true,
			},
		});

		if (!meetingType || meetingType.company.userId !== userId) {
			throw new Error("Meeting type not found or unauthorized");
		}

		if (data.name) {
			data.slug = await this.generateUniqueSlug(data.name, meetingType.companyId, meetingTypeId);
		}

		const updated = await db
			.update(meetingTypes)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(meetingTypes.id, meetingTypeId))
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
		// First verify the user owns the company that owns this meeting type
		const meetingType = await db.query.meetingTypes.findFirst({
			where: eq(meetingTypes.id, meetingTypeId),
			with: {
				company: true,
			},
		});

		if (!meetingType || meetingType.company.userId !== userId) {
			throw new Error("Meeting type not found or unauthorized");
		}

		const deleted = await db
			.update(meetingTypes)
			.set({ isActive: false, updatedAt: new Date() })
			.where(eq(meetingTypes.id, meetingTypeId))
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

	// Get company's meeting types
	async getCompanyMeetingTypes(companyId: string) {
		return await db.query.meetingTypes.findMany({
			where: and(eq(meetingTypes.companyId, companyId), eq(meetingTypes.isActive, true)),
			orderBy: [asc(meetingTypes.createdAt)],
		});
	}

	// Get user's meeting types (from all their companies)
	async getMeetingTypes(userId: string) {
		const userCompanies = await db.query.companies.findMany({
			where: eq(companies.userId, userId),
		});

		const companyIds = userCompanies.map((c) => c.id);

		if (companyIds.length === 0) {
			return [];
		}

		return await db.query.meetingTypes.findMany({
			where: and(eq(meetingTypes.isActive, true), inArray(meetingTypes.companyId, companyIds)),
			orderBy: [asc(meetingTypes.createdAt)],
			with: {
				company: true,
			},
		});
	}

	// Get public meeting type by company and slug
	async getPublicMeetingType(companyId: string, slug: string) {
		const meetingType = await db.query.meetingTypes.findFirst({
			where: and(
				eq(meetingTypes.companyId, companyId),
				eq(meetingTypes.slug, slug),
				eq(meetingTypes.isActive, true)
			),
			with: {
				company: true,
			},
		});

		if (!meetingType) {
			throw new Error("Meeting type not found");
		}

		return meetingType;
	}

	// Set company availability
	async setAvailability(
		companyId: string,
		userId: string,
		availabilityData: {
			dayOfWeek: number;
			startTime: string;
			endTime: string;
		}[]
	) {
		// Verify user owns the company
		const company = await db.query.companies.findFirst({
			where: and(eq(companies.id, companyId), eq(companies.userId, userId)),
		});

		if (!company) {
			throw new Error("Company not found or unauthorized");
		}

		// Delete existing availability
		await db.delete(availability).where(eq(availability.companyId, companyId));

		// Insert new availability
		if (availabilityData.length > 0) {
			await db.insert(availability).values(
				availabilityData.map((avail) => ({
					companyId,
					...avail,
				}))
			);
		}

		await notification.success(
			"Availability Updated",
			`Availability for ${company.name} has been updated successfully.`,
			{ userId }
		);
	}

	// Get company availability
	async getAvailability(companyId: string) {
		return await db.query.availability.findMany({
			where: and(eq(availability.companyId, companyId), eq(availability.isActive, true)),
			orderBy: [asc(availability.dayOfWeek), asc(availability.startTime)],
		});
	}

	// Get available slots for booking
	async getAvailableSlots(companyId: string, meetingTypeId: string, date: Date) {
		const meetingType = await db.query.meetingTypes.findFirst({
			where: and(
				eq(meetingTypes.id, meetingTypeId),
				eq(meetingTypes.companyId, companyId),
				eq(meetingTypes.isActive, true)
			),
			with: {
				company: true,
			},
		});

		if (!meetingType) {
			throw new Error("Meeting type not found");
		}

		// Check if company has calendar connected (using company owner's calendar for now)
		const isConnected = await this.calendarManager.isCalendarConnected(meetingType.company.userId);
		if (!isConnected) {
			throw new Error("Calendar not connected");
		}

		// Get available slots from calendar manager (using company owner's calendar)
		const slots = await this.calendarManager.getAvailableSlots(
			meetingType.company.userId,
			companyId,
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

	// Cancel booking
	async cancelBooking(bookingId: string, userId: string, reason?: string) {
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

	// Get bookings for user's companies
	async getBookings(userId: string, status?: string) {
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

	// Get upcoming bookings for user's companies
	async getUpcomingBookings(userId: string) {
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

	private generateSlug(name: string): string {
		return name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/(^-|-$)/g, "");
	}

	private async generateUniqueSlug(
		name: string,
		companyId: string,
		excludeId?: string
	): Promise<string> {
		const baseSlug = this.generateSlug(name);
		let slug = baseSlug;
		let counter = 1;

		while (true) {
			const existing = await db.query.meetingTypes.findFirst({
				where: and(
					eq(meetingTypes.companyId, companyId),
					eq(meetingTypes.slug, slug),
					excludeId ? ne(meetingTypes.id, excludeId) : undefined
				),
			});

			if (!existing) {
				return slug;
			}

			slug = `${baseSlug}-${counter}`;
			counter++;
		}
	}

	// Add questions to meeting type
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

	// Get questions for meeting type
	async getMeetingTypeQuestions(meetingTypeId: string) {
		return await db.query.bookingQuestions.findMany({
			where: eq(bookingQuestions.meetingTypeId, meetingTypeId),
			orderBy: [asc(bookingQuestions.order)],
		});
	}

	// === AVAILABILITY TEMPLATES ===

	// Create availability template
	async createAvailabilityTemplate(data: {
		companyId: string;
		name: string;
		description?: string;
		isDefault?: boolean;
		slots: {
			dayOfWeek: number;
			startTime: string;
			endTime: string;
		}[];
	}) {
		// If this is set as default, unset other defaults
		if (data.isDefault) {
			await db
				.update(availabilityTemplates)
				.set({ isDefault: false })
				.where(
					and(
						eq(availabilityTemplates.companyId, data.companyId),
						eq(availabilityTemplates.isDefault, true)
					)
				);
		}

		const template = await db
			.insert(availabilityTemplates)
			.values({
				companyId: data.companyId,
				name: data.name,
				description: data.description,
				isDefault: data.isDefault || false,
			})
			.returning();

		// Add slots
		if (data.slots.length > 0) {
			await db.insert(availabilitySlots).values(
				data.slots.map((slot) => ({
					templateId: template[0].id,
					...slot,
				}))
			);
		}

		return template[0];
	}

	// Update availability template
	async updateAvailabilityTemplate(
		templateId: string,
		companyId: string,
		data: {
			name?: string;
			description?: string;
			isDefault?: boolean;
			slots?: {
				dayOfWeek: number;
				startTime: string;
				endTime: string;
			}[];
		}
	) {
		// Verify company owns the template
		const template = await db.query.availabilityTemplates.findFirst({
			where: and(
				eq(availabilityTemplates.id, templateId),
				eq(availabilityTemplates.companyId, companyId)
			),
		});

		if (!template) {
			throw new Error("Availability template not found or unauthorized");
		}

		// If this is set as default, unset other defaults
		if (data.isDefault) {
			await db
				.update(availabilityTemplates)
				.set({ isDefault: false })
				.where(
					and(
						eq(availabilityTemplates.companyId, companyId),
						eq(availabilityTemplates.isDefault, true)
					)
				);
		}

		// Update template
		const updated = await db
			.update(availabilityTemplates)
			.set({
				name: data.name,
				description: data.description,
				isDefault: data.isDefault,
				updatedAt: new Date(),
			})
			.where(eq(availabilityTemplates.id, templateId))
			.returning();

		// Update slots if provided
		if (data.slots) {
			// Delete existing slots
			await db.delete(availabilitySlots).where(eq(availabilitySlots.templateId, templateId));

			// Add new slots
			if (data.slots.length > 0) {
				await db.insert(availabilitySlots).values(
					data.slots.map((slot) => ({
						templateId,
						...slot,
					}))
				);
			}
		}

		return updated[0];
	}

	// Delete availability template
	async deleteAvailabilityTemplate(templateId: string, companyId: string) {
		// Verify company owns the template
		const template = await db.query.availabilityTemplates.findFirst({
			where: and(
				eq(availabilityTemplates.id, templateId),
				eq(availabilityTemplates.companyId, companyId)
			),
		});

		if (!template) {
			throw new Error("Availability template not found or unauthorized");
		}

		// Check if any meeting types are using this template
		const meetingTypesUsingTemplate = await db.query.meetingTypes.findMany({
			where: and(
				eq(meetingTypes.availabilityTemplateId, templateId),
				eq(meetingTypes.isActive, true)
			),
		});

		if (meetingTypesUsingTemplate.length > 0) {
			throw new Error("Cannot delete availability template that is being used by meeting types");
		}

		// Soft delete the template
		const deleted = await db
			.update(availabilityTemplates)
			.set({ isActive: false, updatedAt: new Date() })
			.where(eq(availabilityTemplates.id, templateId))
			.returning();

		return deleted[0];
	}

	// Get company's availability templates
	async getAvailabilityTemplates(companyId: string) {
		return await db.query.availabilityTemplates.findMany({
			where: and(
				eq(availabilityTemplates.companyId, companyId),
				eq(availabilityTemplates.isActive, true)
			),
			with: {
				slots: {
					orderBy: [asc(availabilitySlots.dayOfWeek), asc(availabilitySlots.startTime)],
				},
			},
			orderBy: [desc(availabilityTemplates.isDefault), asc(availabilityTemplates.name)],
		});
	}

	// Get availability template by ID
	async getAvailabilityTemplate(templateId: string, companyId: string) {
		const template = await db.query.availabilityTemplates.findFirst({
			where: and(
				eq(availabilityTemplates.id, templateId),
				eq(availabilityTemplates.companyId, companyId),
				eq(availabilityTemplates.isActive, true)
			),
			with: {
				slots: {
					orderBy: [asc(availabilitySlots.dayOfWeek), asc(availabilitySlots.startTime)],
				},
			},
		});

		if (!template) {
			throw new Error("Availability template not found");
		}

		return template;
	}

	// Get default availability template for company
	async getDefaultAvailabilityTemplate(companyId: string) {
		return await db.query.availabilityTemplates.findFirst({
			where: and(
				eq(availabilityTemplates.companyId, companyId),
				eq(availabilityTemplates.isDefault, true),
				eq(availabilityTemplates.isActive, true)
			),
			with: {
				slots: {
					orderBy: [asc(availabilitySlots.dayOfWeek), asc(availabilitySlots.startTime)],
				},
			},
		});
	}
}
