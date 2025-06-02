import { auth } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { companies } from "$lib/server/schema";
import { json } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { RequestHandler } from "./$types";

// Helper function to generate unique slug
async function generateUniqueSlug(name: string): Promise<string> {
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

export const POST: RequestHandler = async ({ request }) => {
	const session = await auth.api.getSession({ headers: request.headers });

	if (!session) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const data = await request.json();
		const { name, address, phone, email, city, state, country, vat, regNr, description } = data;

		if (!name || !name.trim()) {
			return json({ error: "Company name is required" }, { status: 400 });
		}

		// Generate unique slug
		const slug = await generateUniqueSlug(name.trim());

		const newCompany = {
			id: nanoid(),
			userId: session.user.id,
			name: name.trim(),
			slug: slug,
			address: address?.trim() || null,
			phone: phone?.trim() || null,
			email: email?.trim() || null,
			city: city?.trim() || null,
			state: state?.trim() || null,
			country: country?.trim() || null,
			vat: vat?.trim() || null,
			regNr: regNr?.trim() || null,
			description: description?.trim() || null,
			logo: null, // Will be handled separately for file upload
			isActive: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const [createdCompany] = await db.insert(companies).values(newCompany).returning();

		return json({ company: createdCompany });
	} catch (error) {
		console.error("Error creating company:", error);
		return json({ error: "Failed to create company" }, { status: 500 });
	}
};
