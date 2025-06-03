import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "../../db";
import { notification } from "../../notifications";
import { companies, meetingTypes } from "../../schema";

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
}

export class MeetingTypeService {
	async create(data: CreateMeetingTypeData) {
		// Verify user owns the company
		const company = await this.verifyCompanyOwnership(data.companyId, data.userId);

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

	async update(meetingTypeId: string, userId: string, data: UpdateMeetingTypeData) {
		const meetingType = await this.verifyMeetingTypeOwnership(meetingTypeId, userId);

		const updateData: any = { ...data, updatedAt: new Date() };

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

		await notification.info(
			"Meeting Type Updated",
			"Your meeting type has been updated successfully.",
			{ userId }
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

		await notification.info(
			"Meeting Type Deleted",
			`"${deleted[0].name}" meeting type has been deleted.`,
			{ userId }
		);

		return deleted[0];
	}

	async getByCompany(companyId: string) {
		return await db.query.meetingTypes.findMany({
			where: and(eq(meetingTypes.companyId, companyId), eq(meetingTypes.isActive, true)),
			orderBy: [asc(meetingTypes.createdAt)],
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
