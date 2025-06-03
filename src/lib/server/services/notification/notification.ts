import { and, desc, eq } from "drizzle-orm";
import { db } from "../../db";
import { notifications } from "../../schema";

export interface CreateNotificationData {
	userId: string;
	title: string;
	message: string;
	type: "success" | "error" | "warning" | "info";
}

export class NotificationService {
	async create(data: CreateNotificationData) {
		const notification = await db
			.insert(notifications)
			.values({
				userId: data.userId,
				title: data.title,
				message: data.message,
				type: data.type,
			})
			.returning();

		return notification[0];
	}

	async getByUser(userId: string, limit: number = 50) {
		return await db.query.notifications.findMany({
			where: eq(notifications.userId, userId),
			orderBy: [desc(notifications.createdAt)],
			limit,
		});
	}

	async getUnreadByUser(userId: string) {
		return await db.query.notifications.findMany({
			where: and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
			orderBy: [desc(notifications.createdAt)],
		});
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
}
