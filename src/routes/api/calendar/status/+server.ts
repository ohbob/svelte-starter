import { auth } from "$lib/server/auth";
import { CalendarManager } from "$lib/server/calendar";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ request, url }) => {
	const session = await auth.api.getSession({ headers: request.headers });

	if (!session?.user?.id) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const calendarManager = new CalendarManager();
		const integration = await calendarManager.getIntegration(session.user.id);

		if (!integration) {
			return json({
				isConnected: false,
				integration: null,
				availableCalendars: [],
			});
		}

		// Only fetch available calendars if explicitly requested
		const includeCalendars = url.searchParams.get("includeCalendars") === "true";
		let availableCalendars = [];

		if (includeCalendars) {
			availableCalendars = await calendarManager.getAvailableCalendars(session.user.id);
		}

		return json({
			isConnected: true,
			integration,
			availableCalendars,
		});
	} catch (error) {
		console.error("Error checking calendar status:", error);
		return json({ error: "Failed to check calendar status" }, { status: 500 });
	}
};
