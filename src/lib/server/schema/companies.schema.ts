import { relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth.schema";

// Companies table - with specified fields
export const companies = pgTable("companies", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	slug: text("slug").notNull().unique(), // For public URLs like /c/company-slug
	address: text("address"),
	phone: text("phone"),
	email: text("email"),
	isActive: boolean("is_active").notNull().default(true),
	city: text("city"),
	state: text("state"),
	country: text("country"),
	vat: text("vat"),
	regNr: text("reg_nr"),
	logo: text("logo"), // Will store filename like "company-name_logo.jpg"
	description: text("description"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});

// Relations
export const companiesRelations = relations(companies, ({ one, many }) => ({
	user: one(user, {
		fields: [companies.userId],
		references: [user.id],
	}),
	// Calendar relations will be added when calendar schema is imported
	// meetingTypes: many(meetingTypes),
	// availability: many(availability),
	// calendarIntegrations: many(calendarIntegrations),
}));
