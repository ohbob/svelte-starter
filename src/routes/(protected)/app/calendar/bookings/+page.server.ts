import { CalendarManager } from "$lib/server/calendar";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent }) => {
	// Get session and company data from parent layouts
	const { user, currentCompany } = await parent();

	if (!user || !currentCompany?.id) {
		return {
			isCalendarConnected: false,
			calendarIntegration: null,
		};
	}

	try {
		const calendarManager = new CalendarManager();
		const calendarStatus = await calendarManager.getCalendarStatusByCompany(currentCompany.id);

		return {
			isCalendarConnected: calendarStatus.isConnected,
			calendarIntegration: calendarStatus.integration,
		};
	} catch (error) {
		console.error("Error loading bookings:", error);
		return {
			isCalendarConnected: false,
			calendarIntegration: null,
		};
	}
};
