import { auth } from "$lib/server/auth";
import { CalendarIntegrationService } from "$lib/server/services";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, cookies }) => {
	const session = await auth.api.getSession({ headers: request.headers });

	if (!session?.user?.id) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}

	const selectedCompanyId = cookies.get("selectedCompanyId");

	if (!selectedCompanyId) {
		return json({ error: "No company selected" }, { status: 400 });
	}

	try {
		const { calendarId } = await request.json();

		if (!calendarId) {
			return json({ error: "Calendar ID is required" }, { status: 400 });
		}

		const calendarIntegrationService = new CalendarIntegrationService();
		await calendarIntegrationService.selectCalendar(selectedCompanyId, calendarId);

		// Return updated integration
		const integration = await calendarIntegrationService.getCalendarIntegration(selectedCompanyId);

		return json({ integration });
	} catch (error) {
		console.error("Error selecting calendar:", error);
		return json({ error: "Failed to select calendar" }, { status: 500 });
	}
};
