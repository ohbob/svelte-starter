import { auth } from "$lib/server/auth";
import { AvailabilityService } from "$lib/server/services";
import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent }) => {
	const { user, currentCompany } = await parent();

	if (!user || !currentCompany?.id) {
		redirect(302, "/signin");
	}

	return {
		currentCompany,
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
		} catch (error) {
			console.error("Error creating availability template:", error);
			return fail(500, { error: "Failed to create availability template" });
		}

		redirect(302, "/app/calendar/availability");
	},
};
