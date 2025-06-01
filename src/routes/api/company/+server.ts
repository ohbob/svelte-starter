import { auth } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { companies } from "$lib/server/schema";
import { json } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ request }) => {
	const session = await auth.api.getSession({ headers: request.headers });

	if (!session) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const company = await db
			.select()
			.from(companies)
			.where(eq(companies.userId, session.user.id))
			.limit(1);

		return json({ company: company[0] || null });
	} catch (error) {
		console.error("Error fetching company data:", error);
		return json({ error: "Failed to fetch company data" }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	const session = await auth.api.getSession({ headers: request.headers });

	if (!session) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const data = await request.json();

		// Check if company exists
		const existingCompany = await db
			.select()
			.from(companies)
			.where(eq(companies.userId, session.user.id))
			.limit(1);

		const companyData = {
			userId: session.user.id,
			name: data.name,
			tagline: data.tagline,
			description: data.description,
			industry: data.industry,
			email: data.email,
			phone: data.phone,
			website: data.website,
			address: data.address,
			city: data.city,
			state: data.state,
			zipCode: data.zipCode,
			country: data.country,
			timezone: data.timezone,
			businessHours: JSON.stringify(data.businessHours),
			socialMedia: JSON.stringify(data.socialMedia),
			acceptsOnlineBooking: data.acceptsOnlineBooking,
			requiresConfirmation: data.requiresConfirmation,
			cancellationPolicy: data.cancellationPolicy,
			paymentMethods: JSON.stringify(data.paymentMethods),
			languages: JSON.stringify(data.languages),
			updatedAt: new Date(),
		};

		let company;
		if (existingCompany.length > 0) {
			// Update existing company
			company = await db
				.update(companies)
				.set(companyData)
				.where(eq(companies.userId, session.user.id))
				.returning();
		} else {
			// Create new company
			company = await db
				.insert(companies)
				.values({ ...companyData, createdAt: new Date() })
				.returning();
		}

		return json({ company: company[0] });
	} catch (error) {
		console.error("Error saving company data:", error);
		return json({ error: "Failed to save company data" }, { status: 500 });
	}
};
