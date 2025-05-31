import { auth } from "$lib/server/auth";
import { CalendarManager } from "$lib/server/calendar";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ request }) => {
	const session = await auth.api.getSession({ headers: request.headers });

	if (!session?.user?.id) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const calendarManager = new CalendarManager();
		const availableCalendars = await calendarManager.getAvailableCalendars(session.user.id);

		return json({
			availableCalendars,
		});
	} catch (error) {
		console.error("Error fetching available calendars:", error);
		return json({ error: "Failed to fetch available calendars" }, { status: 500 });
	}
};
