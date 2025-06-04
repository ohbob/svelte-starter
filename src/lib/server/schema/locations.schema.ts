import { relations } from "drizzle-orm";
import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { companies } from "./companies.schema";

// Locations table - supports both in-person and virtual locations
export const locations = pgTable("locations", {
	id: uuid("id").primaryKey().defaultRandom(),
	companyId: text("company_id")
		.notNull()
		.references(() => companies.id, { onDelete: "cascade" }),
	name: text("name").notNull(), // "Main Office", "Conference Room A", "Google Meet", etc.
	type: text("type").notNull(), // "in-person" or "virtual"

	// For in-person locations
	address: text("address"), // Full address
	city: text("city"),
	state: text("state"),
	country: text("country"),
	postalCode: text("postal_code"),
	phone: text("phone"), // Location-specific phone
	contactPerson: text("contact_person"), // Who to contact at this location
	instructions: text("instructions"), // Parking, entrance, etc.

	// For virtual locations
	platform: text("platform"), // "google-meet", "zoom", "teams", "custom"
	autoGenerateLink: boolean("auto_generate_link").default(false), // Auto-create Google Meet links
	customMeetingUrl: text("custom_meeting_url"), // For fixed URLs or custom platforms
	meetingInstructions: text("meeting_instructions"), // How to join, dial-in numbers, etc.

	// Common fields
	description: text("description"), // Additional details about the location
	isActive: boolean("is_active").default(true).notNull(),
	isDefault: boolean("is_default").default(false).notNull(), // Default location for new meeting types

	// Metadata
	metadata: jsonb("metadata"), // For storing additional platform-specific settings

	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const locationsRelations = relations(locations, ({ one }) => ({
	company: one(companies, {
		fields: [locations.companyId],
		references: [companies.id],
	}),
}));

// Type definitions
export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;

// Location types enum for validation
export const LOCATION_TYPES = {
	IN_PERSON: "in-person",
	VIRTUAL: "virtual",
} as const;

export const VIRTUAL_PLATFORMS = {
	GOOGLE_MEET: "google-meet",
	ZOOM: "zoom",
	MICROSOFT_TEAMS: "teams",
	CUSTOM: "custom",
} as const;
