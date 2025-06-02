// Common form constants
export const INDUSTRIES = [
	"Hair Salon",
	"Barbershop",
	"Beauty Salon",
	"Spa & Wellness",
	"Nail Salon",
	"Massage Therapy",
	"Legal Services",
	"Accounting",
	"Consulting",
	"Real Estate",
	"Photography",
	"Personal Training",
	"Tutoring",
	"Pet Grooming",
	"Auto Services",
	"Home Services",
	"Healthcare",
	"Dental",
	"Other",
];

export const TIMEZONES = [
	"America/New_York",
	"America/Chicago",
	"America/Denver",
	"America/Los_Angeles",
	"America/Phoenix",
	"America/Anchorage",
	"Pacific/Honolulu",
];

export const PAYMENT_METHODS = [
	"Cash",
	"Credit Card",
	"Debit Card",
	"PayPal",
	"Venmo",
	"Apple Pay",
	"Google Pay",
	"Check",
	"Bank Transfer",
];

export const LANGUAGES = [
	"English",
	"Spanish",
	"French",
	"German",
	"Italian",
	"Portuguese",
	"Chinese",
	"Japanese",
	"Korean",
	"Arabic",
	"Hindi",
	"Russian",
];

// Default business hours
export const DEFAULT_BUSINESS_HOURS = [
	{ day: "Monday", open: "09:00", close: "17:00", isOpen: true },
	{ day: "Tuesday", open: "09:00", close: "17:00", isOpen: true },
	{ day: "Wednesday", open: "09:00", close: "17:00", isOpen: true },
	{ day: "Thursday", open: "09:00", close: "17:00", isOpen: true },
	{ day: "Friday", open: "09:00", close: "17:00", isOpen: true },
	{ day: "Saturday", open: "10:00", close: "16:00", isOpen: false },
	{ day: "Sunday", open: "10:00", close: "16:00", isOpen: false },
];

// Form validation helpers
export function validateEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

export function validateUrl(url: string): boolean {
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
}

export function validatePhone(phone: string): boolean {
	const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
	return phoneRegex.test(phone.replace(/\D/g, ""));
}
