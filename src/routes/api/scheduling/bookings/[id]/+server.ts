import { BookingService } from "$lib/server/services";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const PATCH: RequestHandler = async ({ request, params, locals }) => {
	try {
		const { id } = params;
		const data = await request.json();
		const { action, reason } = data;

		if (!locals.user?.id) {
			return json({ error: "Unauthorized" }, { status: 401 });
		}

		const bookingService = new BookingService();

		if (action === "approve") {
			const booking = await bookingService.approve(id, locals.user.id);
			return json({ booking, message: "Booking approved successfully" });
		} else if (action === "reject") {
			const booking = await bookingService.reject(id, locals.user.id, reason);
			return json({ booking, message: "Booking rejected successfully" });
		} else {
			return json({ error: "Invalid action. Use 'approve' or 'reject'" }, { status: 400 });
		}
	} catch (error) {
		console.error("Error updating booking:", error);
		const message = error instanceof Error ? error.message : "Failed to update booking";
		return json({ error: message }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	try {
		const { id } = params;

		if (!locals.user?.id) {
			return json({ error: "Unauthorized" }, { status: 401 });
		}

		const bookingService = new BookingService();
		const booking = await bookingService.cancel(id, locals.user.id);

		return json({ booking, message: "Booking cancelled successfully" });
	} catch (error) {
		console.error("Error cancelling booking:", error);
		const message = error instanceof Error ? error.message : "Failed to cancel booking";
		return json({ error: message }, { status: 500 });
	}
};
