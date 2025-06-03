import { auth } from "$lib/server/auth";
import { MeetingTypeService } from "$lib/server/services";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const PUT: RequestHandler = async ({ request, params }) => {
	const session = await auth.api.getSession({ headers: request.headers });

	if (!session) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const data = await request.json();
		const meetingTypeId = params.id;

		// Validate required fields
		if (!data.name || !data.duration) {
			return json({ error: "Name and duration are required" }, { status: 400 });
		}

		const meetingTypeService = new MeetingTypeService();
		const meetingType = await meetingTypeService.update(meetingTypeId, session.user.id, {
			name: data.name,
			description: data.description,
			duration: parseInt(data.duration),
			price: data.price ? parseInt(data.price) : 0,
			color: data.color,
			requiresConfirmation: data.requiresConfirmation || false,
			bufferTimeBefore: data.bufferTimeBefore ? parseInt(data.bufferTimeBefore) : 0,
			bufferTimeAfter: data.bufferTimeAfter ? parseInt(data.bufferTimeAfter) : 0,
		});

		return json({ meetingType });
	} catch (error) {
		console.error("Error updating meeting type:", error);
		if (error instanceof Error && error.message === "Meeting type not found or unauthorized") {
			return json({ error: "Meeting not found" }, { status: 404 });
		}
		return json({ error: "Failed to update meeting" }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ request, params }) => {
	const session = await auth.api.getSession({ headers: request.headers });

	if (!session) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const meetingTypeId = params.id;

		const meetingTypeService = new MeetingTypeService();
		await meetingTypeService.delete(meetingTypeId, session.user.id);

		return json({ success: true });
	} catch (error) {
		console.error("Error deleting meeting type:", error);
		if (error instanceof Error && error.message === "Meeting type not found or unauthorized") {
			return json({ error: "Meeting not found" }, { status: 404 });
		}
		return json({ error: "Failed to delete meeting" }, { status: 500 });
	}
};
