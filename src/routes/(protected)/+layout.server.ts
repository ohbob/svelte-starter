import { auth } from "$lib/server/auth";
import { CompanyService } from "$lib/server/services";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ request, cookies }) => {
	const session = await auth.api.getSession({ headers: request.headers });

	if (!session?.user?.id) {
		return {
			user: null,
			companies: [],
			selectedCompany: null,
		};
	}

	const companyService = new CompanyService();

	// Get user's companies - ONLY id and name for selector
	const allUserCompanies = await companyService.getUserCompanies(session.user.id);
	const userCompanies = allUserCompanies.map((company) => ({
		id: company.id,
		name: company.name,
	}));

	// Get selected company from cookie
	const selectedCompanyId = cookies.get("selectedCompanyId");
	let selectedCompany = null;

	if (selectedCompanyId) {
		const company = userCompanies.find((c) => c.id === selectedCompanyId);
		if (company) {
			selectedCompany = company;
		}
	}

	// If no selected company or invalid selection, use the first company
	if (!selectedCompany && userCompanies.length > 0) {
		selectedCompany = userCompanies[0];
		// Set cookie for the first company
		cookies.set("selectedCompanyId", selectedCompany.id, {
			path: "/",
			maxAge: 60 * 60 * 24 * 30, // 30 days
			httpOnly: false,
			secure: false,
			sameSite: "lax",
		});
	}

	return {
		user: session.user,
		companies: userCompanies,
		selectedCompany,
	};
};
