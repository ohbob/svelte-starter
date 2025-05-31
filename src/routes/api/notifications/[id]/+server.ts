import { auth } from "$lib/server/auth";
import { NotificationsManager } from "$lib/server/notifications";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const PATCH: RequestHandler = async ({ params, request }) => {
	const session = await auth.api.getSession({
		headers: request.headers,
	});

	if (!session?.user?.id) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { isRead } = await request.json();

		if (isRead === true) {
			await NotificationsManager.markAsRead(params.id, session.user.id);
		}

		return json({ success: true });
	} catch (error) {
		console.error("Error updating notification:", error);
		return json({ error: "Failed to update notification" }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, request }) => {
	const session = await auth.api.getSession({
		headers: request.headers,
	});

	if (!session?.user?.id) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		await NotificationsManager.delete(params.id, session.user.id);
		return json({ success: true });
	} catch (error) {
		console.error("Error deleting notification:", error);
		return json({ error: "Failed to delete notification" }, { status: 500 });
	}
};
