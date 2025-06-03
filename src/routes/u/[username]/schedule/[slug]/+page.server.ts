import { db } from "$lib/server/db";
import { companies, user } from "$lib/server/schema";
import {
	AvailabilityService,
	CalendarIntegrationService,
	MeetingTypeService,
} from "$lib/server/services";
import { error } from "@sveltejs/kit";
import { addDays, addMinutes, format, startOfDay } from "date-fns";
import { eq, or } from "drizzle-orm";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, url }) => {
	// Extract username and meeting slug from the URL path
	const pathParts = url.pathname.split("/");
	const username = pathParts[2]; // /u/[username]/schedule/[meetingSlug]
	const meetingSlug = pathParts[4];

	try {
		// Find user by username or email
		const foundUser = await db.query.user.findFirst({
			where: or(eq(user.name, username), eq(user.email, username)),
		});

		if (!foundUser) {
			throw error(404, "User not found");
		}

		// Get user's first company (for now, assuming one company per user)
		const userCompany = await db.query.companies.findFirst({
			where: eq(companies.userId, foundUser.id),
		});

		if (!userCompany) {
			throw error(404, "No company found for user");
		}

		// Get the meeting type using the company ID
		const meetingTypeService = new MeetingTypeService();
		const meetingType = await meetingTypeService.getPublic(userCompany.id, meetingSlug);

		// Get availability for the next 30 days
		const availabilityService = new AvailabilityService();
		const availability = await availabilityService.getCompanyAvailability(userCompany.id);

		// Pre-load available slots for the next 14 days with optimized batch calendar requests
		const calendarIntegrationService = new CalendarIntegrationService();
		const today = startOfDay(new Date());
		const endDate = addDays(today, 14);

		// Make a single batch request for all 14 days instead of 14 separate requests
		let allBusyTimes: { start: Date; end: Date }[] = [];
		try {
			allBusyTimes = await calendarIntegrationService.getBusyTimesForCalendar(
				userCompany.id,
				meetingType.selectedCalendarId,
				today,
				endDate // Get busy times for entire 14-day period at once
			);
		} catch (err) {
			console.error("Error loading busy times for date range:", err);
		}

		// Now calculate slots for each day using the pre-loaded busy times
		const dateAvailability = new Map();
		for (let i = 0; i < 14; i++) {
			const date = addDays(today, i);
			const dateKey = date.toISOString().split("T")[0];

			try {
				// Filter busy times for this specific date
				const dayStart = startOfDay(date);
				const dayEnd = addDays(dayStart, 1);
				const dayBusyTimes = allBusyTimes.filter(
					(busy) => busy.start < dayEnd && busy.end > dayStart
				);

				// Calculate available slots based on availability and busy times
				const slots = calculateAvailableSlots(
					date,
					availability,
					dayBusyTimes,
					meetingType.duration
				);

				dateAvailability.set(dateKey, {
					hasSlots: slots.length > 0,
					slotsCount: slots.length,
					slots: slots,
				});
			} catch (err) {
				console.error(`Error calculating slots for ${dateKey}:`, err);
				dateAvailability.set(dateKey, {
					hasSlots: false,
					slotsCount: 0,
					slots: [],
				});
			}
		}

		return {
			meetingType,
			userId: foundUser.id,
			companyId: userCompany.id,
			hostName: foundUser.name || foundUser.email,
			username: foundUser.name || foundUser.email,
			availability,
			dateAvailability: Object.fromEntries(dateAvailability),
		};
	} catch (err) {
		console.error("Error loading booking page:", err);
		throw error(404, "Meeting type not found");
	}
};

// Helper function to calculate available slots
function calculateAvailableSlots(
	date: Date,
	availability: any[],
	busyTimes: { start: Date; end: Date }[],
	duration: number
) {
	const dayOfWeek = date.getDay();
	const dayAvailability = availability.filter((a) => a.dayOfWeek === dayOfWeek);

	if (dayAvailability.length === 0) {
		return [];
	}

	const slots = [];

	for (const avail of dayAvailability) {
		const [startHour, startMinute] = avail.startTime.split(":").map(Number);
		const [endHour, endMinute] = avail.endTime.split(":").map(Number);

		const startTime = new Date(date);
		startTime.setHours(startHour, startMinute, 0, 0);

		const endTime = new Date(date);
		endTime.setHours(endHour, endMinute, 0, 0);

		// Generate slots every 30 minutes (or meeting duration)
		let currentTime = new Date(startTime);

		while (addMinutes(currentTime, duration) <= endTime) {
			const slotEnd = addMinutes(currentTime, duration);

			// Check if this slot conflicts with any busy times
			const hasConflict = busyTimes.some((busy) => currentTime < busy.end && slotEnd > busy.start);

			if (!hasConflict && currentTime >= new Date()) {
				slots.push({
					start: currentTime.toISOString(),
					end: slotEnd.toISOString(),
					time: format(currentTime, "HH:mm"),
				});
			}

			currentTime = addMinutes(currentTime, 30); // 30-minute intervals
		}
	}

	return slots;
}
