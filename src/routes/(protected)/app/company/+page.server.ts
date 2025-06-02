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

export const load: PageServerLoad = async ({ parent }) => {
	// Get data from parent layout
	const { currentCompany } = await parent();
	return {
		currentCompany,
	};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		console.log("🔄 Form action triggered");

		// Get session
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session) {
			console.log("❌ Unauthorized request");
			throw redirect(302, "/signin");
		}

		console.log("✅ User authenticated:", session.user.email);

		try {
			const formData = await request.formData();
			const data = {
				name: formData.get("name")?.toString().trim(),
				slug: formData.get("slug")?.toString().trim(),
				email: formData.get("email")?.toString().trim() || null,
				phone: formData.get("phone")?.toString().trim() || null,
				vat: formData.get("vat")?.toString().trim() || null,
				regNr: formData.get("regNr")?.toString().trim() || null,
				description: formData.get("description")?.toString().trim() || null,
			};

			console.log("📝 Form data received:", data);

			// Get current company ID from cookie
			const selectedCompanyId = cookies.get("selectedCompanyId");
			if (!selectedCompanyId) {
				return fail(400, { error: "No company selected" });
			}

			// Verify the company belongs to the user
			const existingCompany = await db
				.select()
				.from(companies)
				.where(and(eq(companies.id, selectedCompanyId), eq(companies.userId, session.user.id)))
				.limit(1);

			if (!existingCompany.length) {
				console.log("❌ Company not found for user");
				return fail(404, { error: "Company not found" });
			}

			console.log("✅ Company found:", existingCompany[0].name);

			// Validate required fields
			if (!data.name || data.name.length < 2) {
				return fail(400, {
					error: "Company name must be at least 2 characters long.",
					data,
				});
			}

			if (!data.slug) {
				return fail(400, {
					error: "Slug is required.",
					data,
				});
			}

			// Validate slug format
			if (!isValidSlug(data.slug)) {
				return fail(400, {
					error:
						"Invalid slug format. Use only lowercase letters, numbers, and hyphens. Must be 3-50 characters.",
					data,
				});
			}

			console.log("🔍 Validating slug:", data.slug);

			// Check if slug is unique (excluding current company)
			const slugExists = await db
				.select()
				.from(companies)
				.where(and(eq(companies.slug, data.slug), ne(companies.id, selectedCompanyId)))
				.limit(1);

			if (slugExists.length) {
				console.log("❌ Slug already exists");
				return fail(400, {
					error: "This slug is already taken. Please choose a different one.",
					data,
				});
			}

			console.log("✅ Slug is valid and unique");

			// Prepare update data
			const updateData = {
				...data,
				updatedAt: new Date(),
			};

			console.log("📤 Updating company with data:", updateData);

			// Update company
			const [updatedCompany] = await db
				.update(companies)
				.set(updateData)
				.where(eq(companies.id, selectedCompanyId))
				.returning();

			console.log("✅ Company updated successfully:", updatedCompany.name);

			return {
				success: true,
				message: "Company updated successfully!",
				company: updatedCompany,
			};
		} catch (error) {
			console.error("❌ Error updating company:", error);
			return fail(500, {
				error: "Failed to update company. Please try again.",
			});
		}
	},
};
