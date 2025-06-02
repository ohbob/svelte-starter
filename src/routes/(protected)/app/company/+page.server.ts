import { auth } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { companies } from "$lib/server/schema/companies.schema";
import { fail, redirect } from "@sveltejs/kit";
import { and, eq, ne } from "drizzle-orm";
import type { Actions, PageServerLoad } from "./$types";

// Helper function to validate slug format
function isValidSlug(slug: string): boolean {
	const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
	return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 50;
}

export const load: PageServerLoad = async ({ request, cookies }) => {
	const session = await auth.api.getSession({ headers: request.headers });

	if (!session?.user?.id) {
		throw redirect(302, "/signin");
	}

	const selectedCompanyId = cookies.get("selectedCompanyId");

	if (!selectedCompanyId) {
		throw redirect(302, "/app");
	}

	// Get the current company
	const company = await db
		.select()
		.from(companies)
		.where(and(eq(companies.id, selectedCompanyId), eq(companies.userId, session.user.id)))
		.limit(1);

	if (!company.length) {
		throw redirect(302, "/app");
	}

	return {
		company: company[0],
	};
};

export const actions: Actions = {
	updateCompany: async ({ request, cookies }) => {
		const session = await auth.api.getSession({ headers: request.headers });

		if (!session?.user?.id) {
			return fail(401, { error: "Unauthorized" });
		}

		const selectedCompanyId = cookies.get("selectedCompanyId");

		if (!selectedCompanyId) {
			return fail(400, { error: "No company selected" });
		}

		try {
			const formData = await request.formData();
			const field = formData.get("field") as string;
			const value = formData.get("value") as string;

			if (!field) {
				return fail(400, { error: "Field is required" });
			}

			// Verify company ownership
			const company = await db
				.select()
				.from(companies)
				.where(and(eq(companies.id, selectedCompanyId), eq(companies.userId, session.user.id)))
				.limit(1);

			if (!company.length) {
				return fail(404, { error: "Company not found" });
			}

			// Validate slug if updating slug
			if (field === "slug" && value) {
				// Check slug format
				if (!/^[a-z0-9-]+$/.test(value)) {
					return fail(400, {
						error: "Slug can only contain lowercase letters, numbers, and hyphens",
					});
				}

				if (value.length < 2 || value.length > 50) {
					return fail(400, { error: "Slug must be between 2 and 50 characters" });
				}

				// Check uniqueness
				const existingCompany = await db
					.select()
					.from(companies)
					.where(and(eq(companies.slug, value), ne(companies.id, selectedCompanyId)))
					.limit(1);

				if (existingCompany.length > 0) {
					return fail(400, { error: "This slug is already taken" });
				}
			}

			// Update the company
			const updateData: any = {
				[field]: value,
				updatedAt: new Date(),
			};

			await db.update(companies).set(updateData).where(eq(companies.id, selectedCompanyId));

			return { success: true, field, value };
		} catch (error) {
			console.error("Error updating company:", error);
			return fail(500, { error: "Failed to update company" });
		}
	},
};
