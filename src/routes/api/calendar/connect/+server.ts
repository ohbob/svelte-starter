import { auth } from "$lib/server/auth";
import { CalendarManager } from "$lib/server/calendar";
import { redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ request, cookies }) => {
	const session = await auth.api.getSession({ headers: request.headers });

	if (!session) {
		throw redirect(302, "/auth/signin");
	}

	// Get current company from cookies (correct cookie name)
	const selectedCompanyId = cookies.get("selectedCompanyId");

	if (!selectedCompanyId) {
		throw redirect(302, "/app/calendar?error=no_company");
	}

	const calendarManager = new CalendarManager();
	const authUrl = calendarManager.generateAuthUrl(selectedCompanyId);

	throw redirect(302, authUrl);
};
