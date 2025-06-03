import { auth } from "$lib/server/auth";
import { AvailabilityService } from "$lib/server/services";
import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent }) => {
	const { user, currentCompany } = await parent();

	if (!user || !currentCompany?.id) {
		return {
			templates: [],
		};
	}

	try {
		const availabilityService = new AvailabilityService();
		const templates = await availabilityService.getTemplates(currentCompany.id);

		return {
			templates,
		};
	} catch (error) {
		console.error("Error loading availability templates:", error);
		return {
			templates: [],
		};
	}
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

			return { success: true, message: "Availability template created successfully!" };
		} catch (error) {
			console.error("Error creating availability template:", error);
			return fail(500, { error: "Failed to create availability template" });
		}
	},

	update: async ({ request, cookies }) => {
		const session = await auth.api.getSession({ headers: request.headers });

		if (!session) {
			return fail(401, { error: "Unauthorized" });
		}

		const selectedCompanyId = cookies.get("selectedCompanyId");

		if (!selectedCompanyId) {
			return fail(400, { error: "No company selected" });
		}

		const formData = await request.formData();
		const id = formData.get("id") as string;
		const name = formData.get("name") as string;
		const description = formData.get("description") as string;
		const isDefault = formData.get("isDefault") === "on";
		const slotsData = formData.get("slots") as string;

		if (!id || !name) {
			return fail(400, { error: "Template ID and name are required" });
		}

		try {
			const slots = slotsData ? JSON.parse(slotsData) : [];
			const availabilityService = new AvailabilityService();

			await availabilityService.updateTemplate(id, selectedCompanyId, {
				name,
				description,
				isDefault,
				slots,
			});

			return { success: true, message: "Availability template updated successfully!" };
		} catch (error) {
			console.error("Error updating availability template:", error);
			return fail(500, { error: "Failed to update availability template" });
		}
	},

	delete: async ({ request, cookies }) => {
		const session = await auth.api.getSession({ headers: request.headers });

		if (!session) {
			return fail(401, { error: "Unauthorized" });
		}

		const selectedCompanyId = cookies.get("selectedCompanyId");

		if (!selectedCompanyId) {
			return fail(400, { error: "No company selected" });
		}

		const formData = await request.formData();
		const id = formData.get("id") as string;

		if (!id) {
			return fail(400, { error: "Template ID is required" });
		}

		try {
			const availabilityService = new AvailabilityService();
			const result = await availabilityService.deleteTemplate(
				id,
				selectedCompanyId,
				session.user.id
			);

			// If result is null, deletion was prevented (template is in use)
			// The notification has already been sent
			return { success: true };
		} catch (error) {
			console.error("Error deleting availability template:", error);
			return fail(500, { error: "Failed to delete availability template" });
		}
	},
};
