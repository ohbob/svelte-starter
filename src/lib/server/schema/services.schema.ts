import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth.schema";

export const services = pgTable("services", {
	id: text("id").primaryKey(),
	title: text("title").notNull(),
	description: text("description").notNull(),
	price: text("price").notNull(), // Store as text for now
	category: text("category"), // e.g., "Web Development", "Design", "Consulting"
	isActive: boolean("is_active").notNull().default(true),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});
