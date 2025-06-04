import { relations } from "drizzle-orm";
import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth.schema";
import { companies } from "./companies.schema";
import { locations } from "./locations.schema";

// Updated calendar integrations - now user-based instead of company-based
export const calendarIntegrations = pgTable("calendar_integrations", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	provider: text("provider").notNull().default("google"),
	accessToken: text("access_token").notNull(),
	refreshToken: text("refresh_token"),
	expiresAt: timestamp("expires_at"),
	calendarId: text("calendar_id"),
	selectedCalendarId: text("selected_calendar_id"),
	selectedCalendarName: text("selected_calendar_name"),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// New availability templates system (company-level)
export const availabilityTemplates = pgTable("availability_templates", {
	id: uuid("id").primaryKey().defaultRandom(),
	companyId: text("company_id")
		.notNull()
		.references(() => companies.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	description: text("description"),
	isDefault: boolean("is_default").default(false).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// New availability slots for templates
export const availabilitySlots = pgTable("availability_slots", {
	id: uuid("id").primaryKey().defaultRandom(),
	templateId: uuid("template_id")
		.notNull()
		.references(() => availabilityTemplates.id, { onDelete: "cascade" }),
	dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
	startTime: text("start_time").notNull(), // "09:00"
	endTime: text("end_time").notNull(), // "17:00"
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Meeting types - like "30min call", "1hr consultation", etc. - per company
export const meetingTypes = pgTable("meeting_types", {
	id: uuid("id").primaryKey().defaultRandom(),
	companyId: text("company_id")
		.notNull()
		.references(() => companies.id, { onDelete: "cascade" }),
	locationId: uuid("location_id").references(() => locations.id, { onDelete: "restrict" }), // Optional location for backward compatibility
	name: text("name").notNull(), // "30 Minute Meeting"
	slug: text("slug").notNull(), // "30min-meeting"
	description: text("description"),
	duration: integer("duration").notNull(), // minutes
	price: integer("price").default(0), // cents, 0 = free
	color: text("color").default("#3b82f6"), // hex color
	selectedCalendarId: text("selected_calendar_id"), // Google Calendar ID to create events in
	isActive: boolean("is_active").notNull().default(true),
	requiresConfirmation: boolean("requires_confirmation").notNull().default(false),
	bufferTimeBefore: integer("buffer_time_before").default(0), // minutes
	bufferTimeAfter: integer("buffer_time_after").default(0), // minutes
	maxBookingsPerDay: integer("max_bookings_per_day"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Junction table for meeting types and availability templates (many-to-many)
export const meetingTypeAvailabilityTemplates = pgTable("meeting_type_availability_templates", {
	id: uuid("id").primaryKey().defaultRandom(),
	meetingTypeId: uuid("meeting_type_id")
		.notNull()
		.references(() => meetingTypes.id, { onDelete: "cascade" }),
	availabilityTemplateId: uuid("availability_template_id")
		.notNull()
		.references(() => availabilityTemplates.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Legacy availability table - keeping for backward compatibility during migration
export const availability = pgTable("availability", {
	id: uuid("id").primaryKey().defaultRandom(),
	companyId: text("company_id")
		.notNull()
		.references(() => companies.id, { onDelete: "cascade" }),
	dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 1 = Monday, etc.
	startTime: text("start_time").notNull(), // "09:00"
	endTime: text("end_time").notNull(), // "17:00"
	isActive: boolean("is_active").notNull().default(true),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Bookings - actual scheduled meetings
export const bookings = pgTable("bookings", {
	id: uuid("id").primaryKey().defaultRandom(),
	meetingTypeId: uuid("meeting_type_id")
		.notNull()
		.references(() => meetingTypes.id, { onDelete: "cascade" }),
	hostUserId: text("host_user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	guestName: text("guest_name").notNull(),
	guestEmail: text("guest_email").notNull(),
	guestPhone: text("guest_phone"),
	guestNotes: text("guest_notes"),
	hostNotes: text("host_notes"), // Host's private notes about the booking
	startTime: timestamp("start_time").notNull(),
	endTime: timestamp("end_time").notNull(),
	status: text("status").notNull().default("confirmed"), // confirmed, cancelled, completed
	googleEventId: text("google_event_id"), // Google Calendar event ID
	meetingLink: text("meeting_link"), // Zoom, Meet, etc.
	cancellationReason: text("cancellation_reason"),
	cancellationToken: text("cancellation_token").unique(), // Secure token for client cancellation
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Booking questions - custom questions for meeting types
export const bookingQuestions = pgTable("booking_questions", {
	id: uuid("id").primaryKey().defaultRandom(),
	meetingTypeId: uuid("meeting_type_id")
		.notNull()
		.references(() => meetingTypes.id, { onDelete: "cascade" }),
	question: text("question").notNull(),
	type: text("type").notNull().default("text"), // text, email, phone, select, textarea
	options: text("options"), // JSON array for select type
	isRequired: boolean("is_required").notNull().default(false),
	order: integer("order").notNull().default(0),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Booking answers - responses to custom questions
export const bookingAnswers = pgTable("booking_answers", {
	id: uuid("id").primaryKey().defaultRandom(),
	bookingId: uuid("booking_id")
		.notNull()
		.references(() => bookings.id, { onDelete: "cascade" }),
	questionId: uuid("question_id")
		.notNull()
		.references(() => bookingQuestions.id, { onDelete: "cascade" }),
	answer: text("answer").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const calendarIntegrationsRelations = relations(calendarIntegrations, ({ one }) => ({
	user: one(user, {
		fields: [calendarIntegrations.userId],
		references: [user.id],
	}),
}));

export const availabilityTemplatesRelations = relations(availabilityTemplates, ({ one, many }) => ({
	company: one(companies, {
		fields: [availabilityTemplates.companyId],
		references: [companies.id],
	}),
	slots: many(availabilitySlots),
	meetingTypes: many(meetingTypeAvailabilityTemplates),
}));

export const availabilitySlotsRelations = relations(availabilitySlots, ({ one }) => ({
	template: one(availabilityTemplates, {
		fields: [availabilitySlots.templateId],
		references: [availabilityTemplates.id],
	}),
}));

export const meetingTypesRelations = relations(meetingTypes, ({ one, many }) => ({
	company: one(companies, {
		fields: [meetingTypes.companyId],
		references: [companies.id],
	}),
	location: one(locations, {
		fields: [meetingTypes.locationId],
		references: [locations.id],
	}),
	bookings: many(bookings),
	questions: many(bookingQuestions),
	availabilityTemplates: many(meetingTypeAvailabilityTemplates),
}));

export const meetingTypeAvailabilityTemplatesRelations = relations(
	meetingTypeAvailabilityTemplates,
	({ one }) => ({
		meetingType: one(meetingTypes, {
			fields: [meetingTypeAvailabilityTemplates.meetingTypeId],
			references: [meetingTypes.id],
		}),
		availabilityTemplate: one(availabilityTemplates, {
			fields: [meetingTypeAvailabilityTemplates.availabilityTemplateId],
			references: [availabilityTemplates.id],
		}),
	})
);

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
	meetingType: one(meetingTypes, {
		fields: [bookings.meetingTypeId],
		references: [meetingTypes.id],
	}),
	host: one(user, {
		fields: [bookings.hostUserId],
		references: [user.id],
	}),
	answers: many(bookingAnswers),
}));

export const bookingQuestionsRelations = relations(bookingQuestions, ({ one, many }) => ({
	meetingType: one(meetingTypes, {
		fields: [bookingQuestions.meetingTypeId],
		references: [meetingTypes.id],
	}),
	answers: many(bookingAnswers),
}));

export const bookingAnswersRelations = relations(bookingAnswers, ({ one }) => ({
	booking: one(bookings, {
		fields: [bookingAnswers.bookingId],
		references: [bookings.id],
	}),
	question: one(bookingQuestions, {
		fields: [bookingAnswers.questionId],
		references: [bookingQuestions.id],
	}),
}));

export const availabilityRelations = relations(availability, ({ one }) => ({
	company: one(companies, {
		fields: [availability.companyId],
		references: [companies.id],
	}),
}));
