import { BookingService } from "$lib/server/services";
import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, cookies }) => {
	if (!locals.user) {
		throw redirect(302, "/signin");
	}

	const currentCompany = cookies.get("current-company");
	if (!currentCompany) {
		throw redirect(302, "/app/companies");
	}

	const bookingService = new BookingService();
	const bookings = await bookingService.getByCompany(currentCompany, locals.user.id);

	return {
		bookings,
		isCalendarConnected: true, // We'll check this properly later
	};
};

export const actions: Actions = {
	approve: async ({ request, locals }) => {
		if (!locals.user?.id) {
			return fail(401, { error: "Unauthorized" });
		}

		const data = await request.formData();
		const bookingId = data.get("bookingId") as string;

		if (!bookingId) {
			return fail(400, { error: "Booking ID is required" });
		}

		try {
			const bookingService = new BookingService();
			await bookingService.approve(bookingId, locals.user.id);
			return { success: true, message: "Booking approved successfully" };
		} catch (error) {
			console.error("Error approving booking:", error);
			const message = error instanceof Error ? error.message : "Failed to approve booking";
			return fail(500, { error: message });
		}
	},

	reject: async ({ request, locals }) => {
		if (!locals.user?.id) {
			return fail(401, { error: "Unauthorized" });
		}

		const data = await request.formData();
		const bookingId = data.get("bookingId") as string;
		const reason = data.get("reason") as string;

		if (!bookingId) {
			return fail(400, { error: "Booking ID is required" });
		}

		try {
			const bookingService = new BookingService();
			await bookingService.reject(bookingId, locals.user.id, reason);
			return { success: true, message: "Booking rejected successfully" };
		} catch (error) {
			console.error("Error rejecting booking:", error);
			const message = error instanceof Error ? error.message : "Failed to reject booking";
			return fail(500, { error: message });
		}
	},

	cancel: async ({ request, locals }) => {
		if (!locals.user?.id) {
			return fail(401, { error: "Unauthorized" });
		}

		const data = await request.formData();
		const bookingId = data.get("bookingId") as string;
		const reason = data.get("reason") as string;

		if (!bookingId) {
			return fail(400, { error: "Booking ID is required" });
		}

		try {
			const bookingService = new BookingService();
			await bookingService.cancel(bookingId, locals.user.id, reason);
			return { success: true, message: "Booking cancelled successfully" };
		} catch (error) {
			console.error("Error cancelling booking:", error);
			const message = error instanceof Error ? error.message : "Failed to cancel booking";
			return fail(500, { error: message });
		}
	},
};
