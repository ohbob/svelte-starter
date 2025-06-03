import { and, eq, ne } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "../../db";
import { companies } from "../../schema";

export interface CreateCompanyData {
	userId: string;
	name: string;
	address?: string | null;
	phone?: string | null;
	email?: string | null;
	city?: string | null;
	state?: string | null;
	country?: string | null;
	vat?: string | null;
	regNr?: string | null;
	description?: string | null;
}

export interface UpdateCompanyData {
	name?: string;
	slug?: string;
	address?: string | null;
	phone?: string | null;
	email?: string | null;
	city?: string | null;
	state?: string | null;
	country?: string | null;
	vat?: string | null;
	regNr?: string | null;
	description?: string | null;
	logo?: string | null;
	isActive?: boolean;
}

export class CompanyService {
	// Helper function to validate slug format
	private isValidSlug(slug: string): boolean {
		// Slug should only contain lowercase letters, numbers, and hyphens
		// Should not start or end with hyphen
		const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
		return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 50;
	}

	// Helper function to generate unique slug
	private async generateUniqueSlug(name: string): Promise<string> {
		const baseSlug = name
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, "") // Remove special characters
			.replace(/\s+/g, "-") // Replace spaces with hyphens
			.replace(/-+/g, "-") // Replace multiple hyphens with single
			.trim();

		// Keep trying until we find a unique slug
		let attempts = 0;
		let slug = baseSlug;

		while (attempts < 10) {
			// Add random suffix for uniqueness
			const suffix = nanoid(6).toLowerCase();
			slug = attempts === 0 ? `${baseSlug}-${suffix}` : `${baseSlug}-${suffix}-${attempts}`;

			// Check if this slug already exists
			const existing = await db.select().from(companies).where(eq(companies.slug, slug)).limit(1);

			if (existing.length === 0) {
				return slug;
			}

			attempts++;
		}

		// Fallback to completely random slug if all attempts failed
		return `company-${nanoid(12).toLowerCase()}`;
	}

	async createCompany(data: CreateCompanyData) {
		// Generate unique slug
		const slug = await this.generateUniqueSlug(data.name);

		const newCompany = {
			id: nanoid(),
			userId: data.userId,
			name: data.name,
			slug: slug,
			address: data.address,
			phone: data.phone,
			email: data.email,
			city: data.city,
			state: data.state,
			country: data.country,
			vat: data.vat,
			regNr: data.regNr,
			description: data.description,
			logo: null, // Will be handled separately for file upload
			isActive: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const [createdCompany] = await db.insert(companies).values(newCompany).returning();
		return createdCompany;
	}

	async getCompanyById(id: string) {
		const company = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
		return company[0] || null;
	}

	async getCompanyBySlug(slug: string) {
		const company = await db.select().from(companies).where(eq(companies.slug, slug)).limit(1);
		return company[0] || null;
	}

	async getUserCompanies(userId: string) {
		return await db
			.select()
			.from(companies)
			.where(eq(companies.userId, userId))
			.orderBy(companies.createdAt);
	}

	async checkSlugExists(slug: string, excludeId?: string): Promise<boolean> {
		const whereCondition = excludeId
			? and(eq(companies.slug, slug), ne(companies.id, excludeId))
			: eq(companies.slug, slug);

		const existing = await db.select().from(companies).where(whereCondition).limit(1);
		return existing.length > 0;
	}

	async updateCompany(id: string, data: UpdateCompanyData) {
		// Validate slug if provided
		if (data.slug) {
			// Check slug format
			if (!this.isValidSlug(data.slug)) {
				throw new Error(
					"Invalid slug format. Use only lowercase letters, numbers, and hyphens. Must be 3-50 characters."
				);
			}

			// Check if slug is unique (excluding current company)
			const slugExists = await this.checkSlugExists(data.slug, id);

			if (slugExists) {
				throw new Error("This slug is already taken. Please choose a different one.");
			}
		}

		// Validate required fields
		if (data.name && (!data.name.trim() || data.name.trim().length < 2)) {
			throw new Error("Company name must be at least 2 characters long.");
		}

		// Prepare update data
		const updateData: Record<string, any> = {
			...data,
			updatedAt: new Date(),
		};

		// Remove any undefined values
		Object.keys(updateData).forEach((key) => {
			if (updateData[key] === undefined) {
				delete updateData[key];
			}
		});

		// Update company
		const [updatedCompany] = await db
			.update(companies)
			.set(updateData)
			.where(eq(companies.id, id))
			.returning();

		return updatedCompany;
	}

	async deleteCompany(id: string, userId: string) {
		// Verify ownership
		const company = await this.getCompanyById(id);
		if (!company || company.userId !== userId) {
			throw new Error("Company not found or access denied");
		}

		// Soft delete by setting isActive to false
		const [deletedCompany] = await db
			.update(companies)
			.set({ isActive: false, updatedAt: new Date() })
			.where(eq(companies.id, id))
			.returning();

		return deletedCompany;
	}
}
