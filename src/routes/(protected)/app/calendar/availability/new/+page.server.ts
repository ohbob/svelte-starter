import { auth } from "$lib/server/auth";
import { AvailabilityService } from "$lib/server/services";
import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent }) => {
	// Get session and company data from parent layouts (including calendar status)
	const { user, currentCompany, isCalendarConnected } = await parent();

	if (!user || !currentCompany?.id) {
		throw redirect(302, "/app/companies");
	}

	return {
		isCalendarConnected,
	};
};

export const actions: Actions = {
	create: async ({ request, cookies }) => {
		const session = await auth.api.getSession({ headers: request.headers });

		if (!session) {
			return fail(401, { error: "Unauthorized" });
		}

		const selectedCompanyId = cookies.get("selectedCompanyId");

		if (!selectedCompanyId) {
			return fail(400, { error: "No company selected" });
		}

		const formData = await request.formData();
		const name = formData.get("name") as string;
		const description = formData.get("description") as string;
		const isDefault = formData.get("isDefault") === "on";
		const slotsData = formData.get("slots") as string;

		if (!name) {
			return fail(400, { error: "Template name is required" });
		}

		try {
			const slots = slotsData ? JSON.parse(slotsData) : [];
			const availabilityService = new AvailabilityService();

			await availabilityService.createTemplate({
				companyId: selectedCompanyId,
				name,
				description,
				isDefault,
				slots,
			});

			throw redirect(302, "/app/calendar/availability");
		} catch (error) {
			if (error instanceof Response) {
				throw error; // Re-throw redirects
			}
			console.error("Error creating availability template:", error);
			return fail(500, { error: "Failed to create availability template" });
		}
	},
};
