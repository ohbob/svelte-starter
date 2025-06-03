import { auth } from "$lib/server/auth";
import { CompanyService } from "$lib/server/services";
import { json, type RequestHandler } from "@sveltejs/kit";

export const POST: RequestHandler = async ({ request, cookies }) => {
	const session = await auth.api.getSession({ headers: request.headers });

	if (!session?.user?.id) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { companyId } = await request.json();

		if (!companyId) {
			return json({ error: "Company ID is required" }, { status: 400 });
		}

		const companyService = new CompanyService();

		// Verify that the company belongs to the user
		const company = await companyService.getCompanyById(companyId);

		if (!company || company.userId !== session.user.id) {
			return json({ error: "Company not found or access denied" }, { status: 404 });
		}

		// Set the cookie
		cookies.set("selectedCompanyId", companyId, {
			path: "/",
			maxAge: 60 * 60 * 24 * 30, // 30 days
			httpOnly: false, // Allow client-side access
			secure: false, // Set to true in production with HTTPS
			sameSite: "lax",
		});

		return json({ success: true, company });
	} catch (error) {
		console.error("Error selecting company:", error);
		return json({ error: "Failed to select company" }, { status: 500 });
	}
};
