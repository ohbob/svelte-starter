// Domain-based service exports

// Calendar domain
export {
	AvailabilityService,
	BookingService,
	CalendarIntegrationService,
	MeetingTypeService,
} from "./calendar";

export type {
	AvailabilitySlot,
	BookingQuestion,
	CalendarIntegrationData,
	CreateAvailabilityTemplateData,
	CreateBookingData,
	CreateMeetingTypeData,
	UpdateAvailabilityTemplateData,
	UpdateMeetingTypeData,
} from "./calendar";

// Company domain
export { CompanyService } from "./company";
export type { CreateCompanyData, UpdateCompanyData } from "./company";

// Analytics domain
export { AnalyticsService } from "./analytics";
export type { AnalyticsData, CreateAnalyticsData } from "./analytics";

// Notification domain
export { NotificationService } from "./notification";
export type { CreateNotificationData } from "./notification";

// Future domains will be added here:
// export { UserService, ProfileService } from "./user";
// export { PaymentService, BillingService } from "./payment";
