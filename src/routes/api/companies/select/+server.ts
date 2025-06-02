import { auth } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { companies } from "$lib/server/schema";
import { json, type RequestHandler } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";

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

		// Verify that the company belongs to the user
		const company = await db
			.select()
			.from(companies)
			.where(and(eq(companies.id, companyId), eq(companies.userId, session.user.id)))
			.limit(1);

		if (!company.length) {
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

		return json({ success: true, company: company[0] });
	} catch (error) {
		console.error("Error selecting company:", error);
		return json({ error: "Failed to select company" }, { status: 500 });
	}
};
