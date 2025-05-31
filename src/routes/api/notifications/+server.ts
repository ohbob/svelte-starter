import { auth } from "$lib/server/auth";
import { NotificationsManager } from "$lib/server/notifications";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url, request }) => {
	const session = await auth.api.getSession({
		headers: request.headers,
	});

	if (!session?.user?.id) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}

	const limit = parseInt(url.searchParams.get("limit") || "20");
	const offset = parseInt(url.searchParams.get("offset") || "0");
	const unreadOnly = url.searchParams.get("unreadOnly") === "true";

	try {
		const notifications = await NotificationsManager.getForUser(session.user.id, {
			limit,
			offset,
			unreadOnly,
		});

		const unreadCount = await NotificationsManager.getUnreadCount(session.user.id);

		return json({
			notifications,
			unreadCount,
			hasMore: notifications.length === limit,
		});
	} catch (error) {
		console.error("Error fetching notifications:", error);
		return json({ error: "Failed to fetch notifications" }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	const session = await auth.api.getSession({
		headers: request.headers,
	});

	if (!session?.user?.id) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { title, message, type = "info" } = await request.json();

		if (!title) {
			return json({ error: "Title is required" }, { status: 400 });
		}

		const notification = await NotificationsManager.create({
			userId: session.user.id,
			title,
			message,
			type,
		});

		return json({ notification }, { status: 201 });
	} catch (error) {
		console.error("Error creating notification:", error);
		return json({ error: "Failed to create notification" }, { status: 500 });
	}
};
