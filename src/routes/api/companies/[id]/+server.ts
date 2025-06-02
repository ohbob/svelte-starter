import { auth } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { companies } from "$lib/server/schema/companies.schema";
import { json } from "@sveltejs/kit";
import { and, eq, ne } from "drizzle-orm";

// Helper function to validate slug format
function isValidSlug(slug: string): boolean {
	// Slug should only contain lowercase letters, numbers, and hyphens
	// Should not start or end with hyphen
	const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
	return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 50;
}

export async function PUT({ request, params }) {
	try {
		console.log("🔄 Company update request received for ID:", params.id);

		// Get session
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session) {
			console.log("❌ Unauthorized request");
			return json({ error: "Unauthorized" }, { status: 401 });
		}

		console.log("✅ User authenticated:", session.user.email);

		const { id } = params;
		const data = await request.json();
		console.log("📝 Update data received:", data);

		// Verify the company belongs to the user
		const existingCompany = await db
			.select()
			.from(companies)
			.where(and(eq(companies.id, id), eq(companies.userId, session.user.id)))
			.limit(1);

		if (!existingCompany.length) {
			console.log("❌ Company not found for user");
			return json({ error: "Company not found" }, { status: 404 });
		}

		console.log("✅ Company found:", existingCompany[0].name);

		// Validate slug if provided
		if (data.slug) {
			console.log("🔍 Validating slug:", data.slug);

			// Check slug format
			if (!isValidSlug(data.slug)) {
				console.log("❌ Invalid slug format");
				return json(
					{
						error:
							"Invalid slug format. Use only lowercase letters, numbers, and hyphens. Must be 3-50 characters.",
					},
					{ status: 400 }
				);
			}

			// Check if slug is unique (excluding current company)
			const slugExists = await db
				.select()
				.from(companies)
				.where(and(eq(companies.slug, data.slug), ne(companies.id, id)))
				.limit(1);

			if (slugExists.length) {
				console.log("❌ Slug already exists");
				return json(
					{
						error: "This slug is already taken. Please choose a different one.",
					},
					{ status: 400 }
				);
			}

			console.log("✅ Slug is valid and unique");
		}

		// Validate required fields
		if (data.name && (!data.name.trim() || data.name.trim().length < 2)) {
			console.log("❌ Invalid company name");
			return json(
				{
					error: "Company name must be at least 2 characters long.",
				},
				{ status: 400 }
			);
		}

		// Prepare update data
		const updateData = {
			...data,
			updatedAt: new Date(),
		};

		// Remove any undefined values
		Object.keys(updateData).forEach((key) => {
			if (updateData[key] === undefined) {
				delete updateData[key];
			}
		});

		console.log("📤 Updating company with data:", updateData);

		// Update company
		const [updatedCompany] = await db
			.update(companies)
			.set(updateData)
			.where(eq(companies.id, id))
			.returning();

		console.log("✅ Company updated successfully:", updatedCompany.name);

		return json({
			success: true,
			message: "Company updated successfully",
			company: updatedCompany,
		});
	} catch (err: any) {
		console.error("❌ Error updating company:", err);
		console.error("Stack trace:", err.stack);
		return json(
			{
				error: "Failed to update company. Please try again.",
			},
			{ status: 500 }
		);
	}
}
