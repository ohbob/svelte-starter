import { date, integer, jsonb, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth.schema";

// Daily aggregated view statistics
export const dailyAnalytics = pgTable(
	"daily_analytics",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		date: date("date").notNull(),
		views: integer("views").notNull().default(0),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		// Unique constraint for user + date combination
		userDateUnique: unique().on(table.userId, table.date),
	})
);

// Referrer analytics with campaign tracking
export const referrerAnalytics = pgTable(
	"referrer_analytics",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		date: date("date").notNull(),
		domain: text("domain").notNull(), // "twitter.com", "google.com"
		path: text("path"), // "/search", "/r/webdev/post" (max 5 levels)
		campaignParams: jsonb("campaign_params"), // {"utm_source": "twitter", "utm_campaign": "launch"}
		views: integer("views").notNull().default(0),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(table) => ({
		// Unique constraint for user + date + domain + path combination
		userDateDomainPathUnique: unique().on(table.userId, table.date, table.domain, table.path),
	})
);

// Keep the old analytics table for migration purposes (will be dropped later)
export const analytics = pgTable("analytics", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	path: text("path").notNull(),
	userAgent: text("user_agent"),
	ipAddress: text("ip_address"),
	referrer: text("referrer"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
