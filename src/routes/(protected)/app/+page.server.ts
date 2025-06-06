import { auth } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { companies } from "$lib/server/schema";
import { AnalyticsService } from "$lib/server/services";
import { fail } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent }) => {
	// Get session and company data from parent layouts
	const { user, currentCompany } = await parent();

	if (!user || !currentCompany?.id) {
		return {
			analytics: {
				totalViews: 0,
				todayViews: 0,
				recentViews: 0,
				dailyViews: [],
				topReferrers: [],
				todayReferrers: [],
			},
		};
	}

	try {
		const analyticsService = new AnalyticsService();

		// Calculate date range (last 30 days)
		const endDate = new Date();
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - 30);

		const analytics = await analyticsService.getCompanyAnalytics(
			currentCompany.id,
			startDate,
			endDate
		);

		return {
			analytics,
		};
	} catch (error) {
		console.error("Error loading dashboard analytics:", error);
		return {
			analytics: {
				totalViews: 0,
				todayViews: 0,
				recentViews: 0,
				dailyViews: [],
				topReferrers: [],
				todayReferrers: [],
			},
		};
	}
};

export const actions: Actions = {
	selectCompany: async ({ request, cookies }) => {
		const session = await auth.api.getSession({ headers: request.headers });

		if (!session?.user?.id) {
			return fail(401, { error: "Unauthorized" });
		}

		const formData = await request.formData();
		const companyId = formData.get("companyId") as string;

		if (!companyId) {
			return fail(400, { error: "Company ID is required" });
		}

		try {
			// Verify that the company belongs to the user
			const company = await db
				.select()
				.from(companies)
				.where(and(eq(companies.id, companyId), eq(companies.userId, session.user.id)))
				.limit(1);

			if (!company.length) {
				return fail(404, { error: "Company not found or access denied" });
			}

			// Set the cookie
			cookies.set("selectedCompanyId", companyId, {
				path: "/",
				maxAge: 60 * 60 * 24 * 30, // 30 days
				httpOnly: false,
				secure: false,
				sameSite: "lax",
			});

			// Return success data instead of redirecting
			return {
				success: true,
				selectedCompanyId: companyId,
				message: "Company selected successfully",
			};
		} catch (error) {
			console.error("Error selecting company:", error);
			return fail(500, { error: "Failed to select company" });
		}
	},

	createCompany: async ({ request, cookies }) => {
		const session = await auth.api.getSession({ headers: request.headers });

		if (!session?.user?.id) {
			return fail(401, { error: "Unauthorized" });
		}

		const formData = await request.formData();
		const name = formData.get("name") as string;
		const description = formData.get("description") as string;

		if (!name || name.trim().length < 2) {
			return fail(400, { error: "Company name must be at least 2 characters long" });
		}

		try {
			// Generate unique slug
			const generateSlug = (name: string) => {
				return name
					.toLowerCase()
					.replace(/[^a-z0-9]+/g, "-")
					.replace(/^-+|-+$/g, "");
			};

			let slug = generateSlug(name.trim());
			let attempts = 0;
			const maxAttempts = 10;

			// Check for uniqueness and add suffix if needed
			while (attempts < maxAttempts) {
				const existingCompany = await db
					.select()
					.from(companies)
					.where(eq(companies.slug, slug))
					.limit(1);

				if (existingCompany.length === 0) {
					break; // Slug is unique
				}

				attempts++;
				slug = `${generateSlug(name.trim())}-${Math.random().toString(36).substring(2, 8)}`;
			}

			if (attempts >= maxAttempts) {
				return fail(500, { error: "Failed to generate unique slug" });
			}

			// Generate unique ID and timestamps
			const companyId = crypto.randomUUID();
			const now = new Date();

			// Create the company
			const [newCompany] = await db
				.insert(companies)
				.values({
					id: companyId,
					name: name.trim(),
					description: description?.trim() || null,
					slug,
					userId: session.user.id,
					isActive: true,
					createdAt: now,
					updatedAt: now,
				})
				.returning();

			// Auto-select the new company
			cookies.set("selectedCompanyId", newCompany.id, {
				path: "/",
				maxAge: 60 * 60 * 24 * 30, // 30 days
				httpOnly: false,
				secure: false,
				sameSite: "lax",
			});

			// Return success data with the new company
			return {
				success: true,
				company: newCompany,
				selectedCompanyId: newCompany.id,
				message: "Company created and selected successfully",
			};
		} catch (error) {
			console.error("Error creating company:", error);
			return fail(500, { error: "Failed to create company" });
		}
	},
};
