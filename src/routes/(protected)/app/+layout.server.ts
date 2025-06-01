import { getAnalytics } from "$lib/server/analytics";
import { auth } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { services, user } from "$lib/server/schema";
import { redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ request }) => {
	const session = await auth.api.getSession({
		headers: request.headers,
	});

	if (!session) {
		redirect(302, "/signin");
	}

	// Fetch complete user data from database including customUrl
	const userData = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1);
	const completeUser = userData[0];

	if (!completeUser) {
		redirect(302, "/signin");
	}

	// Load user's services for dashboard stats
	const userServices = await db.select().from(services).where(eq(services.userId, session.user.id));

	// Load analytics data
	const analyticsData = await getAnalytics(session.user.id);

	return {
		user: completeUser,
		services: userServices,
		analytics: analyticsData,
	};
};
