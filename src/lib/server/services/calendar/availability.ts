import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "../../db";
import { notification } from "../../notifications";
import {
	availability,
	availabilitySlots,
	availabilityTemplates,
	companies,
	meetingTypes,
} from "../../schema";

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

		await notification.success(
			"Availability Updated",
			`Availability for ${company.name} has been updated successfully.`,
			{ userId }
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

	async deleteTemplate(templateId: string, companyId: string) {
		// Verify company owns the template
		const template = await this.verifyTemplateOwnership(templateId, companyId);

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
					orderBy: [asc(availabilitySlots.dayOfWeek), asc(availabilitySlots.startTime)],
				},
			},
		});
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
