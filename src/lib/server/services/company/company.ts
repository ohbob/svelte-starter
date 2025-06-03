import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import { notification } from "../../notifications";
import { companies } from "../../schema";

export interface CreateCompanyData {
	userId: string;
	name: string;
	slug?: string;
	description?: string;
	address?: string;
	email?: string;
	phone?: string;
	city?: string;
	state?: string;
	country?: string;
	vat?: string;
	regNr?: string;
}

export interface UpdateCompanyData {
	name?: string;
	slug?: string;
	description?: string;
	address?: string;
	email?: string;
	phone?: string;
	city?: string;
	state?: string;
	country?: string;
	vat?: string;
	regNr?: string;
}

export class CompanyService {
	async create(data: CreateCompanyData) {
		const slug = data.slug || this.generateSlug(data.name);

		// Check if slug is already taken
		const existingCompany = await db.query.companies.findFirst({
			where: eq(companies.slug, slug),
		});

		if (existingCompany) {
			throw new Error("Company slug already exists");
		}

		const company = await db
			.insert(companies)
			.values({
				id: crypto.randomUUID(),
				userId: data.userId,
				name: data.name,
				slug,
				description: data.description,
				address: data.address,
				email: data.email,
				phone: data.phone,
				city: data.city,
				state: data.state,
				country: data.country,
				vat: data.vat,
				regNr: data.regNr,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.returning();

		await notification.success("Company Created", `"${data.name}" has been created successfully.`, {
			userId: data.userId,
		});

		return company[0];
	}

	async update(companyId: string, userId: string, data: UpdateCompanyData) {
		// Verify user owns the company
		const company = await this.verifyOwnership(companyId, userId);

		// If slug is being updated, check for conflicts
		if (data.slug && data.slug !== company.slug) {
			const existingCompany = await db.query.companies.findFirst({
				where: eq(companies.slug, data.slug),
			});

			if (existingCompany) {
				throw new Error("Company slug already exists");
			}
		}

		const updated = await db
			.update(companies)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(eq(companies.id, companyId))
			.returning();

		if (updated.length === 0) {
			throw new Error("Company not found or unauthorized");
		}

		await notification.info(
			"Company Updated",
			"Your company information has been updated successfully.",
			{ userId }
		);

		return updated[0];
	}

	async delete(companyId: string, userId: string) {
		const company = await this.verifyOwnership(companyId, userId);

		const deleted = await db
			.update(companies)
			.set({
				isActive: false,
				updatedAt: new Date(),
			})
			.where(eq(companies.id, companyId))
			.returning();

		if (deleted.length === 0) {
			throw new Error("Company not found or unauthorized");
		}

		await notification.info("Company Deleted", `"${company.name}" has been deleted.`, { userId });

		return deleted[0];
	}

	async getByUser(userId: string) {
		return await db.query.companies.findMany({
			where: and(eq(companies.userId, userId), eq(companies.isActive, true)),
		});
	}

	async getBySlug(slug: string) {
		const company = await db.query.companies.findFirst({
			where: and(eq(companies.slug, slug), eq(companies.isActive, true)),
		});

		if (!company) {
			throw new Error("Company not found");
		}

		return company;
	}

	async getById(companyId: string) {
		const company = await db.query.companies.findFirst({
			where: and(eq(companies.id, companyId), eq(companies.isActive, true)),
		});

		if (!company) {
			throw new Error("Company not found");
		}

		return company;
	}

	private async verifyOwnership(companyId: string, userId: string) {
		const company = await db.query.companies.findFirst({
			where: and(eq(companies.id, companyId), eq(companies.userId, userId)),
		});

		if (!company) {
			throw new Error("Company not found or unauthorized");
		}

		return company;
	}

	private generateSlug(name: string): string {
		return name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/(^-|-$)/g, "");
	}
}
