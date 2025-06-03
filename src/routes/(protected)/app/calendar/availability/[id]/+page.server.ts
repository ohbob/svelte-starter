import { auth } from "$lib/server/auth";
import { AvailabilityService } from "$lib/server/services";
import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, parent }) => {
	const { user, currentCompany } = await parent();

	if (!user || !currentCompany?.id) {
		redirect(302, "/signin");
	}

	try {
		const availabilityService = new AvailabilityService();
		const template = await availabilityService.getTemplate(params.id, currentCompany.id);

		if (!template) {
			redirect(302, "/app/calendar/availability");
		}

		return {
			template,
			currentCompany,
		};
	} catch (error) {
		console.error("Error loading availability template:", error);
		redirect(302, "/app/calendar/availability");
	}
};

export const actions: Actions = {
	update: async ({ request, params, cookies }) => {
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

			await availabilityService.updateTemplate(params.id, selectedCompanyId, {
				name,
				description,
				isDefault,
				slots,
			});
		} catch (error) {
			console.error("Error updating availability template:", error);
			return fail(500, { error: "Failed to update availability template" });
		}

		redirect(302, "/app/calendar/availability");
	},

	delete: async ({ request, params, cookies }) => {
		const session = await auth.api.getSession({ headers: request.headers });

		if (!session) {
			return fail(401, { error: "Unauthorized" });
		}

		const selectedCompanyId = cookies.get("selectedCompanyId");

		if (!selectedCompanyId) {
			return fail(400, { error: "No company selected" });
		}

		try {
			const availabilityService = new AvailabilityService();
			const result = await availabilityService.deleteTemplate(
				params.id,
				selectedCompanyId,
				session.user.id
			);

			// If result is null, it means deletion was prevented (template is in use)
			// The notification has already been sent, so we just redirect back
			redirect(302, "/app/calendar/availability");
		} catch (error) {
			console.error("Error deleting availability template:", error);
			return fail(500, { error: "Failed to delete availability template" });
		}
	},
};
