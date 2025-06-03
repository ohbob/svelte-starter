import { auth } from "$lib/server/auth";
import { CompanyService } from "$lib/server/services";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
	const session = await auth.api.getSession({ headers: request.headers });

	if (!session) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const data = await request.json();
		const { name, address, phone, email, city, state, country, vat, regNr, description } = data;

		if (!name || !name.trim()) {
			return json({ error: "Company name is required" }, { status: 400 });
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

		return json({ company: createdCompany });
	} catch (error) {
		console.error("Error creating company:", error);
		return json({ error: "Failed to create company" }, { status: 500 });
	}
};
