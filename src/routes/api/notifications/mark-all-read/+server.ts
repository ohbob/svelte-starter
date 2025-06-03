import { auth } from "$lib/server/auth";
import { NotificationService } from "$lib/server/services";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
	const session = await auth.api.getSession({
		headers: request.headers,
	});

	if (!session?.user?.id) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const notificationService = new NotificationService();
		await notificationService.markAllAsRead(session.user.id);
		return json({ success: true });
	} catch (error) {
		console.error("Error marking all notifications as read:", error);
		return json({ error: "Failed to mark notifications as read" }, { status: 500 });
	}
};
