import { AvailabilityService, CalendarIntegrationService } from "$lib/server/services";
import { LocationService } from "$lib/server/services/calendar/location";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent }) => {
	// Get session and company data from parent layouts (including calendar status)
	const { user, currentCompany, isCalendarConnected, calendarIntegration } = await parent();

	if (!user || !currentCompany?.id) {
		return {
			isCalendarConnected: false,
			availabilityTemplates: [],
			locations: [],
			availableCalendars: [],
		};
	}

	try {
		const availabilityService = new AvailabilityService();
		const calendarIntegrationService = new CalendarIntegrationService();

		// Parallelize all data loading
		const [availabilityTemplates, locations, availableCalendars] = await Promise.all([
			availabilityService.getTemplates(currentCompany.id),
			LocationService.getByCompany(currentCompany.id),
			isCalendarConnected
				? calendarIntegrationService.getAvailableCalendars(currentCompany.id)
				: [],
		]);

		return {
			isCalendarConnected,
			calendarIntegration,
			availabilityTemplates,
			locations,
			availableCalendars,
		};
	} catch (error) {
		console.error("Error loading new meeting type data:", error);
		return {
			isCalendarConnected: false,
			availabilityTemplates: [],
			locations: [],
			availableCalendars: [],
		};
	}
};
