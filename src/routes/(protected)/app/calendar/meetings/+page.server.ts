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
			meetingTypes: [],
			availability: [],
		};
	}

	try {
		const calendarManager = new CalendarManager();
		const schedulingManager = new SchedulingManager();

		// Load calendar status and meeting types
		const [calendarStatus, companyMeetingTypes, companyAvailability] = await Promise.all([
			calendarManager.getCalendarStatusByCompany(currentCompany.id),
			schedulingManager.getCompanyMeetingTypes(currentCompany.id),
			schedulingManager.getAvailability(currentCompany.id),
		]);

		return {
			isCalendarConnected: calendarStatus.isConnected,
			calendarIntegration: calendarStatus.integration,
			meetingTypes: companyMeetingTypes,
			availability: companyAvailability,
		};
	} catch (error) {
		console.error("Error loading meeting types:", error);
		return {
			isCalendarConnected: false,
			calendarIntegration: null,
			meetingTypes: [],
			availability: [],
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

		if (!name || !duration) {
			return fail(400, { error: "Name and duration are required" });
		}

		try {
			const schedulingManager = new SchedulingManager();
			const meetingType = await schedulingManager.createMeetingType({
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

		if (!id || !name || !duration) {
			return fail(400, { error: "ID, name and duration are required" });
		}

		try {
			const schedulingManager = new SchedulingManager();
			const meetingType = await schedulingManager.updateMeetingType(id, session.user.id, {
				name,
				description,
				duration,
				price: price || 0,
				color: color || "#3b82f6",
				requiresConfirmation,
				bufferTimeBefore,
				bufferTimeAfter,
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
			const schedulingManager = new SchedulingManager();
			await schedulingManager.deleteMeetingType(id, session.user.id);

			return { success: true, message: "Meeting type deleted successfully!" };
		} catch (error) {
			console.error("Error deleting meeting type:", error);
			return fail(500, { error: "Failed to delete meeting type" });
		}
	},
};
