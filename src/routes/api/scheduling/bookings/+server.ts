import { BookingService } from "$lib/server/services";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

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
		const bookingService = new BookingService();
		const booking = await bookingService.create({
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
