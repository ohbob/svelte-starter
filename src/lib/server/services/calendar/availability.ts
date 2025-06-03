import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "../../db";
import {
	availability,
	availabilitySlots,
	availabilityTemplates,
	companies,
	meetingTypeAvailabilityTemplates,
	meetingTypes,
} from "../../schema";
import { NotificationService } from "../notification";

export interface AvailabilitySlot {
	dayOfWeek: number;
	startTime: string;
	endTime: string;
}

export interface CreateAvailabilityTemplateData {
	companyId: string;
	name: string;
	description?: string;
	isDefault?: boolean;
	slots: AvailabilitySlot[];
}

export interface UpdateAvailabilityTemplateData {
	name?: string;
	description?: string;
	isDefault?: boolean;
	timezone?: string;
	bufferBefore?: number;
	bufferAfter?: number;
	selectedCalendarId?: string | null;
	slots?: AvailabilitySlot[];
}

export class AvailabilityService {
	// === COMPANY AVAILABILITY ===

	async setCompanyAvailability(
		companyId: string,
		userId: string,
		availabilityData: AvailabilitySlot[]
	) {
		// Verify user owns the company
		const company = await this.verifyCompanyOwnership(companyId, userId);

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

		const notificationService = new NotificationService();
		await notificationService.success(
			"Availability Updated",
			`Availability for ${company.name} has been updated successfully.`,
			userId
		);
	}

	async getCompanyAvailability(companyId: string) {
		return await db.query.availability.findMany({
			where: and(eq(availability.companyId, companyId), eq(availability.isActive, true)),
			orderBy: [asc(availability.dayOfWeek), asc(availability.startTime)],
		});
	}

	// === AVAILABILITY TEMPLATES ===

