import { auth } from "$lib/server/auth";
import { CalendarManager } from "$lib/server/calendar";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ request, cookies }) => {
	try {
		const session = await auth.api.getSession({ headers: request.headers });

		if (!session) {
			return json({ error: "Unauthorized" }, { status: 401 });
		}

		// Get current company from cookies
		const selectedCompanyId = cookies.get("selectedCompanyId");

		if (!selectedCompanyId) {
			return json({ error: "No company selected" }, { status: 400 });
		}

		const calendarManager = new CalendarManager();
		const availableCalendars = await calendarManager.getAvailableCalendars(selectedCompanyId);

		return json({ calendars: availableCalendars });
	} catch (error) {
		console.error("Error loading available calendars:", error);
		return json({ error: "Failed to load calendars" }, { status: 500 });
	}
};
