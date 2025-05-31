import { auth } from "$lib/server/auth";
import { CalendarManager } from "$lib/server/calendar";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
	const session = await auth.api.getSession({ headers: request.headers });

	if (!session?.user?.id) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { calendarId } = await request.json();

		if (!calendarId) {
			return json({ error: "Calendar ID is required" }, { status: 400 });
		}

		const calendarManager = new CalendarManager();
		await calendarManager.selectCalendar(session.user.id, calendarId);

		// Return updated integration
		const integration = await calendarManager.getIntegration(session.user.id);

		return json({ integration });
	} catch (error) {
		console.error("Error selecting calendar:", error);
		return json({ error: "Failed to select calendar" }, { status: 500 });
	}
};
