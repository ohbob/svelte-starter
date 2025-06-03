import { auth } from "$lib/server/auth";
import { CompanyService } from "$lib/server/services";
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ request, parent }) => {
	const session = await auth.api.getSession({ headers: request.headers });

	if (!session) {
		throw redirect(302, "/");
	}

	// Get current company from parent for highlighting
	const { currentCompany } = await parent();

	try {
		const companyService = new CompanyService();

		// Get user's companies
		const userCompanies = await companyService.getUserCompanies(session.user.id);

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