	async createTemplate(data: CreateAvailabilityTemplateData) {
		// If this is set as default, unset other defaults
		if (data.isDefault) {
			await this.unsetDefaultTemplates(data.companyId);
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

	async updateTemplate(
		templateId: string,
		companyId: string,
		data: UpdateAvailabilityTemplateData
	) {
		// Verify company owns the template
		const template = await this.verifyTemplateOwnership(templateId, companyId);

		// If this is set as default, unset other defaults
		if (data.isDefault) {
			await this.unsetDefaultTemplates(companyId);
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

	async deleteTemplate(templateId: string, companyId: string, userId: string) {
		// Verify company owns the template
		const template = await this.verifyTemplateOwnership(templateId, companyId);

		// Check if any meeting types are using this template
		const meetingTypesUsingTemplate = await db.query.meetingTypes.findMany({
			where: eq(meetingTypes.companyId, companyId),
			with: {
				availabilityTemplates: {
					where: eq(meetingTypeAvailabilityTemplates.availabilityTemplateId, templateId),
				},
			},
		});

		const activeUsingTemplate = meetingTypesUsingTemplate.filter(
			(mt) => mt.isActive && mt.availabilityTemplates.length > 0
		);

		if (activeUsingTemplate.length > 0) {
			const notificationService = new NotificationService();
			const meetingTypeNames = activeUsingTemplate.map((mt) => mt.name).join(", ");

			await notificationService.error(
				"Cannot Delete Template",
				`The availability template "${template.name}" is currently being used by the following meeting types: ${meetingTypeNames}. Please update or delete these meeting types first.`,
				userId
			);

			return null; // Return null to indicate deletion was not performed
		}

		// Soft delete the template
		const deleted = await db
			.update(availabilityTemplates)
			.set({ isActive: false, updatedAt: new Date() })
			.where(eq(availabilityTemplates.id, templateId))
			.returning();

		const notificationService = new NotificationService();
		await notificationService.success(
			"Template Deleted",
			`Availability template "${template.name}" has been deleted successfully.`,
			userId
		);

		return deleted[0];
	}

	async getTemplates(companyId: string) {
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

	async getTemplate(templateId: string, companyId: string) {
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

	async getDefaultTemplate(companyId: string) {
		return await db.query.availabilityTemplates.findFirst({
			where: and(
				eq(availabilityTemplates.companyId, companyId),
				eq(availabilityTemplates.isDefault, true),
				eq(availabilityTemplates.isActive, true)
			),
			with: {
				slots: {
					where: eq(availabilitySlots.isActive, true),
					orderBy: [asc(availabilitySlots.dayOfWeek), asc(availabilitySlots.startTime)],
				},
			},
		});
	}

	// Get combined availability from multiple templates for a meeting type
	async getCombinedAvailabilityForMeetingType(meetingTypeId: string) {
		// Get the meeting type with its availability templates
		const meetingType = await db.query.meetingTypes.findFirst({
			where: eq(meetingTypes.id, meetingTypeId),
			with: {
				availabilityTemplates: {
					with: {
						availabilityTemplate: {
							with: {
								slots: {
									where: eq(availabilitySlots.isActive, true),
									orderBy: [asc(availabilitySlots.dayOfWeek), asc(availabilitySlots.startTime)],
								},
							},
						},
					},
				},
			},
		});

		if (!meetingType) {
			throw new Error("Meeting type not found");
		}

		// Combine all slots from all templates
		const allSlots: AvailabilitySlot[] = [];

		for (const junction of meetingType.availabilityTemplates) {
			const template = junction.availabilityTemplate;
			for (const slot of template.slots) {
				allSlots.push({
					dayOfWeek: slot.dayOfWeek,
					startTime: slot.startTime,
					endTime: slot.endTime,
				});
			}
		}

		// Sort and merge overlapping slots for the same day
		const mergedSlots = this.mergeOverlappingSlots(allSlots);

		return mergedSlots;
	}

	// Helper method to merge overlapping time slots for the same day
	private mergeOverlappingSlots(slots: AvailabilitySlot[]): AvailabilitySlot[] {
		if (slots.length === 0) return [];

		// Group by day of week
		const slotsByDay = new Map<number, AvailabilitySlot[]>();

		for (const slot of slots) {
			if (!slotsByDay.has(slot.dayOfWeek)) {
				slotsByDay.set(slot.dayOfWeek, []);
			}
			slotsByDay.get(slot.dayOfWeek)!.push(slot);
		}

		const mergedSlots: AvailabilitySlot[] = [];

		// Process each day
		for (const [dayOfWeek, daySlots] of slotsByDay) {
			// Sort slots by start time
			daySlots.sort((a, b) => a.startTime.localeCompare(b.startTime));

			const merged: AvailabilitySlot[] = [];
			let current = daySlots[0];

			for (let i = 1; i < daySlots.length; i++) {
				const next = daySlots[i];

				// Check if current and next overlap or are adjacent
				if (this.timeToMinutes(next.startTime) <= this.timeToMinutes(current.endTime)) {
					// Merge: extend current to the later end time
					current = {
						dayOfWeek,
						startTime: current.startTime,
						endTime:
							this.timeToMinutes(next.endTime) > this.timeToMinutes(current.endTime)
								? next.endTime
								: current.endTime,
					};
				} else {
					// No overlap: add current to merged and start new current
					merged.push(current);
					current = next;
				}
			}

			// Add the last slot
			merged.push(current);
			mergedSlots.push(...merged);
		}

		return mergedSlots.sort((a, b) => {
			if (a.dayOfWeek !== b.dayOfWeek) {
				return a.dayOfWeek - b.dayOfWeek;
			}
			return a.startTime.localeCompare(b.startTime);
		});
	}

	// Helper to convert time string to minutes for comparison
	private timeToMinutes(timeStr: string): number {
		const [hours, minutes] = timeStr.split(":").map(Number);
		return hours * 60 + minutes;
	}

	// === PRIVATE METHODS ===

	private async verifyCompanyOwnership(companyId: string, userId: string) {
		const company = await db.query.companies.findFirst({
			where: and(eq(companies.id, companyId), eq(companies.userId, userId)),
		});

		if (!company) {
			throw new Error("Company not found or unauthorized");
		}

		return company;
	}

	private async verifyTemplateOwnership(templateId: string, companyId: string) {
		const template = await db.query.availabilityTemplates.findFirst({
			where: and(
				eq(availabilityTemplates.id, templateId),
				eq(availabilityTemplates.companyId, companyId)
			),
		});

		if (!template) {
			throw new Error("Availability template not found or unauthorized");
		}

		return template;
	}

	private async unsetDefaultTemplates(companyId: string) {
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
}
