import { auth } from "$lib/server/auth";
import { NotificationService } from "$lib/server/services/notification";
import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ request, url }) => {
	const session = await auth.api.getSession({
		headers: request.headers,
	});

	if (!session?.user?.id) {
		return {
			notifications: [],
			unreadCount: 0,
			total: 0,
		};
	}

	try {
		const notificationService = new NotificationService();

		// Get query parameters
		const page = parseInt(url.searchParams.get("page") || "1");
		const limit = parseInt(url.searchParams.get("limit") || "20");
		const unreadOnly = url.searchParams.get("unreadOnly") === "true";

		// Load notifications
		const [notifications, unreadCount] = await Promise.all([
			notificationService.getByUser(session.user.id, {
				page,
				limit,
				unreadOnly,
			}),
			notificationService.getUnreadCount(session.user.id),
		]);

		return {
			notifications: notifications.data,
			unreadCount,
			total: notifications.total,
			currentPage: page,
			hasMore: notifications.hasMore,
		};
	} catch (error) {
		console.error("Error loading notifications:", error);
		return {
			notifications: [],
			unreadCount: 0,
			total: 0,
		};
	}
};

export const actions: Actions = {
	markAsRead: async ({ request }) => {
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user?.id) {
			return fail(401, { error: "Unauthorized" });
		}

		const formData = await request.formData();
		const notificationId = formData.get("notificationId") as string;

		if (!notificationId) {
			return fail(400, { error: "Notification ID is required" });
		}

		try {
			const notificationService = new NotificationService();
			await notificationService.markAsRead(notificationId, session.user.id);
			return { success: true };
		} catch (error) {
			console.error("Error marking notification as read:", error);
			return fail(500, { error: "Failed to mark notification as read" });
		}
	},

	markAllAsRead: async ({ request }) => {
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user?.id) {
			return fail(401, { error: "Unauthorized" });
		}

		try {
			const notificationService = new NotificationService();
			await notificationService.markAllAsRead(session.user.id);
			return { success: true };
		} catch (error) {
			console.error("Error marking all notifications as read:", error);
			return fail(500, { error: "Failed to mark all notifications as read" });
		}
	},

	delete: async ({ request }) => {
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user?.id) {
			return fail(401, { error: "Unauthorized" });
		}

		const formData = await request.formData();
		const notificationId = formData.get("notificationId") as string;

		if (!notificationId) {
			return fail(400, { error: "Notification ID is required" });
		}

		try {
			const notificationService = new NotificationService();
			await notificationService.delete(notificationId, session.user.id);
			return { success: true };
		} catch (error) {
			console.error("Error deleting notification:", error);
			return fail(500, { error: "Failed to delete notification" });
		}
	},
};
