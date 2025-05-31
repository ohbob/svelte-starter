import { and, count, desc, eq } from "drizzle-orm";
import { db } from "./db";
import { notifications, type NewNotification, type Notification } from "./schema";

export class NotificationsManager {
	// Create a new notification
	static async create(
		notification: Omit<NewNotification, "id" | "createdAt">
	): Promise<Notification> {
		const [newNotification] = await db.insert(notifications).values(notification).returning();

		// Keep only latest 100 notifications per user
		await this.cleanupOldNotifications(notification.userId);

		return newNotification;
	}

	// Get notifications for a user with pagination
	static async getForUser(
		userId: string,
		options: { limit?: number; offset?: number; unreadOnly?: boolean } = {}
	): Promise<Notification[]> {
		const { limit = 20, offset = 0, unreadOnly = false } = options;

		let query = db
			.select()
			.from(notifications)
			.where(eq(notifications.userId, userId))
			.orderBy(desc(notifications.createdAt))
			.limit(limit)
			.offset(offset);

		if (unreadOnly) {
			query = db
				.select()
				.from(notifications)
				.where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
				.orderBy(desc(notifications.createdAt))
				.limit(limit)
				.offset(offset);
		}

		return await query;
	}

	// Get unread count for a user
	static async getUnreadCount(userId: string): Promise<number> {
		const [result] = await db
			.select({ count: count() })
			.from(notifications)
			.where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

		return result.count;
	}

	// Mark notification as read
	static async markAsRead(notificationId: string, userId: string): Promise<void> {
		await db
			.update(notifications)
			.set({ isRead: true })
			.where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
	}

	// Mark all notifications as read for a user
	static async markAllAsRead(userId: string): Promise<void> {
		await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
	}

	// Delete a notification
	static async delete(notificationId: string, userId: string): Promise<void> {
		await db
			.delete(notifications)
			.where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
	}

	// Clean up old notifications (keep only latest 100)
	private static async cleanupOldNotifications(userId: string): Promise<void> {
		const userNotifications = await db
			.select({ id: notifications.id })
			.from(notifications)
			.where(eq(notifications.userId, userId))
			.orderBy(desc(notifications.createdAt))
			.offset(100); // Skip the latest 100

		if (userNotifications.length > 0) {
			const idsToDelete = userNotifications.map((n) => n.id);
			await db.delete(notifications).where(
				and(
					eq(notifications.userId, userId)
					// Delete notifications not in the latest 100
				)
			);
		}
	}
}

// Clean server-side notification API
export const notification = {
	success: async (
		title: string,
		message?: string,
		options: { userId: string } = { userId: "" }
	): Promise<Notification> => {
		return NotificationsManager.create({
			userId: options.userId,
			title,
			message,
			type: "success",
		});
	},

	error: async (
		title: string,
		message?: string,
		options: { userId: string } = { userId: "" }
	): Promise<Notification> => {
		return NotificationsManager.create({
			userId: options.userId,
			title,
			message,
			type: "error",
		});
	},

	warning: async (
		title: string,
		message?: string,
		options: { userId: string } = { userId: "" }
	): Promise<Notification> => {
		return NotificationsManager.create({
			userId: options.userId,
			title,
			message,
			type: "warning",
		});
	},

	info: async (
		title: string,
		message?: string,
		options: { userId: string } = { userId: "" }
	): Promise<Notification> => {
		return NotificationsManager.create({
			userId: options.userId,
			title,
			message,
			type: "info",
		});
	},
};
