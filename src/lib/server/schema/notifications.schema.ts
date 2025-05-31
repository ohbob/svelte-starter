import { boolean, index, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { user } from "./auth.schema";

export const notifications = pgTable(
	"notifications",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		title: varchar("title", { length: 255 }).notNull(),
		message: text("message"),
		type: varchar("type", { length: 50 }).default("info"), // 'success', 'error', 'warning', 'info'
		isRead: boolean("is_read").default(false),
		createdAt: timestamp("created_at").defaultNow(),
	},
	(table) => ({
		userNotificationsIdx: index("idx_user_notifications").on(table.userId, table.createdAt),
		unreadNotificationsIdx: index("idx_unread_notifications").on(
			table.userId,
			table.isRead,
			table.createdAt
		),
	})
);

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
