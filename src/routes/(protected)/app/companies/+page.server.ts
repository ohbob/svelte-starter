import { auth } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { companies } from "$lib/server/schema";
import { redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ request, parent }) => {
	const session = await auth.api.getSession({ headers: request.headers });

	if (!session) {
		throw redirect(302, "/");
	}

	// Get current company from parent for highlighting
	const { currentCompany } = await parent();

	try {
		// Get user's companies directly
		const userCompanies = await db
			.select()
			.from(companies)
			.where(eq(companies.userId, session.user.id))
			.orderBy(companies.createdAt);

		return {
			companies: userCompanies,
			currentCompany, // Pass through for highlighting
		};
	} catch (error) {
		console.error("Error loading companies:", error);
		return {
			companies: [],
			currentCompany,
		};
	}
};
