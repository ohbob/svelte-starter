import { auth } from "$lib/server/auth";
import {
	AvailabilityService,
	CalendarIntegrationService,
	MeetingTypeService,
} from "$lib/server/services";
import { LocationService } from "$lib/server/services/calendar/location";
import { error, fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, parent }) => {
	const { user, selectedCompany } = await parent();

	if (!user || !selectedCompany?.id) {
		throw error(401, "Unauthorized");
	}

	try {
		const meetingTypeService = new MeetingTypeService();
		const availabilityService = new AvailabilityService();
		const calendarService = new CalendarIntegrationService();

		const [meetingType, availabilityTemplates, calendarStatus, locations] = await Promise.all([
			meetingTypeService.getById(params.id),
			availabilityService.getTemplates(selectedCompany.id),
			calendarService.getCalendarStatus(selectedCompany.id),
			LocationService.getByCompany(selectedCompany.id),
		]);

		if (!meetingType) {
			throw error(404, "Meeting type not found");
		}

		// Get available calendars if connected
		let availableCalendars = [];
		if (calendarStatus.isConnected) {
			try {
				availableCalendars = await calendarService.getAvailableCalendars(selectedCompany.id);
			} catch (err) {
				console.error("Failed to load calendars:", err);
			}
		}

		return {
			meetingType,
			availabilityTemplates,
			availableCalendars,
			locations,
			isCalendarConnected: calendarStatus.isConnected,
		};
	} catch (err) {
		console.error("Error loading meeting type:", err);
		throw error(404, "Meeting type not found");
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
		const duration = parseInt(formData.get("duration") as string);
		const price = parseInt(formData.get("price") as string) || 0;
		const color = formData.get("color") as string;
		const requiresConfirmation = formData.get("requiresConfirmation") === "on";
		const bufferTimeBefore = parseInt(formData.get("bufferTimeBefore") as string) || 0;
		const bufferTimeAfter = parseInt(formData.get("bufferTimeAfter") as string) || 0;
		const availabilityTemplateIds = formData.getAll("availabilityTemplateIds") as string[];
		const selectedCalendarId = formData.get("selectedCalendarId") as string;
		const locationId = formData.get("locationId") as string;

		if (!name || !duration) {
			return fail(400, { error: "Name and duration are required" });
		}

		if (!availabilityTemplateIds || availabilityTemplateIds.length === 0) {
			return fail(400, { error: "At least one availability template must be selected" });
		}

		try {
			const meetingTypeService = new MeetingTypeService();
			await meetingTypeService.update(params.id, session.user.id, {
				name,
				description,
				duration,
				price,
				color: color || "#3b82f6",
				requiresConfirmation,
				bufferTimeBefore,
				bufferTimeAfter,
				availabilityTemplateIds,
				selectedCalendarId: selectedCalendarId || undefined,
				locationId: locationId || undefined,
			});
		} catch (error) {
			console.error("Error updating meeting type:", error);
			return fail(500, { error: "Failed to update meeting type" });
		}

		// Redirect after successful update
		redirect(302, "/app/calendar/meetings");
	},

	delete: async ({ params, cookies, request, locals }) => {
		const session = await auth.api.getSession({ headers: request.headers });

		if (!session) {
			return fail(401, { error: "Unauthorized" });
		}

		const selectedCompanyId = cookies.get("selectedCompanyId");

		if (!selectedCompanyId) {
			return fail(400, { error: "No company selected" });
		}

		try {
			const meetingTypeService = new MeetingTypeService();
			await meetingTypeService.delete(params.id, session.user.id);
		} catch (error) {
			console.error("Error deleting meeting type:", error);
			return fail(500, { error: "Failed to delete meeting type" });
		}

		// Redirect after successful deletion
		redirect(302, "/app/calendar/meetings");
	},
};
