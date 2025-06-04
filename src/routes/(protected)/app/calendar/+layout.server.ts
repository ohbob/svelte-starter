import { CalendarIntegrationService } from "$lib/server/services";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ parent }) => {
	// Get session and company data from parent layouts
	const { user, currentCompany } = await parent();

	if (!user || !currentCompany?.id) {
		return {
			isCalendarConnected: false,
			calendarIntegration: null,
		};
	}

	try {
		const calendarIntegrationService = new CalendarIntegrationService();
		const calendarStatus = await calendarIntegrationService.getCalendarStatus(currentCompany.id);

		return {
			isCalendarConnected: calendarStatus.isConnected,
			calendarIntegration: calendarStatus.integration,
		};
	} catch (error) {
		console.error("Error loading calendar status in layout:", error);
		return {
			isCalendarConnected: false,
			calendarIntegration: null,
		};
	}
};
