import { auth } from "$lib/server/auth";
import { CalendarManager } from "$lib/server/calendar";
import { SchedulingManager } from "$lib/server/scheduling";
import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent }) => {
	// Get session and company data from parent layouts
	const { user, currentCompany } = await parent();

	if (!user || !currentCompany?.id) {
		return {
			isCalendarConnected: false,
			calendarIntegration: null,
			availabilityTemplates: [],
		};
	}

	try {
		const calendarManager = new CalendarManager();
		const schedulingManager = new SchedulingManager();

		// Load calendar status (user-based) and availability templates (company-based)
		const [calendarStatus, companyAvailabilityTemplates] = await Promise.all([
			calendarManager.getCalendarStatusByCompany(currentCompany.id),
			schedulingManager.getAvailabilityTemplates(currentCompany.id),
		]);

		return {
			isCalendarConnected: calendarStatus.isConnected,
			calendarIntegration: calendarStatus.integration,
			availabilityTemplates: companyAvailabilityTemplates,
		};
	} catch (error) {
		console.error("Error loading availability templates:", error);
		return {
			isCalendarConnected: false,
			calendarIntegration: null,
			availabilityTemplates: [],
		};
	}
};

export const actions: Actions = {
	createTemplate: async ({ request, cookies }) => {
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

		if (!slotsData) {
			return fail(400, { error: "At least one time slot is required" });
		}

		try {
			const slots = JSON.parse(slotsData);
			const schedulingManager = new SchedulingManager();

			await schedulingManager.createAvailabilityTemplate({
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

	updateTemplate: async ({ request, cookies }) => {
		const session = await auth.api.getSession({ headers: request.headers });

		if (!session) {
			return fail(401, { error: "Unauthorized" });
		}

		const selectedCompanyId = cookies.get("selectedCompanyId");

		if (!selectedCompanyId) {
			return fail(400, { error: "No company selected" });
		}

		const formData = await request.formData();
		const templateId = formData.get("templateId") as string;
		const name = formData.get("name") as string;
		const description = formData.get("description") as string;
		const isDefault = formData.get("isDefault") === "on";
		const slotsData = formData.get("slots") as string;

		if (!templateId || !name) {
			return fail(400, { error: "Template ID and name are required" });
		}

		if (!slotsData) {
			return fail(400, { error: "At least one time slot is required" });
		}

		try {
			const slots = JSON.parse(slotsData);
			const schedulingManager = new SchedulingManager();

			await schedulingManager.updateAvailabilityTemplate(templateId, selectedCompanyId, {
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

	deleteTemplate: async ({ request, cookies }) => {
		const session = await auth.api.getSession({ headers: request.headers });

		if (!session) {
			return fail(401, { error: "Unauthorized" });
		}

		const selectedCompanyId = cookies.get("selectedCompanyId");

		if (!selectedCompanyId) {
			return fail(400, { error: "No company selected" });
		}

		const formData = await request.formData();
		const templateId = formData.get("templateId") as string;

		if (!templateId) {
			return fail(400, { error: "Template ID is required" });
		}

		try {
			const schedulingManager = new SchedulingManager();
			await schedulingManager.deleteAvailabilityTemplate(templateId, selectedCompanyId);

			return { success: true, message: "Availability template deleted successfully!" };
		} catch (error) {
			console.error("Error deleting availability template:", error);
			return fail(500, { error: "Failed to delete availability template" });
		}
	},
};
