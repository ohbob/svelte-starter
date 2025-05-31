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
		const calendarManager = new CalendarManager();
		await calendarManager.disconnectCalendar(session.user.id);

		return json({ success: true });
	} catch (error) {
		console.error("Error disconnecting calendar:", error);
		return json({ error: "Failed to disconnect calendar" }, { status: 500 });
	}
};
