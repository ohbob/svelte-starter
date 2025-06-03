// Application constants and configuration

// Time and scheduling
export const TIME_CONSTANTS = {
	MIN_MEETING_DURATION: 5, // minutes
	MAX_MEETING_DURATION: 480, // 8 hours
	MAX_BUFFER_TIME: 120, // 2 hours
	MAX_BOOKINGS_PER_DAY: 50,
	BOOKING_WINDOW_DAYS: 60, // How far in advance bookings can be made
	MIN_ADVANCE_BOOKING_HOURS: 1, // Minimum hours in advance for booking
} as const;

// Validation limits
export const VALIDATION_LIMITS = {
	NAME_MAX_LENGTH: 100,
	DESCRIPTION_MAX_LENGTH: 500,
	NOTES_MAX_LENGTH: 1000,
	COMPANY_NAME_MAX_LENGTH: 100,
	SLUG_MAX_LENGTH: 50,
} as const;

// UI and UX
export const UI_CONSTANTS = {
	TOAST_DURATION: 4000, // milliseconds
	TOAST_DEDUP_WINDOW: 3000, // milliseconds
	DEBOUNCE_DELAY: 300, // milliseconds
	PAGINATION_PAGE_SIZE: 20,
	MAX_UPLOAD_SIZE: 5 * 1024 * 1024, // 5MB
} as const;

// Calendar and availability
export const CALENDAR_CONSTANTS = {
	DAYS_OF_WEEK: [
		"Sunday",
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday",
	] as const,
	BUSINESS_HOURS_START: "09:00",
	BUSINESS_HOURS_END: "17:00",
	TIME_SLOT_INTERVAL: 15, // minutes
	MAX_AVAILABILITY_TEMPLATES: 20,
} as const;

// Colors and themes
export const COLORS = {
	PRIMARY: "#3b82f6",
	SUCCESS: "#10b981",
	WARNING: "#f59e0b",
	ERROR: "#ef4444",
	INFO: "#06b6d4",
	GRAY: "#6b7280",
} as const;

// Meeting type default colors
export const MEETING_TYPE_COLORS = [
	"#3b82f6", // Blue
	"#10b981", // Green
	"#f59e0b", // Yellow
	"#ef4444", // Red
	"#8b5cf6", // Purple
	"#06b6d4", // Cyan
	"#f97316", // Orange
	"#84cc16", // Lime
	"#ec4899", // Pink
	"#6b7280", // Gray
] as const;

// Status values
export const BOOKING_STATUS = {
	CONFIRMED: "confirmed",
	CANCELLED: "cancelled",
	PENDING: "pending",
	COMPLETED: "completed",
} as const;

export const NOTIFICATION_TYPES = {
	SUCCESS: "success",
	ERROR: "error",
	WARNING: "warning",
	INFO: "info",
} as const;

// API and networking
export const API_CONSTANTS = {
	REQUEST_TIMEOUT: 30000, // 30 seconds
	RETRY_ATTEMPTS: 3,
	RATE_LIMIT_WINDOW: 60000, // 1 minute
	RATE_LIMIT_MAX_REQUESTS: 100,
} as const;

// File and media
export const MEDIA_CONSTANTS = {
	ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"] as const,
	ALLOWED_DOCUMENT_TYPES: ["application/pdf", "text/plain"] as const,
	MAX_IMAGE_SIZE: 2 * 1024 * 1024, // 2MB
	MAX_DOCUMENT_SIZE: 10 * 1024 * 1024, // 10MB
} as const;

// Regular expressions
export const REGEX_PATTERNS = {
	EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
	PHONE: /^\+?[\d\s\-\(\)]+$/,
	SLUG: /^[a-z0-9-]+$/,
	TIME_24H: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
	COLOR_HEX: /^#[0-9A-F]{6}$/i,
	URL: /^https?:\/\/.+/,
} as const;

// Error messages
export const ERROR_MESSAGES = {
	UNAUTHORIZED: "You are not authorized to perform this action",
	NOT_FOUND: "The requested resource was not found",
	VALIDATION_FAILED: "Please check your input and try again",
	SERVER_ERROR: "Something went wrong. Please try again later",
	NETWORK_ERROR: "Network error. Please check your connection",
	RATE_LIMITED: "Too many requests. Please wait and try again",
	FILE_TOO_LARGE: "File size exceeds the maximum allowed limit",
	INVALID_FILE_TYPE: "File type is not supported",
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
	CREATED: "Created successfully",
	UPDATED: "Updated successfully",
	DELETED: "Deleted successfully",
	SAVED: "Saved successfully",
	SENT: "Sent successfully",
	UPLOADED: "Uploaded successfully",
} as const;

// Feature flags (for gradual rollouts)
export const FEATURE_FLAGS = {
	ENABLE_ANALYTICS: true,
	ENABLE_NOTIFICATIONS: true,
	ENABLE_CALENDAR_SYNC: true,
	ENABLE_PAYMENT_PROCESSING: false,
	ENABLE_TEAM_FEATURES: false,
	ENABLE_ADVANCED_SCHEDULING: false,
} as const;

// Environment-specific constants
export const ENV_CONSTANTS = {
	IS_DEVELOPMENT: process.env.NODE_ENV === "development",
	IS_PRODUCTION: process.env.NODE_ENV === "production",
	IS_TEST: process.env.NODE_ENV === "test",
} as const;
