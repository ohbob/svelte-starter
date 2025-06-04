import { auth } from "$lib/server/auth";
import { CompanyService } from "$lib/server/services";
import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

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

export const actions: Actions = {
	create: async ({ request }) => {
		const session = await auth.api.getSession({ headers: request.headers });

		if (!session) {
			return fail(401, { error: "Unauthorized" });
		}

		try {
			const data = await request.formData();
			const name = data.get("name") as string;
			const address = data.get("address") as string;
			const phone = data.get("phone") as string;
			const email = data.get("email") as string;
			const city = data.get("city") as string;
			const state = data.get("state") as string;
			const country = data.get("country") as string;
			const vat = data.get("vat") as string;
			const regNr = data.get("regNr") as string;
			const description = data.get("description") as string;

			if (!name || !name.trim()) {
				return fail(400, { error: "Company name is required" });
			}

			const companyService = new CompanyService();

			const companyData = {
				userId: session.user.id,
				name: name.trim(),
				address: address?.trim() || null,
				phone: phone?.trim() || null,
				email: email?.trim() || null,
				city: city?.trim() || null,
				state: state?.trim() || null,
				country: country?.trim() || null,
				vat: vat?.trim() || null,
				regNr: regNr?.trim() || null,
				description: description?.trim() || null,
			};

			const createdCompany = await companyService.createCompany(companyData);

			return { success: true, company: createdCompany };
		} catch (error) {
			console.error("Error creating company:", error);
			return fail(500, { error: "Failed to create company" });
		}
	},
};
