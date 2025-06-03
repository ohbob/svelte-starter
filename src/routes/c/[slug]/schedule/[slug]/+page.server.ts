import { db } from "$lib/server/db";
import { companies } from "$lib/server/schema";
import {
	AvailabilityService,
	CalendarIntegrationService,
	MeetingTypeService,
} from "$lib/server/services";
import type { AvailabilitySlot } from "$lib/server/services/calendar/availability";
import { error } from "@sveltejs/kit";
import { addDays, addMinutes, format, startOfDay } from "date-fns";
import { eq } from "drizzle-orm";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, url }) => {
	// Extract company slug and meeting slug from the URL path
	const pathParts = url.pathname.split("/");
	const companySlug = pathParts[2]; // /c/[companySlug]/schedule/[meetingSlug]
	const meetingSlug = pathParts[4];

	try {
		// Find company by slug
		const foundCompany = await db.query.companies.findFirst({
			where: eq(companies.slug, companySlug),
			with: {
				user: true, // Include the user who owns the company
			},
		});

		if (!foundCompany) {
			throw error(404, "Company not found");
		}

		// Get the meeting type using the company ID
		const meetingTypeService = new MeetingTypeService();
		const meetingType = await meetingTypeService.getPublic(foundCompany.id, meetingSlug);

		// Get combined availability from all templates assigned to this meeting type
		const availabilityService = new AvailabilityService();
		let availability: AvailabilitySlot[] = [];

		try {
			availability = await availabilityService.getCombinedAvailabilityForMeetingType(
				meetingType.id
			);

			// If no availability templates are assigned to this meeting type, try to use the company's default template
			if (availability.length === 0) {
				const defaultTemplate = await availabilityService.getDefaultTemplate(foundCompany.id);
				if (defaultTemplate && defaultTemplate.slots) {
					availability = defaultTemplate.slots.map((slot) => ({
						dayOfWeek: slot.dayOfWeek,
						startTime: slot.startTime,
						endTime: slot.endTime,
					}));
				}
			}
		} catch (error) {
			console.error("Error loading combined availability:", error);
			// Fall back to empty availability - this will show no available times
			availability = [];
		}

		// Pre-load available slots for the next 14 days with optimized batch calendar requests
		const calendarIntegrationService = new CalendarIntegrationService();
		const today = startOfDay(new Date());
		const endDate = addDays(today, 14);

		// Make a single batch request for all 14 days instead of 14 separate requests
		let allBusyTimes: { start: Date; end: Date }[] = [];
		try {
			allBusyTimes = await calendarIntegrationService.getBusyTimesForCalendar(
				foundCompany.id,
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
			userId: foundCompany.userId, // The user who owns the company
			companyId: foundCompany.id,
			hostName: foundCompany.name, // Use company name as host name
			username: foundCompany.slug, // Use company slug for navigation
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
	availability: AvailabilitySlot[],
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
			const hasConflict = busyTimes.some((busy) => {
				const conflict = currentTime < busy.end && slotEnd > busy.start;
				if (conflict) {
					console.log(
						`Slot ${format(currentTime, "HH:mm")}-${format(slotEnd, "HH:mm")} conflicts with busy time ${format(busy.start, "HH:mm")}-${format(busy.end, "HH:mm")}`
					);
				}
				return conflict;
			});

			// Check if slot is in the future
			const isInFuture = currentTime >= new Date();

			if (!hasConflict && isInFuture) {
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
