import { auth } from "$lib/server/auth";
import {
	AvailabilityService,
	BookingService,
	CalendarIntegrationService,
	MeetingTypeService,
} from "$lib/server/services";
import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent }) => {
	// Get session and company data from parent layouts
	const { user, currentCompany } = await parent();

	if (!user || !currentCompany?.id) {
		return {
			isCalendarConnected: false,
			calendarIntegration: null,
			availableCalendars: [],
			meetingTypes: [],
			availabilityTemplates: [],
			upcomingBookings: 0,
		};
	}

	try {
		const calendarIntegrationService = new CalendarIntegrationService();
		const meetingTypeService = new MeetingTypeService();
		const availabilityService = new AvailabilityService();
		const bookingService = new BookingService();

		// Parallelize all independent async operations
		const [calendarStatus, companyMeetingTypes, companyAvailabilityTemplates, totalBookings] =
			await Promise.all([
				calendarIntegrationService.getCalendarStatus(currentCompany.id),
				meetingTypeService.getByCompany(currentCompany.id),
				availabilityService.getTemplates(currentCompany.id),
				bookingService.getByCompany(currentCompany.id, user.id),
			]);

		// Get available calendars if connected (depends on calendar status)
		let availableCalendars = [];
		if (calendarStatus.isConnected) {
			try {
				availableCalendars = await calendarIntegrationService.getAvailableCalendars(
					currentCompany.id
				);
			} catch (error) {
				console.error("Error fetching available calendars:", error);
			}
		}

		return {
			isCalendarConnected: calendarStatus.isConnected,
			calendarIntegration: calendarStatus.integration,
			availableCalendars,
			meetingTypes: companyMeetingTypes,
			availabilityTemplates: companyAvailabilityTemplates,
			upcomingBookings: totalBookings.length,
		};
	} catch (error) {
		console.error("Error loading calendar data:", error);
		return {
			isCalendarConnected: false,
			calendarIntegration: null,
			availableCalendars: [],
			meetingTypes: [],
			availabilityTemplates: [],
			upcomingBookings: 0,
		};
	}
};

export const actions: Actions = {
	connect: async ({ request, cookies }) => {
		const session = await auth.api.getSession({ headers: request.headers });

		if (!session) {
			return fail(401, { error: "Unauthorized" });
		}

		// Get current company from cookies to verify user has a company selected
		const selectedCompanyId = cookies.get("selectedCompanyId");

		if (!selectedCompanyId) {
			return fail(400, { error: "No company selected" });
		}

		try {
			// Use companyId for calendar integration (but internally converts to userId)
			const calendarIntegrationService = new CalendarIntegrationService();
			const authUrl = calendarIntegrationService.generateAuthUrl(selectedCompanyId);

			throw redirect(302, authUrl);
		} catch (error) {
			if (error instanceof Response) {
				throw error; // Re-throw redirects
			}
			console.error("Error generating auth URL:", error);
			return fail(500, { error: "Failed to connect calendar" });
		}
	},

	disconnect: async ({ request, cookies }) => {
		const session = await auth.api.getSession({ headers: request.headers });

		if (!session) {
			return fail(401, { error: "Unauthorized" });
		}

		const selectedCompanyId = cookies.get("selectedCompanyId");

		if (!selectedCompanyId) {
			return fail(400, { error: "No company selected" });
		}

		try {
			const calendarIntegrationService = new CalendarIntegrationService();
			await calendarIntegrationService.disconnectCalendar(selectedCompanyId);

			return { success: true, message: "Calendar disconnected successfully!" };
		} catch (error) {
			console.error("Error disconnecting calendar:", error);
			return fail(500, { error: "Failed to disconnect calendar" });
		}
	},

	selectCalendar: async ({ request, cookies }) => {
		const session = await auth.api.getSession({ headers: request.headers });

		if (!session) {
			return fail(401, { error: "Unauthorized" });
		}

		const selectedCompanyId = cookies.get("selectedCompanyId");

		if (!selectedCompanyId) {
			return fail(400, { error: "No company selected" });
		}

		const formData = await request.formData();
		const calendarId = formData.get("calendarId") as string;

		if (!calendarId) {
			return fail(400, { error: "Calendar ID is required" });
		}

		try {
			const calendarIntegrationService = new CalendarIntegrationService();
			await calendarIntegrationService.selectCalendar(selectedCompanyId, calendarId);

			return { success: true, message: "Calendar selected successfully!" };
		} catch (error) {
			console.error("Error selecting calendar:", error);
			return fail(500, { error: "Failed to select calendar" });
		}
	},

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

	saveAvailability: async ({ request, cookies }) => {
		const session = await auth.api.getSession({ headers: request.headers });

		if (!session) {
			return fail(401, { error: "Unauthorized" });
		}

		const selectedCompanyId = cookies.get("selectedCompanyId");

		if (!selectedCompanyId) {
			return fail(400, { error: "No company selected" });
		}

		const formData = await request.formData();
		const availabilityData = JSON.parse(formData.get("availability") as string);

		if (!Array.isArray(availabilityData)) {
			return fail(400, { error: "Invalid availability data" });
		}

		try {
			const availabilityService = new AvailabilityService();
			await availabilityService.setCompanyAvailability(
				selectedCompanyId,
				session.user.id,
				availabilityData
			);

			return { success: true, message: "Availability updated successfully!" };
		} catch (error) {
			console.error("Error saving availability:", error);
			return fail(500, { error: "Failed to save availability" });
		}
	},
};
