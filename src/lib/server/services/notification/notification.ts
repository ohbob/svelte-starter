import { and, count, desc, eq } from "drizzle-orm";
import { db } from "../../db";
import { notifications, type Notification } from "../../schema";

export interface CreateNotificationData {
	userId: string;
	title: string;
	message?: string;
	type: "success" | "error" | "warning" | "info";
}

export interface GetNotificationsOptions {
	limit?: number;
	offset?: number;
	unreadOnly?: boolean;
}

export class NotificationService {
	async create(data: CreateNotificationData) {
		const notification = await db
			.insert(notifications)
			.values({
				userId: data.userId,
				title: data.title,
				message: data.message || "",
				type: data.type,
			})
			.returning();

		// Keep only latest 100 notifications per user
		await this.cleanupOldNotifications(data.userId);

		return notification[0];
	}

	async getByUser(userId: string, options: GetNotificationsOptions = {}) {
		const { limit = 20, offset = 0, unreadOnly = false } = options;

		if (unreadOnly) {
			return await db
				.select()
				.from(notifications)
				.where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
				.orderBy(desc(notifications.createdAt))
				.limit(limit)
				.offset(offset);
		}

		return await db
			.select()
			.from(notifications)
			.where(eq(notifications.userId, userId))
			.orderBy(desc(notifications.createdAt))
			.limit(limit)
			.offset(offset);
	}

	async getUnreadByUser(userId: string) {
		return await db.query.notifications.findMany({
			where: and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
			orderBy: [desc(notifications.createdAt)],
		});
	}

	async getUnreadCount(userId: string): Promise<number> {
		const [result] = await db
			.select({ count: count() })
			.from(notifications)
			.where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

		return result.count;
	}

	async markAsRead(notificationId: string, userId: string) {
		const updated = await db
			.update(notifications)
			.set({
				isRead: true,
			})
			.where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
			.returning();

		if (updated.length === 0) {
			throw new Error("Notification not found or unauthorized");
		}

		return updated[0];
	}

	async markAllAsRead(userId: string) {
		const updated = await db
			.update(notifications)
			.set({
				isRead: true,
			})
			.where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
			.returning();

		return updated;
	}

	async delete(notificationId: string, userId: string) {
		const deleted = await db
			.delete(notifications)
			.where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
			.returning();

		if (deleted.length === 0) {
			throw new Error("Notification not found or unauthorized");
		}

		return deleted[0];
	}

	async cleanup(olderThanDays: number = 30) {
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

		const deleted = await db.delete(notifications).where(
			and(
				eq(notifications.isRead, true)
				// Only delete read notifications older than cutoff
			)
		);

		return deleted;
	}

	// Clean up old notifications (keep only latest 100)
	private async cleanupOldNotifications(userId: string): Promise<void> {
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

	// Helper methods for different notification types
	async success(title: string, message: string = "", userId: string): Promise<Notification> {
		return this.create({
			userId,
			title,
			message,
			type: "success",
		});
	}

	async error(title: string, message: string = "", userId: string): Promise<Notification> {
		return this.create({
			userId,
			title,
			message,
			type: "error",
		});
	}

	async warning(title: string, message: string = "", userId: string): Promise<Notification> {
		return this.create({
			userId,
			title,
			message,
			type: "warning",
		});
	}

	async info(title: string, message: string = "", userId: string): Promise<Notification> {
		return this.create({
			userId,
			title,
			message,
			type: "info",
		});
	}
}
