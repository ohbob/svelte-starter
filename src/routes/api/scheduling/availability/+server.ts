import { auth } from "$lib/server/auth";
import { SchedulingManager } from "$lib/server/scheduling";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

const schedulingManager = new SchedulingManager();

export const GET: RequestHandler = async ({ request }) => {
	const session = await auth.api.getSession({ headers: request.headers });

	if (!session) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const availability = await schedulingManager.getAvailability(session.user.id);
		return json({ availability });
	} catch (error) {
		console.error("Error fetching availability:", error);
		return json({ error: "Failed to fetch availability" }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	const session = await auth.api.getSession({ headers: request.headers });

	if (!session) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { availability } = await request.json();

		// Validate availability data
		if (!Array.isArray(availability)) {
			return json({ error: "Availability must be an array" }, { status: 400 });
		}

		// Validate each availability entry
		for (const avail of availability) {
			if (
				typeof avail.dayOfWeek !== "number" ||
				avail.dayOfWeek < 0 ||
				avail.dayOfWeek > 6 ||
				!avail.startTime ||
				!avail.endTime
			) {
				return json({ error: "Invalid availability data" }, { status: 400 });
			}
		}

		await schedulingManager.setAvailability(session.user.id, availability);
		return json({ success: true });
	} catch (error) {
		console.error("Error setting availability:", error);
		return json({ error: "Failed to set availability" }, { status: 500 });
	}
};
