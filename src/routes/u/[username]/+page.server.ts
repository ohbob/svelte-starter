import { trackPageView } from "$lib/server/analytics";
import { db } from "$lib/server/db";
import { companies, meetingTypes, user } from "$lib/server/schema";
import { error } from "@sveltejs/kit";
import { and, eq, inArray, or } from "drizzle-orm";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, request }) => {
	// Find user by custom URL first, then by username (name field), then by ID
	const foundUser = await db
		.select()
		.from(user)
		.where(
			or(
				eq(user.customUrl, params.username),
				eq(user.name, params.username),
				eq(user.id, params.username)
			)
		)
		.limit(1);

	if (!foundUser.length) {
		throw error(404, "User not found");
	}

	const userData = foundUser[0];

	// Track page view
	await trackPageView(userData.id, `/u/${params.username}`, request);

	// Get user's companies directly
	const userCompanies = await db.select().from(companies).where(eq(companies.userId, userData.id));

	// Get company IDs
	const companyIds = userCompanies.map((company) => company.id);

	// Get meeting types for user's companies
	const userMeetingTypes =
		companyIds.length > 0
			? await db
					.select()
					.from(meetingTypes)
					.where(and(inArray(meetingTypes.companyId, companyIds), eq(meetingTypes.isActive, true)))
					.orderBy(meetingTypes.createdAt)
			: [];

	return {
		user: {
			id: userData.id,
			name: userData.name,
			email: userData.contactEmail || userData.email, // Use contact email if set
			image: userData.image,
			customUrl: userData.customUrl,
		},
		companies: userCompanies,
		meetingTypes: userMeetingTypes,
	};
};
