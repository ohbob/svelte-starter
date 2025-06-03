// Calendar domain services
export { AvailabilityService } from "./availability";
export { BookingService } from "./booking";
export { MeetingTypeService } from "./meeting-types";

// Type exports
export type {
	AvailabilitySlot,
	CreateAvailabilityTemplateData,
	UpdateAvailabilityTemplateData,
} from "./availability";
export type { BookingQuestion, CreateBookingData } from "./booking";
export type { CreateMeetingTypeData, UpdateMeetingTypeData } from "./meeting-types";
