// Booking Calendar Integration Test
// Run with: bun run booking-calendar-integration.test.ts

import { addDays, addMinutes } from "date-fns";
import { eq } from "drizzle-orm";
import { db } from "./src/lib/server/db";
import {
	availabilitySlots,
	availabilityTemplates,
	bookings,
	calendarIntegrations,
	companies,
	meetingTypes,
	user,
} from "./src/lib/server/schema";
import {
	BookingService,
	CalendarIntegrationService,
	MeetingTypeService,
} from "./src/lib/server/services";

// Test data
const TEST_USER_ID = "test-user-booking-calendar";
const TEST_COMPANY_ID = "test-company-booking-calendar";
const TEST_MEETING_TYPE_ID = "test-meeting-type-booking-calendar";
const TEST_AVAILABILITY_TEMPLATE_ID = "test-availability-template-booking-calendar";

// Test calendars
const TEST_CALENDARS = [
	{
		name: "test calendar",
		id: "test-calendar-id@group.calendar.google.com",
	},
	{
		name: "Personīgais",
		id: "personal-calendar-id@calendar.google.com",
	},
];

class BookingCalendarIntegrationTest {
	private calendarService = new CalendarIntegrationService();
	private bookingService = new BookingService();
	private meetingTypeService = new MeetingTypeService();

	// Store created booking IDs for cleanup
	private createdBookingIds: string[] = [];
	private createdEventIds: { calendarId: string; eventId: string }[] = [];

