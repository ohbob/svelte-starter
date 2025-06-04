import { BookingService } from "$lib/server/services";
import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
	const { slug, token } = params;

	if (!token || !slug) {
		return {
			booking: null,
			error: "Invalid cancellation link",
		};
	}

	try {
		const bookingService = new BookingService();
		const booking = await bookingService.getBookingByToken(token);

		if (!booking) {
			return {
				booking: null,
				error: "Booking not found or invalid cancellation link",
			};
		}

		// Verify the booking belongs to the company with this slug
		if (booking.meetingType.company.slug !== slug) {
			return {
				booking: null,
				error: "Invalid cancellation link",
			};
		}

		// Check if booking can be cancelled
		if (booking.status === "cancelled") {
			return {
				booking,
				error: "This booking has already been cancelled",
			};
		}

		if (booking.status !== "confirmed" && booking.status !== "pending") {
			return {
				booking,
				error: "This booking cannot be cancelled",
			};
		}

		// Check 24-hour rule
		const now = new Date();
		const bookingTime = new Date(booking.startTime);
		const hoursUntilBooking = (bookingTime.getTime() - now.getTime()) / (1000 * 60 * 60);

		if (hoursUntilBooking <= 24) {
			return {
				booking,
				error:
					"Bookings can only be cancelled more than 24 hours in advance. Please contact us directly for last-minute cancellations.",
				hoursUntilBooking: Math.round(hoursUntilBooking * 10) / 10, // Round to 1 decimal
			};
		}

		return {
			booking,
			error: null,
			hoursUntilBooking: Math.round(hoursUntilBooking * 10) / 10,
		};
	} catch (error) {
		console.error("Error loading booking for cancellation:", error);
		return {
			booking: null,
			error: "An error occurred while loading the booking",
		};
	}
};

export const actions: Actions = {
	cancel: async ({ params, request, url }) => {
		const { token } = params;

		if (!token) {
			return fail(400, { error: "Invalid cancellation link" });
		}

		const formData = await request.formData();
		const reason = formData.get("reason") as string;

		if (!reason || reason.trim().length === 0) {
			return fail(400, {
				error: "Please provide a reason for cancellation",
				reason: "",
			});
		}

		if (reason.trim().length < 10) {
			return fail(400, {
				error: "Please provide a more detailed reason (at least 10 characters)",
				reason: reason,
			});
		}

		try {
			const bookingService = new BookingService();
			console.log(`[CANCEL] Attempting to cancel booking with token: ${token}`);
			console.log(`[CANCEL] Reason: ${reason}`);

			await bookingService.cancelByClient(token, reason);
			console.log(`[CANCEL] Successfully cancelled booking with token: ${token}`);

			// Return success instead of redirecting to avoid the redirect being treated as an error
			return {
				success: true,
				message:
					"Your booking has been successfully cancelled. You should receive a confirmation email shortly.",
			};
		} catch (error) {
			console.error("Error cancelling booking:", error);
			console.error("Error details:", {
				message: error instanceof Error ? error.message : "Unknown error",
				stack: error instanceof Error ? error.stack : undefined,
				token,
				reason,
			});

			const errorMessage =
				error instanceof Error ? error.message : "An error occurred while cancelling the booking";

			return fail(400, {
				error: errorMessage,
				reason: reason,
			});
		}
	},
};
