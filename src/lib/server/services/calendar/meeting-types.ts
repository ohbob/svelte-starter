import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "../../db";
import { companies, meetingTypeAvailabilityTemplates, meetingTypes } from "../../schema";
import { NotificationService } from "../notification";

export interface CreateMeetingTypeData {
	companyId: string;
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
	availabilityTemplateId?: string;
	availabilityTemplateIds?: string[];
	selectedCalendarId?: string;
}

export interface UpdateMeetingTypeData {
	name?: string;
	description?: string;
	duration?: number;
	price?: number;
	color?: string;
	requiresConfirmation?: boolean;
	bufferTimeBefore?: number;
	bufferTimeAfter?: number;
	maxBookingsPerDay?: number;
	availabilityTemplateId?: string;
	availabilityTemplateIds?: string[];
	selectedCalendarId?: string;
}

export class MeetingTypeService {
	async create(data: CreateMeetingTypeData) {
		// Verify user owns the company
		const company = await this.verifyCompanyOwnership(data.companyId, data.userId);

		const slug = await this.generateUniqueSlug(data.name, data.companyId);

		const insertData: any = {
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
		};

		// Add selectedCalendarId if provided
		if (data.selectedCalendarId) {
			insertData.selectedCalendarId = data.selectedCalendarId;
		}

		const meetingType = await db.insert(meetingTypes).values(insertData).returning();

		// Insert into junction table for many-to-many relationship
		const templateIds =
			data.availabilityTemplateIds ||
			(data.availabilityTemplateId ? [data.availabilityTemplateId] : []);
		if (templateIds.length > 0) {
			const junctionData = templateIds.map((templateId) => ({
				meetingTypeId: meetingType[0].id,
				availabilityTemplateId: templateId,
			}));

			await db.insert(meetingTypeAvailabilityTemplates).values(junctionData);
		}

		const notificationService = new NotificationService();
		await notificationService.success(
			"Meeting Type Created",
			`"${data.name}" meeting type has been created successfully for ${company.name}.`,
			data.userId
		);

		return meetingType[0];
	}

	async update(meetingTypeId: string, userId: string, data: UpdateMeetingTypeData) {
		const meetingType = await this.verifyMeetingTypeOwnership(meetingTypeId, userId);

		let updateData: any = { ...data, updatedAt: new Date() };
		// Remove the array fields since they're handled separately
		delete updateData.availabilityTemplateIds;
		delete updateData.availabilityTemplateId;

		if (data.name) {
			updateData.slug = await this.generateUniqueSlug(
				data.name,
				meetingType.companyId,
				meetingTypeId
			);
		}

		const updated = await db
			.update(meetingTypes)
			.set(updateData)
			.where(eq(meetingTypes.id, meetingTypeId))
			.returning();

		if (updated.length === 0) {
			throw new Error("Meeting type not found or unauthorized");
		}

		// Update many-to-many relationship
		const templateIds =
			data.availabilityTemplateIds ||
			(data.availabilityTemplateId ? [data.availabilityTemplateId] : []);

		// Delete existing relationships
		await db
			.delete(meetingTypeAvailabilityTemplates)
			.where(eq(meetingTypeAvailabilityTemplates.meetingTypeId, meetingTypeId));

		// Insert new relationships
		if (templateIds.length > 0) {
			const junctionData = templateIds.map((templateId) => ({
				meetingTypeId: meetingTypeId,
				availabilityTemplateId: templateId,
			}));

			await db.insert(meetingTypeAvailabilityTemplates).values(junctionData);
		}

		const notificationService = new NotificationService();
		await notificationService.info(
			"Meeting Type Updated",
			"Your meeting type has been updated successfully.",
			userId
		);

		return updated[0];
	}

	async delete(meetingTypeId: string, userId: string) {
		const meetingType = await this.verifyMeetingTypeOwnership(meetingTypeId, userId);

		const deleted = await db
			.update(meetingTypes)
			.set({ isActive: false, updatedAt: new Date() })
			.where(eq(meetingTypes.id, meetingTypeId))
			.returning();

		if (deleted.length === 0) {
			throw new Error("Meeting type not found or unauthorized");
		}

		const notificationService = new NotificationService();
		await notificationService.info(
			"Meeting Type Deleted",
			`"${deleted[0].name}" meeting type has been deleted.`,
			userId
		);

		return deleted[0];
	}

	async getByCompany(companyId: string) {
		return await db.query.meetingTypes.findMany({
			where: and(eq(meetingTypes.companyId, companyId), eq(meetingTypes.isActive, true)),
			orderBy: [asc(meetingTypes.createdAt)],
			with: {
				availabilityTemplates: {
					with: {
						availabilityTemplate: true,
					},
				},
			},
		});
	}

	async getByUser(userId: string) {
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

	async getById(meetingTypeId: string) {
		const meetingType = await db.query.meetingTypes.findFirst({
			where: and(eq(meetingTypes.id, meetingTypeId), eq(meetingTypes.isActive, true)),
			with: {
				availabilityTemplates: {
					with: {
						availabilityTemplate: true,
					},
				},
			},
		});

		if (!meetingType) {
			throw new Error("Meeting type not found");
		}

		// Transform the data to match the expected format
		const availabilityTemplatesList = meetingType.availabilityTemplates.map(
			(junction) => junction.availabilityTemplate
		);

		return {
			...meetingType,
			availabilityTemplates: availabilityTemplatesList,
		};
	}

	async getPublic(companyId: string, slug: string) {
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

	private async verifyCompanyOwnership(companyId: string, userId: string) {
		const company = await db.query.companies.findFirst({
			where: and(eq(companies.id, companyId), eq(companies.userId, userId)),
		});

		if (!company) {
			throw new Error("Company not found or unauthorized");
		}

		return company;
	}

	private async verifyMeetingTypeOwnership(meetingTypeId: string, userId: string) {
		const meetingType = await db.query.meetingTypes.findFirst({
			where: eq(meetingTypes.id, meetingTypeId),
			with: {
				company: true,
			},
		});

		if (!meetingType || meetingType.company.userId !== userId) {
			throw new Error("Meeting type not found or unauthorized");
		}

		return meetingType;
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
					excludeId ? eq(meetingTypes.id, excludeId) : undefined
				),
			});

			if (!existing) {
				return slug;
			}

			slug = `${baseSlug}-${counter}`;
			counter++;
		}
	}
}
