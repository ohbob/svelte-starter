import { relations } from "drizzle-orm";
import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth.schema";

// Calendar integrations - stores Google Calendar OAuth tokens
export const calendarIntegrations = pgTable("calendar_integrations", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	provider: text("provider").notNull().default("google"), // future: outlook, etc.
	accessToken: text("access_token").notNull(),
	refreshToken: text("refresh_token"),
	expiresAt: timestamp("expires_at"),
	calendarId: text("calendar_id"), // Google Calendar ID (deprecated, use selectedCalendarId)
	selectedCalendarId: text("selected_calendar_id"), // Currently selected calendar ID
	selectedCalendarName: text("selected_calendar_name"), // Display name of selected calendar
	isActive: boolean("is_active").notNull().default(true),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Meeting types - like "30min call", "1hr consultation", etc.
export const meetingTypes = pgTable("meeting_types", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	name: text("name").notNull(), // "30 Minute Meeting"
	slug: text("slug").notNull(), // "30min-meeting"
	description: text("description"),
	duration: integer("duration").notNull(), // minutes
	price: integer("price").default(0), // cents, 0 = free
	color: text("color").default("#3b82f6"), // hex color
	isActive: boolean("is_active").notNull().default(true),
	requiresConfirmation: boolean("requires_confirmation").notNull().default(false),
	bufferTimeBefore: integer("buffer_time_before").default(0), // minutes
	bufferTimeAfter: integer("buffer_time_after").default(0), // minutes
	maxBookingsPerDay: integer("max_bookings_per_day"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// User availability - when users are available for bookings
export const availability = pgTable("availability", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
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
	startTime: timestamp("start_time").notNull(),
	endTime: timestamp("end_time").notNull(),
	status: text("status").notNull().default("confirmed"), // confirmed, cancelled, completed
	googleEventId: text("google_event_id"), // Google Calendar event ID
	meetingLink: text("meeting_link"), // Zoom, Meet, etc.
	cancellationReason: text("cancellation_reason"),
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

// Relations for TypeScript support
export const meetingTypesRelations = relations(meetingTypes, ({ one, many }) => ({
	user: one(user, {
		fields: [meetingTypes.userId],
		references: [user.id],
	}),
	bookings: many(bookings),
	questions: many(bookingQuestions),
}));

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
	user: one(user, {
		fields: [availability.userId],
		references: [user.id],
	}),
}));

export const calendarIntegrationsRelations = relations(calendarIntegrations, ({ one }) => ({
	user: one(user, {
		fields: [calendarIntegrations.userId],
		references: [user.id],
	}),
}));
