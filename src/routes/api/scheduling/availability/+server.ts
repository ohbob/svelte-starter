import { auth } from "$lib/server/auth";
import { AvailabilityService } from "$lib/server/services";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ request, url }) => {
	const session = await auth.api.getSession({ headers: request.headers });

	if (!session) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const companyId = url.searchParams.get("companyId");

		if (!companyId) {
			return json({ error: "Company ID is required" }, { status: 400 });
		}

		const availabilityService = new AvailabilityService();
		const availability = await availabilityService.getCompanyAvailability(companyId);
		return json({ availability });
	} catch (error) {
		console.error("Error fetching availability:", error);
		return json({ error: "Failed to fetch availability" }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	const session = await auth.api.getSession({ headers: request.headers });

	if (!session) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { availability, companyId } = await request.json();

		if (!companyId) {
			return json({ error: "Company ID is required" }, { status: 400 });
		}

		// Validate availability data
		if (!Array.isArray(availability)) {
			return json({ error: "Availability must be an array" }, { status: 400 });
		}

		// Validate each availability entry
		for (const avail of availability) {
			if (
				typeof avail.dayOfWeek !== "number" ||
				avail.dayOfWeek < 0 ||
				avail.dayOfWeek > 6 ||
				!avail.startTime ||
				!avail.endTime
			) {
				return json({ error: "Invalid availability data" }, { status: 400 });
			}
		}

		const availabilityService = new AvailabilityService();
		await availabilityService.setCompanyAvailability(companyId, session.user.id, availability);
		return json({ success: true });
	} catch (error) {
		console.error("Error setting availability:", error);
		return json({ error: "Failed to set availability" }, { status: 500 });
	}
};