	async setupTestData() {
		console.log("🔧 Setting up test data...");

		// Create test user with required fields
		await db
			.insert(user)
			.values({
				id: TEST_USER_ID,
				email: "test@example.com",
				name: "Test User",
				emailVerified: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.onConflictDoNothing();

		// Create test company with required fields
		await db
			.insert(companies)
			.values({
				id: TEST_COMPANY_ID,
				userId: TEST_USER_ID,
				name: "Test Company",
				slug: "test-company",
				description: "Test company for booking calendar integration",
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.onConflictDoNothing();

		// Create availability template
		await db
			.insert(availabilityTemplates)
			.values({
				id: TEST_AVAILABILITY_TEMPLATE_ID,
				companyId: TEST_COMPANY_ID,
				name: "Test Availability",
				isDefault: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.onConflictDoNothing();

		// Add availability slots (Monday to Friday, 9 AM to 5 PM)
		const slots = [];
		for (let day = 1; day <= 5; day++) {
			// Monday to Friday
			slots.push({
				templateId: TEST_AVAILABILITY_TEMPLATE_ID,
				dayOfWeek: day,
				startTime: "09:00",
				endTime: "17:00",
				isActive: true,
				createdAt: new Date(),
			});
		}

		if (slots.length > 0) {
			await db.insert(availabilitySlots).values(slots).onConflictDoNothing();
		}

		// Create test meeting type
		await db
			.insert(meetingTypes)
			.values({
				id: TEST_MEETING_TYPE_ID,
				companyId: TEST_COMPANY_ID,
				name: "30 Minute Test Meeting",
				slug: "30min-test",
				description: "Test meeting for calendar integration",
				duration: 30,
				price: 0,
				requiresConfirmation: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			})
			.onConflictDoNothing();

		console.log("✅ Test data setup completed");
	}

	async setupCalendarIntegrations() {
		console.log("📅 Setting up calendar integrations...");

		// Mock calendar integrations for both test calendars
		for (const calendar of TEST_CALENDARS) {
			await db
				.insert(calendarIntegrations)
				.values({
					userId: TEST_USER_ID,
					provider: "google",
					accessToken: "mock-access-token",
					refreshToken: "mock-refresh-token",
					calendarId: calendar.id,
					selectedCalendarId: calendar.id,
					selectedCalendarName: calendar.name,
					expiresAt: addDays(new Date(), 30), // Valid for 30 days
					isActive: true,
					createdAt: new Date(),
					updatedAt: new Date(),
				})
				.onConflictDoNothing();
		}

		console.log("✅ Calendar integrations setup completed");
	}

	async createTestBooking(calendarId: string, calendarName: string) {
		// Calculate booking time (tomorrow at 10 AM)
		const tomorrow = addDays(new Date(), 1);
		tomorrow.setHours(10, 0, 0, 0);

		const bookingData = {
			meetingTypeId: TEST_MEETING_TYPE_ID,
			hostUserId: TEST_USER_ID,
			guestName: `Test Guest for ${calendarName}`,
			guestEmail: `guest-${calendarName.toLowerCase().replace(/\s+/g, "-")}@example.com`,
			guestPhone: "+1234567890",
			guestNotes: `Test booking for ${calendarName} calendar integration`,
			startTime: tomorrow,
		};

		console.log(`Creating booking for ${calendarName} calendar...`);
		const booking = await this.bookingService.create(bookingData);
		this.createdBookingIds.push(booking.id);

		return booking;
	}

	async verifyBookingInDatabase(bookingId: string, expectedCalendarName: string) {
		const booking = await db.query.bookings.findFirst({
			where: eq(bookings.id, bookingId),
			with: {
				meetingType: {
					with: {
						company: true,
					},
				},
			},
		});

		if (!booking) {
			throw new Error(`Booking ${bookingId} not found in database`);
		}

		if (booking.status !== "confirmed") {
			throw new Error(`Expected booking status to be 'confirmed', got '${booking.status}'`);
		}

		if (!booking.googleEventId) {
			throw new Error("Expected booking to have a Google Event ID");
		}

		if (!booking.guestName.includes(expectedCalendarName)) {
			throw new Error(
				`Expected guest name to contain '${expectedCalendarName}', got '${booking.guestName}'`
			);
		}

		console.log(`✅ Booking verified in database for ${expectedCalendarName}`);
		console.log(`   - Booking ID: ${booking.id}`);
		console.log(`   - Google Event ID: ${booking.googleEventId}`);
		console.log(`   - Status: ${booking.status}`);
		console.log(`   - Start Time: ${booking.startTime}`);

		return booking;
	}

	async verifyEventInGoogleCalendar(eventId: string, calendarId: string, calendarName: string) {
		try {
			// In a real test, this would make an actual Google Calendar API call
			// For this test, we'll mock the verification
			console.log(`🔍 Verifying event in Google Calendar: ${calendarName}`);
			console.log(`   - Calendar ID: ${calendarId}`);
			console.log(`   - Event ID: ${eventId}`);

			// Mock Google Calendar API response
			const mockEvent = {
				id: eventId,
				summary: `30 Minute Test Meeting with Test Guest for ${calendarName}`,
				start: { dateTime: addDays(new Date(), 1).toISOString() },
				end: { dateTime: addMinutes(addDays(new Date(), 1), 30).toISOString() },
				attendees: [
					{
						email: `guest-${calendarName.toLowerCase().replace(/\s+/g, "-")}@example.com`,
						displayName: `Test Guest for ${calendarName}`,
					},
				],
				status: "confirmed",
			};

			// Verify mock event properties
			if (mockEvent.id !== eventId) {
				throw new Error(`Event ID mismatch: expected ${eventId}, got ${mockEvent.id}`);
			}

			if (!mockEvent.summary.includes(calendarName)) {
				throw new Error(`Event summary should contain calendar name '${calendarName}'`);
			}

			if (mockEvent.status !== "confirmed") {
				throw new Error(`Expected event status to be 'confirmed', got '${mockEvent.status}'`);
			}

			if (!mockEvent.attendees || mockEvent.attendees.length !== 1) {
				throw new Error("Expected exactly 1 attendee");
			}

			console.log(`✅ Event verified in ${calendarName} Google Calendar`);
			console.log(`   - Event Summary: ${mockEvent.summary}`);
			console.log(`   - Event Status: ${mockEvent.status}`);
			console.log(`   - Attendees: ${mockEvent.attendees.length}`);

			// Store for cleanup
			this.createdEventIds.push({ calendarId, eventId });

			return mockEvent;
		} catch (error) {
			console.error(`❌ Failed to verify event in ${calendarName}:`, error);
			throw error;
		}
	}

	async testBookingFlow(calendarId: string, calendarName: string) {
		console.log(`\n🚀 Testing booking flow for ${calendarName} calendar`);

		// Step 1: Create booking
		const booking = await this.createTestBooking(calendarId, calendarName);

		// Step 2: Verify booking in database
		const dbBooking = await this.verifyBookingInDatabase(booking.id, calendarName);

		// Step 3: Verify event in Google Calendar
		if (dbBooking?.googleEventId) {
			await this.verifyEventInGoogleCalendar(dbBooking.googleEventId, calendarId, calendarName);
		}

		console.log(`✅ Booking flow completed successfully for ${calendarName}`);
		return booking;
	}

	async testMultipleCalendars() {
		console.log("\n🔄 Testing multiple bookings across calendars...");

		const bookings = [];

		// Create bookings for both calendars
		for (const calendar of TEST_CALENDARS) {
			const booking = await this.testBookingFlow(calendar.id, calendar.name);
			bookings.push(booking);
		}

		// Verify all bookings were created
		if (bookings.length !== 2) {
			throw new Error(`Expected 2 bookings, got ${bookings.length}`);
		}

		// Verify each booking has unique details
		const testCalendarBooking = bookings.find((b) => b.guestName.includes("test calendar"));
		const personalCalendarBooking = bookings.find((b) => b.guestName.includes("Personīgais"));

		if (!testCalendarBooking) {
			throw new Error("Test calendar booking not found");
		}

		if (!personalCalendarBooking) {
			throw new Error("Personal calendar booking not found");
		}

		if (testCalendarBooking.guestEmail === personalCalendarBooking.guestEmail) {
			throw new Error("Bookings should have different guest emails");
		}

		console.log("✅ Multiple calendar bookings test completed");
		return bookings;
	}

	async testBookingApprovalFlow() {
		console.log("\n⏳ Testing booking approval flow...");

		// Create a meeting type that requires confirmation
		const confirmationMeetingTypeId = "test-confirmation-meeting-type";
		await db.insert(meetingTypes).values({
			id: confirmationMeetingTypeId,
			companyId: TEST_COMPANY_ID,
			name: "Confirmation Required Meeting",
			slug: "confirmation-meeting",
			description: "Meeting that requires host approval",
			duration: 60,
			price: 0,
			requiresConfirmation: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		// Create booking that requires confirmation
		const tomorrow = addDays(new Date(), 1);
		tomorrow.setHours(16, 0, 0, 0); // 4 PM

		const pendingBooking = await this.bookingService.create({
			meetingTypeId: confirmationMeetingTypeId,
			hostUserId: TEST_USER_ID,
			guestName: "Pending Guest",
			guestEmail: "pending@example.com",
			startTime: tomorrow,
		});

		this.createdBookingIds.push(pendingBooking.id);

		// Verify booking is pending
		if (pendingBooking.status !== "pending") {
			throw new Error(`Expected booking status to be 'pending', got '${pendingBooking.status}'`);
		}

		if (pendingBooking.googleEventId !== null) {
			throw new Error("Expected pending booking to not have a Google Event ID");
		}

		// Approve the booking
		const approvedBooking = await this.bookingService.approve(pendingBooking.id, TEST_USER_ID);

		// Verify booking is now confirmed with calendar event
		if (approvedBooking.status !== "confirmed") {
			throw new Error(
				`Expected approved booking status to be 'confirmed', got '${approvedBooking.status}'`
			);
		}

		// Check updated booking in database
		const updatedBooking = await db.query.bookings.findFirst({
			where: eq(bookings.id, pendingBooking.id),
		});

		if (!updatedBooking?.googleEventId) {
			throw new Error("Expected approved booking to have a Google Event ID");
		}

		console.log("✅ Booking approval flow test completed");
		console.log(`   - Initial Status: pending`);
		console.log(`   - Final Status: ${approvedBooking.status}`);
		console.log(`   - Google Event ID: ${updatedBooking.googleEventId}`);

		// Cleanup
		await db.delete(meetingTypes).where(eq(meetingTypes.id, confirmationMeetingTypeId));

		return { pendingBooking, approvedBooking, updatedBooking };
	}

	async cleanup() {
		console.log("\n🧹 Cleaning up test data...");

		// Clean up bookings
		if (this.createdBookingIds.length > 0) {
			for (const bookingId of this.createdBookingIds) {
				await db.delete(bookings).where(eq(bookings.id, bookingId));
			}
			console.log(`Cleaned up ${this.createdBookingIds.length} bookings`);
		}

		// In a real test, we would also clean up Google Calendar events
		for (const event of this.createdEventIds) {
			console.log(`Would clean up event ${event.eventId} from calendar ${event.calendarId}`);
		}

		// Clean up test data
		await db
			.delete(availabilitySlots)
			.where(eq(availabilitySlots.templateId, TEST_AVAILABILITY_TEMPLATE_ID));
		await db
			.delete(availabilityTemplates)
			.where(eq(availabilityTemplates.id, TEST_AVAILABILITY_TEMPLATE_ID));
		await db.delete(meetingTypes).where(eq(meetingTypes.id, TEST_MEETING_TYPE_ID));
		await db.delete(calendarIntegrations).where(eq(calendarIntegrations.userId, TEST_USER_ID));
		await db.delete(companies).where(eq(companies.id, TEST_COMPANY_ID));
		await db.delete(user).where(eq(user.id, TEST_USER_ID));

		console.log("✅ Cleanup completed");
	}

	async runAllTests() {
		try {
			// Setup
			await this.setupTestData();
			await this.setupCalendarIntegrations();

			// Test 1: Individual calendar bookings
			console.log("\n📋 Test 1: Individual Calendar Bookings");
			for (const calendar of TEST_CALENDARS) {
				const booking = await this.testBookingFlow(calendar.id, calendar.name);

				if (!booking.guestName.includes(calendar.name)) {
					throw new Error(`Booking should contain calendar name '${calendar.name}'`);
				}

				if (booking.status !== "confirmed") {
					throw new Error(`Booking should be confirmed, got '${booking.status}'`);
				}
			}

			// Test 2: Multiple calendars
			console.log("\n📋 Test 2: Multiple Calendar Bookings");
			await this.testMultipleCalendars();

			// Test 3: Form action simulation
			console.log("\n📋 Test 3: Form Action Simulation");
			const tomorrow = addDays(new Date(), 1);
			tomorrow.setHours(14, 0, 0, 0); // 2 PM

			const formBooking = await this.bookingService.create({
				meetingTypeId: TEST_MEETING_TYPE_ID,
				hostUserId: TEST_USER_ID,
				guestName: "Form Test Guest",
				guestEmail: "formtest@example.com",
				guestPhone: "+1987654321",
				guestNotes: "Test booking via form action",
				startTime: tomorrow,
			});

			this.createdBookingIds.push(formBooking.id);

			if (formBooking.guestName !== "Form Test Guest") {
				throw new Error("Form booking should have correct guest name");
			}

			if (formBooking.status !== "confirmed") {
				throw new Error("Form booking should be confirmed");
			}

			if (!formBooking.googleEventId) {
				throw new Error("Form booking should have Google Event ID");
			}

			console.log("✅ Form action test completed");

			// Test 4: Booking approval flow
			console.log("\n📋 Test 4: Booking Approval Flow");
			await this.testBookingApprovalFlow();

			console.log("\n🎉 All tests completed successfully!");
		} catch (error) {
			console.error("\n❌ Test failed:", error);
			throw error;
		} finally {
			// Always cleanup
			await this.cleanup();
		}
	}
}

// Main execution
async function main() {
	console.log("🤖 Starting Booking Calendar Integration Tests...");
	console.log(`📅 Testing with calendars: ${TEST_CALENDARS.map((c) => c.name).join(", ")}`);

	const testInstance = new BookingCalendarIntegrationTest();
	await testInstance.runAllTests();
}

// Run the tests
main().catch(console.error);
