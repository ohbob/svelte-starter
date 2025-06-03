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
		const calendarIntegrationService = new CalendarIntegrationService();
		await calendarIntegrationService.disconnectCalendar(selectedCompanyId);

		return json({ success: true });
	} catch (error) {
		console.error("Error disconnecting calendar:", error);
		return json({ error: "Failed to disconnect calendar" }, { status: 500 });
	}
};
