import { z } from "zod";

// Common validation schemas
export const emailSchema = z.string().email("Invalid email address");
export const phoneSchema = z
	.string()
	.regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number")
	.optional();
export const slugSchema = z
	.string()
	.regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens");

// Location validation
export const locationSchema = z.discriminatedUnion("type", [
	// In-person location schema
	z.object({
		type: z.literal("in-person"),
		name: z.string().min(1, "Name is required").max(100, "Name too long"),
		address: z.string().min(1, "Address is required").max(500, "Address too long"),
		city: z.string().max(100, "City name too long").optional(),
		state: z.string().max(100, "State name too long").optional(),
		country: z.string().max(100, "Country name too long").optional(),
		postalCode: z.string().max(20, "Postal code too long").optional(),
		phone: phoneSchema,
		contactPerson: z.string().max(100, "Contact person name too long").optional(),
		instructions: z.string().max(1000, "Instructions too long").optional(),
		description: z.string().max(500, "Description too long").optional(),
		isDefault: z.boolean().optional(),
	}),
	// Virtual location schema
	z.object({
		type: z.literal("virtual"),
		name: z.string().min(1, "Name is required").max(100, "Name too long"),
		platform: z.enum(["google-meet", "zoom", "teams", "custom"], {
			errorMap: () => ({ message: "Invalid platform" }),
		}),
		autoGenerateLink: z.boolean().optional(),
		customMeetingUrl: z.string().url("Invalid URL").optional(),
		meetingInstructions: z.string().max(1000, "Instructions too long").optional(),
		description: z.string().max(500, "Description too long").optional(),
		isDefault: z.boolean().optional(),
	}),
]);

// Meeting type validation - locationId is now optional for backward compatibility
export const meetingTypeSchema = z.object({
	name: z.string().min(1, "Name is required").max(100, "Name too long"),
	description: z.string().max(500, "Description too long").optional(),
	locationId: z.string().uuid("Invalid location").optional(),
	duration: z
		.number()
		.min(5, "Duration must be at least 5 minutes")
		.max(480, "Duration cannot exceed 8 hours"),
	price: z.number().min(0, "Price cannot be negative").optional(),
	color: z
		.string()
		.regex(/^#[0-9A-F]{6}$/i, "Invalid color format")
		.optional(),
	requiresConfirmation: z.boolean().optional(),
	bufferTimeBefore: z
		.number()
		.min(0, "Buffer time cannot be negative")
		.max(120, "Buffer time too long")
		.optional(),
	bufferTimeAfter: z
		.number()
		.min(0, "Buffer time cannot be negative")
		.max(120, "Buffer time too long")
		.optional(),
	maxBookingsPerDay: z
		.number()
		.min(1, "Must allow at least 1 booking per day")
		.max(50, "Too many bookings per day")
		.optional(),
});

// Availability template validation
export const availabilitySlotSchema = z.object({
	dayOfWeek: z.number().min(0, "Invalid day").max(6, "Invalid day"),
	startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
	endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
});

export const availabilityTemplateSchema = z.object({
	name: z.string().min(1, "Name is required").max(100, "Name too long"),
	description: z.string().max(500, "Description too long").optional(),
	isDefault: z.boolean().optional(),
	slots: z.array(availabilitySlotSchema).min(1, "At least one time slot is required"),
});

// Booking validation
export const bookingSchema = z.object({
	guestName: z.string().min(1, "Name is required").max(100, "Name too long"),
	guestEmail: emailSchema,
	guestPhone: phoneSchema,
	guestNotes: z.string().max(1000, "Notes too long").optional(),
	startTime: z.date(),
});

// Company validation
export const companySchema = z.object({
	name: z.string().min(1, "Company name is required").max(100, "Company name too long"),
	slug: slugSchema.optional(),
	description: z.string().max(500, "Description too long").optional(),
	website: z.string().url("Invalid website URL").optional(),
	email: emailSchema.optional(),
	phone: phoneSchema,
});

// Validation helper functions
export function validateFormData<T>(
	schema: z.ZodSchema<T>,
	data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
	const result = schema.safeParse(data);

	if (result.success) {
		return { success: true, data: result.data };
	}

	const errors: Record<string, string[]> = {};
	result.error.errors.forEach((error) => {
		const path = error.path.join(".");
		if (!errors[path]) {
			errors[path] = [];
		}
		errors[path].push(error.message);
	});

	return { success: false, errors };
}

export function validateTimeSlot(startTime: string, endTime: string): boolean {
	const start = new Date(`1970-01-01T${startTime}:00`);
	const end = new Date(`1970-01-01T${endTime}:00`);
	return start < end;
}

export function validateAvailabilitySlots(
	slots: { dayOfWeek: number; startTime: string; endTime: string }[]
): string[] {
	const errors: string[] = [];

	slots.forEach((slot, index) => {
		if (!validateTimeSlot(slot.startTime, slot.endTime)) {
			errors.push(`Slot ${index + 1}: End time must be after start time`);
		}
	});

	return errors;
}

// Sanitization helpers
export function sanitizeHtml(input: string): string {
	return input
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#x27;")
		.replace(/\//g, "&#x2F;");
}

export function sanitizeSlug(input: string): string {
	return input
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}
