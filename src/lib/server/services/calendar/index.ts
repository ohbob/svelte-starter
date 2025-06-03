// Calendar domain services
export { AvailabilityService } from "./availability";
export { BookingService } from "./booking";
export { CalendarIntegrationService } from "./integration";
export { MeetingTypeService } from "./meeting-types";

// Type exports
export type {
	AvailabilitySlot,
	CreateAvailabilityTemplateData,
	UpdateAvailabilityTemplateData,
} from "./availability";
export type { BookingQuestion, CreateBookingData } from "./booking";
export type { CalendarIntegrationData } from "./integration";
export type { CreateMeetingTypeData, UpdateMeetingTypeData } from "./meeting-types";
