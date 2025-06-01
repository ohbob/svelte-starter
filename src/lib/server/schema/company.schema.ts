import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth.schema";

export const companies = pgTable("companies", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),

	// Basic Information
	name: text("name").notNull(),
	tagline: text("tagline"),
	description: text("description"),
	industry: text("industry"),

	// Contact Information
	email: text("email").notNull(),
	phone: text("phone"),
	website: text("website"),

	// Address
	address: text("address"),
	city: text("city"),
	state: text("state"),
	zipCode: text("zip_code"),
	country: text("country"),

	// Business Settings
	timezone: text("timezone").default("America/New_York"),
	businessHours: text("business_hours"), // JSON string
	socialMedia: text("social_media"), // JSON string
	acceptsOnlineBooking: boolean("accepts_online_booking").default(true),
	requiresConfirmation: boolean("requires_confirmation").default(false),
	cancellationPolicy: text("cancellation_policy"),
	paymentMethods: text("payment_methods"), // JSON string
	languages: text("languages"), // JSON string

	// Timestamps
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
