import { db } from "$lib/server/db";
import { companies } from "$lib/server/schema";
import {
	AvailabilityService,
	CalendarIntegrationService,
	MeetingTypeService,
} from "$lib/server/services";
import type { AvailabilitySlot } from "$lib/server/services/calendar/availability";
import { json } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url }) => {
	const companySlug = url.searchParams.get("company");
	const meetingSlug = url.searchParams.get("meeting");

	if (!companySlug || !meetingSlug) {
		return json({ error: "Missing company or meeting slug" }, { status: 400 });
	}

	try {
		// Find company by slug
		const foundCompany = await db.query.companies.findFirst({
			where: eq(companies.slug, companySlug),
		});

		if (!foundCompany) {
			return json({ error: "Company not found" }, { status: 404 });
		}

		// Get the meeting type
		const meetingTypeService = new MeetingTypeService();
		const meetingType = await meetingTypeService.getPublic(foundCompany.id, meetingSlug);

		// Get combined availability
		const availabilityService = new AvailabilityService();
		let availability: AvailabilitySlot[] = [];
		let defaultTemplate = null;
		let error = null;

		try {
			availability = await availabilityService.getCombinedAvailabilityForMeetingType(
				meetingType.id
			);

			if (availability.length === 0) {
				defaultTemplate = await availabilityService.getDefaultTemplate(foundCompany.id);
			}
		} catch (err) {
			error = err instanceof Error ? err.message : "Unknown error";
		}

		// Check calendar integration
		const calendarIntegrationService = new CalendarIntegrationService();
		let calendarIntegration = null;
		let calendarError = null;

		try {
			calendarIntegration = await calendarIntegrationService.getCalendarIntegration(
				foundCompany.id
			);
		} catch (err) {
			calendarError = err instanceof Error ? err.message : "Unknown calendar error";
		}

		return json({
			company: {
				id: foundCompany.id,
				name: foundCompany.name,
				slug: foundCompany.slug,
			},
			meetingType: {
				id: meetingType.id,
				name: meetingType.name,
				slug: meetingType.slug,
				duration: meetingType.duration,
				selectedCalendarId: meetingType.selectedCalendarId,
			},
			availability: {
				slots: availability,
				count: availability.length,
			},
			defaultTemplate: defaultTemplate
				? {
						id: defaultTemplate.id,
						name: defaultTemplate.name,
						slotsCount: defaultTemplate.slots?.length || 0,
						slots: defaultTemplate.slots || [],
					}
				: null,
			calendarIntegration: calendarIntegration
				? {
						isConnected: true,
						provider: calendarIntegration.provider,
						selectedCalendarId: calendarIntegration.selectedCalendarId,
						selectedCalendarName: calendarIntegration.selectedCalendarName,
					}
				: {
						isConnected: false,
						error: calendarError,
					},
			error,
		});
	} catch (err) {
		return json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
	}
};
