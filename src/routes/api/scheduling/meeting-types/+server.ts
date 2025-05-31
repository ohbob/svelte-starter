import { auth } from "$lib/server/auth";
import { SchedulingManager } from "$lib/server/scheduling";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

const schedulingManager = new SchedulingManager();

export const GET: RequestHandler = async ({ request }) => {
	const session = await auth.api.getSession({ headers: request.headers });

	if (!session) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const meetingTypes = await schedulingManager.getMeetingTypes(session.user.id);
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
		if (!data.name || !data.duration) {
			return json({ error: "Name and duration are required" }, { status: 400 });
		}

		const meetingType = await schedulingManager.createMeetingType({
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
		return json({ error: "Failed to create meeting type" }, { status: 500 });
	}
};
