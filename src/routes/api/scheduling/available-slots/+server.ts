import { SchedulingManager } from "$lib/server/scheduling";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

const schedulingManager = new SchedulingManager();

export const GET: RequestHandler = async ({ url }) => {
	const userId = url.searchParams.get("userId");
	const meetingTypeId = url.searchParams.get("meetingTypeId");
	const dateParam = url.searchParams.get("date");

	if (!userId || !meetingTypeId || !dateParam) {
		return json({ error: "Missing required parameters" }, { status: 400 });
	}

	try {
		const date = new Date(dateParam);
		const slots = await schedulingManager.getAvailableSlots(userId, meetingTypeId, date);

		return json({ slots });
	} catch (error) {
		console.error("Error fetching available slots:", error);
		return json({ error: "Failed to fetch available slots" }, { status: 500 });
	}
};
