import { SchedulingManager } from "$lib/server/scheduling";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

const schedulingManager = new SchedulingManager();

export const POST: RequestHandler = async ({ request }) => {
	try {
		const data = await request.json();

		const { meetingTypeId, hostUserId, guestName, guestEmail, guestPhone, guestNotes, startTime } =
			data;

		// Validate required fields
		if (!meetingTypeId || !hostUserId || !guestName || !guestEmail || !startTime) {
			return json({ error: "Missing required fields" }, { status: 400 });
		}

		// Create the booking
		const booking = await schedulingManager.createBooking({
			meetingTypeId,
			hostUserId,
			guestName,
			guestEmail,
			guestPhone,
			guestNotes,
			startTime: new Date(startTime),
		});

		return json({ booking });
	} catch (error) {
		console.error("Error creating booking:", error);
		return json({ error: "Failed to create booking" }, { status: 500 });
	}
};
