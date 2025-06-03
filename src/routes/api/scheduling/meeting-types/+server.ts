import { auth } from "$lib/server/auth";
import { MeetingTypeService } from "$lib/server/services";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ request, url }) => {
	const session = await auth.api.getSession({ headers: request.headers });

	if (!session) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const companyId = url.searchParams.get("companyId");
		const meetingTypeService = new MeetingTypeService();

		let meetingTypes;
		if (companyId) {
			// Get meeting types for specific company
			meetingTypes = await meetingTypeService.getByCompany(companyId);
		} else {
			// Get meeting types for all user's companies
			meetingTypes = await meetingTypeService.getByUser(session.user.id);
		}

		return json({ meetingTypes });
	} catch (error) {
		console.error("Error fetching meeting types:", error);
		return json({ error: "Failed to fetch meeting types" }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	const session = await auth.api.getSession({ headers: request.headers });

	if (!session) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const data = await request.json();

		// Validate required fields
		if (!data.name || !data.duration || !data.companyId) {
			return json({ error: "Name, duration, and companyId are required" }, { status: 400 });
		}

		const meetingTypeService = new MeetingTypeService();
		const meetingType = await meetingTypeService.create({
			companyId: data.companyId,
			userId: session.user.id,
			name: data.name,
			description: data.description,
			duration: parseInt(data.duration),
			price: data.price ? parseInt(data.price) : 0,
			color: data.color,
			requiresConfirmation: data.requiresConfirmation || false,
			bufferTimeBefore: data.bufferTimeBefore ? parseInt(data.bufferTimeBefore) : 0,
			bufferTimeAfter: data.bufferTimeAfter ? parseInt(data.bufferTimeAfter) : 0,
			maxBookingsPerDay: data.maxBookingsPerDay ? parseInt(data.maxBookingsPerDay) : undefined,
		});

		return json({ meetingType }, { status: 201 });
	} catch (error) {
		console.error("Error creating meeting type:", error);
		if (error instanceof Error && error.message === "Company not found or unauthorized") {
			return json({ error: "Company not found or unauthorized" }, { status: 403 });
		}
		return json({ error: "Failed to create meeting type" }, { status: 500 });
	}
};
