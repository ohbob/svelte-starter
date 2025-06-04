import { eq } from "drizzle-orm";
import { db } from "./src/lib/server/db.ts";
import { bookings, companies, meetingTypes } from "./src/lib/server/schema/index.js";

async function debugBookings() {
	try {
		console.log("=== Checking all bookings ===");

		const allBookings = await db
			.select({
				id: bookings.id,
				guestName: bookings.guestName,
				guestEmail: bookings.guestEmail,
				startTime: bookings.startTime,
				status: bookings.status,
				meetingTypeId: bookings.meetingTypeId,
				hostUserId: bookings.hostUserId,
			})
			.from(bookings);

		console.log(`Total bookings found: ${allBookings.length}`);

		if (allBookings.length > 0) {
			console.log("\nFirst few bookings:");
			allBookings.slice(0, 3).forEach((booking, i) => {
				console.log(`${i + 1}. ${booking.guestName} (${booking.guestEmail})`);
				console.log(`   Status: ${booking.status}`);
				console.log(`   Start: ${booking.startTime}`);
				console.log(`   Meeting Type ID: ${booking.meetingTypeId}`);
				console.log(`   Host User ID: ${booking.hostUserId}`);
				console.log("");
			});

			// Check meeting types and companies
			console.log("=== Checking meeting types and companies ===");

			const bookingsWithDetails = await db
				.select({
					bookingId: bookings.id,
					guestName: bookings.guestName,
					status: bookings.status,
					meetingTypeName: meetingTypes.name,
					companyId: meetingTypes.companyId,
					companyName: companies.name,
					companySlug: companies.slug,
				})
				.from(bookings)
				.leftJoin(meetingTypes, eq(bookings.meetingTypeId, meetingTypes.id))
				.leftJoin(companies, eq(meetingTypes.companyId, companies.id))
				.limit(5);

			console.log("Bookings with company details:");
			bookingsWithDetails.forEach((booking, i) => {
				console.log(`${i + 1}. ${booking.guestName} - ${booking.meetingTypeName}`);
				console.log(
					`   Company: ${booking.companyName} (${booking.companySlug}) - ID: ${booking.companyId}`
				);
				console.log(`   Status: ${booking.status}`);
				console.log("");
			});
		}
	} catch (error) {
		console.error("Error:", error);
	}

	process.exit(0);
}

debugBookings();
