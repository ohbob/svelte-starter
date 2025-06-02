import { auth } from "$lib/server/auth";
import { CalendarManager } from "$lib/server/calendar";
import { redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ request, cookies }) => {
	const session = await auth.api.getSession({ headers: request.headers });

	if (!session) {
		throw redirect(302, "/auth/signin");
	}

	// Get current company from cookies to verify user has a company selected
	const selectedCompanyId = cookies.get("selectedCompanyId");

	if (!selectedCompanyId) {
		throw redirect(302, "/app/calendar?error=no_company");
	}

	// Use userId for calendar integration (shared across companies)
	const calendarManager = new CalendarManager();
	const authUrl = calendarManager.generateAuthUrl(session.user.id);

	throw redirect(302, authUrl);
};
