import { auth } from "$lib/server/auth";
import { CalendarManager } from "$lib/server/calendar";
import { db } from "$lib/server/db";
import { companies } from "$lib/server/schema";
import { json } from "@sveltejs/kit";
import { asc, eq } from "drizzle-orm";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ request, url, cookies }) => {
	const session = await auth.api.getSession({ headers: request.headers });

	if (!session?.user?.id) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		// Get user's companies
		const userCompanies = await db
			.select()
			.from(companies)
			.where(eq(companies.userId, session.user.id))
			.orderBy(asc(companies.createdAt));

		// Get selected company ID from cookie
		const selectedCompanyId = cookies.get("selectedCompanyId");

		// Determine current company
		let currentCompany = null;
		if (selectedCompanyId && userCompanies.length > 0) {
			currentCompany = userCompanies.find((c) => c.id === selectedCompanyId) || userCompanies[0];
		} else if (userCompanies.length > 0) {
			currentCompany = userCompanies[0];
		}

		if (!currentCompany) {
			return json({
				isConnected: false,
				integration: null,
				availableCalendars: [],
			});
		}

		const calendarManager = new CalendarManager();
		const integration = await calendarManager.getIntegration(currentCompany.id);

		if (!integration) {
			return json({
				isConnected: false,
				integration: null,
				availableCalendars: [],
			});
		}

		// Only fetch available calendars if explicitly requested
		const includeCalendars = url.searchParams.get("includeCalendars") === "true";
		let availableCalendars = [];

		if (includeCalendars) {
			availableCalendars = await calendarManager.getAvailableCalendars(currentCompany.id);
		}

		return json({
			isConnected: true,
			integration,
			availableCalendars,
		});
	} catch (error) {
		console.error("Error checking calendar status:", error);
		return json({ error: "Failed to check calendar status" }, { status: 500 });
	}
};
