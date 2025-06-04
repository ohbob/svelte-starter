import { auth } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { meetingTypes } from "$lib/server/schema/calendar.schema";
import { BookingService, CalendarIntegrationService } from "$lib/server/services";
import { fail } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent, url, cookies }) => {
	// Get session and company data from parent layouts
	const { user, currentCompany } = await parent();

	console.log("[BOOKINGS DEBUG] User:", user?.id);
	console.log("[BOOKINGS DEBUG] Current company:", currentCompany);

	// Also get the selected company from cookies as backup
	const selectedCompanyId = cookies.get("selectedCompanyId");
	const companyId = currentCompany?.id || selectedCompanyId;

	if (!user || !companyId) {
		console.log("[BOOKINGS DEBUG] No user or company, returning empty data");
		return {
			isCalendarConnected: false,
			calendarIntegration: null,
			bookings: [],
			meetingTypes: [],
			totalBookings: 0,
			currentPage: 1,
			totalPages: 1,
			searchQuery: "",
			statusFilter: "all",
		};
	}

	// Get search and pagination parameters
	const searchQuery = url.searchParams.get("q") || url.searchParams.get("search") || "";
	const statusFilter = url.searchParams.get("status") || "all";
	const page = parseInt(url.searchParams.get("page") || "1");
	const limit = 10; // bookings per page

	console.log("[BOOKINGS DEBUG] Search params:", { searchQuery, statusFilter, page, limit });
	console.log("[BOOKINGS DEBUG] Using company ID:", companyId);

	try {
		const calendarService = new CalendarIntegrationService();
		const bookingService = new BookingService();

		const [calendarStatus, bookingsResult, companyMeetingTypes] = await Promise.all([
			calendarService.getCalendarStatus(companyId),
			bookingService.getByCompanyWithFilters(companyId, user.id, {
				search: searchQuery,
				status: statusFilter === "all" ? undefined : statusFilter,
				page,
				limit,
			}),
			db
				.select()
				.from(meetingTypes)
				.where(and(eq(meetingTypes.companyId, companyId), eq(meetingTypes.isActive, true))),
		]);

		console.log("[BOOKINGS DEBUG] Calendar status:", calendarStatus.isConnected);
		console.log("[BOOKINGS DEBUG] Meeting types found:", companyMeetingTypes.length);
		console.log("[BOOKINGS DEBUG] Bookings result:", {
			total: bookingsResult.total,
			bookingsCount: bookingsResult.bookings.length,
			firstBooking: bookingsResult.bookings[0]
				? {
						id: bookingsResult.bookings[0].id,
						guestName: bookingsResult.bookings[0].guestName,
						status: bookingsResult.bookings[0].status,
					}
				: null,
		});

		return {
			isCalendarConnected: calendarStatus.isConnected,
			calendarIntegration: calendarStatus.integration,
			bookings: bookingsResult.bookings,
			meetingTypes: companyMeetingTypes,
			totalBookings: bookingsResult.total,
			currentPage: page,
			totalPages: Math.ceil(bookingsResult.total / limit),
			searchQuery,
			statusFilter,
		};
	} catch (error) {
		console.error("Error loading bookings:", error);
		return {
			isCalendarConnected: false,
			calendarIntegration: null,
			bookings: [],
			meetingTypes: [],
			totalBookings: 0,
			currentPage: 1,
			totalPages: 1,
			searchQuery: "",
			statusFilter: "all",
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

	addBooking: async ({ request, cookies }) => {
		const session = await auth.api.getSession({ headers: request.headers });

		if (!session) {
			return fail(401, { error: "Unauthorized" });
		}

		const selectedCompanyId = cookies.get("selectedCompanyId");
		if (!selectedCompanyId) {
			return fail(400, { error: "No company selected" });
		}

		const formData = await request.formData();
		const meetingTypeId = formData.get("meetingTypeId") as string;
		const guestName = formData.get("guestName") as string;
		const guestEmail = formData.get("guestEmail") as string;
		const guestPhone = formData.get("guestPhone") as string;
		const guestNotes = formData.get("guestNotes") as string;
		const hostNotes = formData.get("hostNotes") as string;
		const date = formData.get("date") as string;
		const time = formData.get("time") as string;
		const status = formData.get("status") as string;

		// Validate required fields
		if (!meetingTypeId || !guestName?.trim() || !guestEmail?.trim() || !date || !time) {
			return fail(400, { error: "Meeting type, guest name, email, date, and time are required" });
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(guestEmail)) {
			return fail(400, { error: "Please enter a valid email address" });
		}

		try {
			// Combine date and time into a proper datetime
			const startTime = new Date(`${date}T${time}`);

			if (isNaN(startTime.getTime())) {
				return fail(400, { error: "Invalid date or time format" });
			}

			// Check if the date is in the past
			if (startTime < new Date()) {
				return fail(400, { error: "Cannot create booking for past date/time" });
			}

			const bookingService = new BookingService();

			// Create the booking (status will be determined by meeting type's requiresConfirmation setting)
			const booking = await bookingService.create({
				meetingTypeId,
				hostUserId: session.user.id,
				guestName: guestName.trim(),
				guestEmail: guestEmail.trim(),
				guestPhone: guestPhone?.trim() || undefined,
				guestNotes: guestNotes?.trim() || undefined,
				startTime,
			});

			// Add host notes separately if provided
			if (hostNotes?.trim()) {
				await bookingService.addHostNote(booking.id, session.user.id, hostNotes.trim());
			}

			// Handle status changes if needed (only if different from the automatic status)
			if (status === "confirmed" && booking.status === "pending") {
				await bookingService.approve(booking.id, session.user.id);
			} else if (status === "rejected" && booking.status !== "rejected") {
				await bookingService.reject(booking.id, session.user.id, "Manually rejected by operator");
			} else if (status === "cancelled" && booking.status !== "cancelled") {
				await bookingService.cancel(booking.id, session.user.id, "Manually cancelled by operator");
			}

			return { success: true, message: "Booking created successfully!" };
		} catch (error) {
			console.error("Error creating booking:", error);
			return fail(500, { error: "Failed to create booking" });
		}
	},

	addNote: async ({ request, cookies }) => {
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
		const note = formData.get("note") as string;

		if (!bookingId) {
			return fail(400, { error: "Booking ID is required" });
		}

		if (!note?.trim()) {
			return fail(400, { error: "Note content is required" });
		}

		try {
			const bookingService = new BookingService();
			await bookingService.addHostNote(bookingId, session.user.id, note.trim());

			return { success: true, message: "Note saved successfully!" };
		} catch (error) {
			console.error("Error adding note:", error);
			return fail(500, { error: "Failed to save note" });
		}
	},

	getAvailableSlots: async ({ request, cookies }) => {
		const session = await auth.api.getSession({ headers: request.headers });

		if (!session) {
			return fail(401, { error: "Unauthorized" });
		}

		const selectedCompanyId = cookies.get("selectedCompanyId");
		if (!selectedCompanyId) {
			return fail(400, { error: "No company selected" });
		}

		const formData = await request.formData();
		const meetingTypeId = formData.get("meetingTypeId") as string;
		const date = formData.get("date") as string;

		if (!meetingTypeId || !date) {
			return fail(400, { error: "Meeting type and date are required" });
		}

		try {
			// Get the meeting type to understand duration and availability settings
			const meetingType = await db
				.select()
				.from(meetingTypes)
				.where(
					and(eq(meetingTypes.id, meetingTypeId), eq(meetingTypes.companyId, selectedCompanyId))
				)
				.limit(1);

			if (meetingType.length === 0) {
				return fail(404, { error: "Meeting type not found" });
			}

			const calendarService = new CalendarIntegrationService();

			// Get available slots for the date
			// This would typically check:
			// 1. Company availability templates
			// 2. Existing bookings
			// 3. Calendar integration availability
			const targetDate = new Date(date);
			const slots = [];

			// For now, generate basic time slots (9 AM to 5 PM, 30-minute intervals)
			// In a real implementation, this would use the availability service
			for (let hour = 9; hour < 17; hour++) {
				for (let minute = 0; minute < 60; minute += 30) {
					const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
					const displayTime = new Date(`${date}T${timeString}`).toLocaleTimeString("en-US", {
						hour: "numeric",
						minute: "2-digit",
						hour12: true,
					});

					slots.push({
						time: timeString,
						display: displayTime,
					});
				}
			}

			return {
				success: true,
				data: { slots },
			};
		} catch (error) {
			console.error("Error getting available slots:", error);
			return fail(500, { error: "Failed to get available slots" });
		}
	},
};
