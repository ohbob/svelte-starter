import { auth } from "$lib/server/auth";
import { MeetingTypeService } from "$lib/server/services";
import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent }) => {
	const startTime = Date.now();

	// Get session and company data from parent layouts
	const { user, currentCompany } = await parent();

	if (!user || !currentCompany?.id) {
		return {
			meetingTypes: [],
		};
	}

	try {
		const meetingTypeService = new MeetingTypeService();

		// Only fetch meeting types - that's all this page needs!
		const companyMeetingTypes = await meetingTypeService.getByCompany(currentCompany.id);

		console.log(`Meetings page load took: ${Date.now() - startTime}ms`);

		return {
			meetingTypes: companyMeetingTypes,
		};
	} catch (error) {
		console.error("Error loading meeting types:", error);
		return {
			meetingTypes: [],
		};
	}
};

export const actions: Actions = {
	createMeetingType: async ({ request, cookies }) => {
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
		const duration = parseInt(formData.get("duration") as string);
		const price = parseInt(formData.get("price") as string);
		const color = formData.get("color") as string;
		const requiresConfirmation = formData.get("requiresConfirmation") === "on";
		const bufferTimeBefore = parseInt(formData.get("bufferTimeBefore") as string) || 0;
		const bufferTimeAfter = parseInt(formData.get("bufferTimeAfter") as string) || 0;
		const availabilityTemplateId = formData.get("availabilityTemplateId") as string;
		const selectedCalendarId = formData.get("selectedCalendarId") as string;
		const locationId = formData.get("locationId") as string;

		if (!name || !duration) {
			return fail(400, { error: "Name and duration are required" });
		}

		if (!availabilityTemplateId) {
			return fail(400, { error: "Please select an availability template" });
		}

		if (!selectedCalendarId) {
			return fail(400, { error: "Please select a calendar" });
		}

		try {
			const meetingTypeService = new MeetingTypeService();
			const meetingType = await meetingTypeService.create({
				companyId: selectedCompanyId,
				userId: session.user.id,
				name,
				description,
				duration,
				price: price || 0,
				color: color || "#3b82f6",
				requiresConfirmation,
				bufferTimeBefore,
				bufferTimeAfter,
				availabilityTemplateId,
				selectedCalendarId,
				locationId: locationId || undefined,
			});

			return { success: true, message: "Meeting type created successfully!", meetingType };
		} catch (error) {
			console.error("Error creating meeting type:", error);
			return fail(500, { error: "Failed to create meeting type" });
		}
	},

	updateMeetingType: async ({ request, cookies }) => {
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
		const duration = parseInt(formData.get("duration") as string);
		const price = parseInt(formData.get("price") as string);
		const color = formData.get("color") as string;
		const requiresConfirmation = formData.get("requiresConfirmation") === "on";
		const bufferTimeBefore = parseInt(formData.get("bufferTimeBefore") as string) || 0;
		const bufferTimeAfter = parseInt(formData.get("bufferTimeAfter") as string) || 0;
		const availabilityTemplateId = formData.get("availabilityTemplateId") as string;
		const selectedCalendarId = formData.get("selectedCalendarId") as string;

		if (!id || !name || !duration) {
			return fail(400, { error: "ID, name and duration are required" });
		}

		if (!availabilityTemplateId) {
			return fail(400, { error: "Please select an availability template" });
		}

		if (!selectedCalendarId) {
			return fail(400, { error: "Please select a calendar" });
		}

		try {
			const meetingTypeService = new MeetingTypeService();
			const meetingType = await meetingTypeService.update(id, session.user.id, {
				name,
				description,
				duration,
				price: price || 0,
				color: color || "#3b82f6",
				requiresConfirmation,
				bufferTimeBefore,
				bufferTimeAfter,
				availabilityTemplateId,
				selectedCalendarId,
			});

			return { success: true, message: "Meeting type updated successfully!", meetingType };
		} catch (error) {
			console.error("Error updating meeting type:", error);
			return fail(500, { error: "Failed to update meeting type" });
		}
	},

	deleteMeetingType: async ({ request, cookies }) => {
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
			return fail(400, { error: "Meeting type ID is required" });
		}

		try {
			const meetingTypeService = new MeetingTypeService();
			await meetingTypeService.delete(id, session.user.id);

			return { success: true, message: "Meeting type deleted successfully!" };
		} catch (error) {
			console.error("Error deleting meeting type:", error);
			return fail(500, { error: "Failed to delete meeting type" });
		}
	},
};
