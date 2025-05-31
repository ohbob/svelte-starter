import { db } from "$lib/server/db";
import { SchedulingManager } from "$lib/server/scheduling";
import { user } from "$lib/server/schema";
import { error } from "@sveltejs/kit";
import { eq, or } from "drizzle-orm";
import type { PageServerLoad } from "./$types";

const schedulingManager = new SchedulingManager();

export const load: PageServerLoad = async ({ params }) => {
	const { username, slug } = params;

	try {
		// Find user by flexible lookup (same as portfolio page)
		const foundUser = await db
			.select()
			.from(user)
			.where(or(eq(user.customUrl, username), eq(user.name, username), eq(user.id, username)))
			.limit(1);

		if (!foundUser.length) {
			throw error(404, "User not found");
		}

		const userData = foundUser[0];

		// Get the meeting type using the actual userId
		const meetingType = await schedulingManager.getPublicMeetingType(userData.id, slug);

		return {
			meetingType,
			userId: userData.id,
			hostName: userData.name || userData.email,
			username: userData.customUrl || userData.name || userData.id,
		};
	} catch (err) {
		console.error("Error loading booking page:", err);
		throw error(404, "Meeting type not found");
	}
};
