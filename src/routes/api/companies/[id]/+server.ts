import { auth } from "$lib/server/auth";
import { CompanyService } from "$lib/server/services";
import { json } from "@sveltejs/kit";

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

		const companyService = new CompanyService();

		// Verify the company belongs to the user
		const existingCompany = await companyService.getCompanyById(id);

		if (!existingCompany || existingCompany.userId !== session.user.id) {
			console.log("❌ Company not found for user");
			return json({ error: "Company not found" }, { status: 404 });
		}

		console.log("✅ Company found:", existingCompany.name);

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
			const slugExists = await companyService.checkSlugExists(data.slug, id);

			if (slugExists) {
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

		// Update company using service
		const updatedCompany = await companyService.updateCompany(id, data);

		console.log("✅ Company updated successfully:", updatedCompany.name);

		return json({
			success: true,
			message: "Company updated successfully",
			company: updatedCompany,
		});
	} catch (err: any) {
		console.error("❌ Error updating company:", err);
		console.error("Stack trace:", err.stack);

		// Handle validation errors from service
		if (err.message.includes("Invalid slug") || err.message.includes("already taken")) {
			return json({ error: err.message }, { status: 400 });
		}

		return json(
			{
				error: "Failed to update company. Please try again.",
			},
			{ status: 500 }
		);
	}
}
