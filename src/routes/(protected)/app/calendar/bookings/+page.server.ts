import { auth } from "$lib/server/auth";
import { BookingService, CalendarIntegrationService } from "$lib/server/services";
import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent }) => {
	// Get session and company data from parent layouts
	const { user, currentCompany } = await parent();

	if (!user || !currentCompany?.id) {
		return {
			isCalendarConnected: false,
			calendarIntegration: null,
			bookings: [],
		};
	}

	try {
		const calendarService = new CalendarIntegrationService();
		const bookingService = new BookingService();

		const [calendarStatus, userBookings] = await Promise.all([
			calendarService.getCalendarStatus(currentCompany.id),
			bookingService.getByCompany(currentCompany.id, user.id),
		]);

		return {
			isCalendarConnected: calendarStatus.isConnected,
			calendarIntegration: calendarStatus.integration,
			bookings: userBookings,
		};
	} catch (error) {
		console.error("Error loading bookings:", error);
		return {
			isCalendarConnected: false,
			calendarIntegration: null,
			bookings: [],
		};
	}
};

export const actions: Actions = {
	approve: async ({ request, cookies }) => {
		const session = await auth.api.getSession({ headers: request.headers });

		if (!session) {
			return fail(401, { error: "Unauthorized" });
		}

		const selectedCompanyId = cookies.get("selectedCompanyId");
		if (!selectedCompanyId) {
			return fail(400, { error: "No company selected" });
		}

		const formData = await request.formData();
		const bookingId = formData.get("bookingId") as string;

		if (!bookingId) {
			return fail(400, { error: "Booking ID is required" });
		}

		try {
			const bookingService = new BookingService();
			await bookingService.approve(bookingId, session.user.id);

			return { success: true, message: "Booking approved successfully!" };
		} catch (error) {
			console.error("Error approving booking:", error);
			return fail(500, { error: "Failed to approve booking" });
		}
	},

	cancel: async ({ request, cookies }) => {
		const session = await auth.api.getSession({ headers: request.headers });

		if (!session) {
			return fail(401, { error: "Unauthorized" });
		}

		const selectedCompanyId = cookies.get("selectedCompanyId");
		if (!selectedCompanyId) {
			return fail(400, { error: "No company selected" });
		}

		const formData = await request.formData();
		const bookingId = formData.get("bookingId") as string;
		const reason = formData.get("reason") as string;

		if (!bookingId) {
			return fail(400, { error: "Booking ID is required" });
		}

		try {
			const bookingService = new BookingService();
			await bookingService.cancel(bookingId, session.user.id, reason);

			return { success: true, message: "Booking cancelled successfully!" };
		} catch (error) {
			console.error("Error cancelling booking:", error);
			return fail(500, { error: "Failed to cancel booking" });
		}
	},

	reject: async ({ request, cookies }) => {
		const session = await auth.api.getSession({ headers: request.headers });

		if (!session) {
			return fail(401, { error: "Unauthorized" });
		}

		const selectedCompanyId = cookies.get("selectedCompanyId");
		if (!selectedCompanyId) {
			return fail(400, { error: "No company selected" });
		}

		const formData = await request.formData();
		const bookingId = formData.get("bookingId") as string;
		const reason = formData.get("reason") as string;

		if (!bookingId) {
			return fail(400, { error: "Booking ID is required" });
		}

		try {
			const bookingService = new BookingService();
			await bookingService.reject(bookingId, session.user.id, reason);

			return { success: true, message: "Booking rejected successfully!" };
		} catch (error) {
			console.error("Error rejecting booking:", error);
			return fail(500, { error: "Failed to reject booking" });
		}
	},
};
