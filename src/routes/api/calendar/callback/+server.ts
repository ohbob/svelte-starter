import { CalendarManager } from "$lib/server/calendar";
import { redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url }) => {
	const code = url.searchParams.get("code");
	const state = url.searchParams.get("state"); // companyId
	const error = url.searchParams.get("error");

	console.log("Calendar callback received:", { code: !!code, state, error });

	if (error) {
		console.error("Calendar OAuth error:", error);
		throw redirect(302, "/app/calendar?error=access_denied");
	}

	if (!code || !state) {
		console.error("Missing callback parameters:", { code: !!code, state });
		throw redirect(302, "/app/calendar?error=missing_params");
	}

	try {
		console.log("Attempting calendar connection for company:", state);
		const calendarManager = new CalendarManager();
		await calendarManager.handleCallback(code, state);

		console.log("Calendar connection successful for company:", state);
		throw redirect(302, "/app/calendar?connected=true");
	} catch (error) {
		// Only log if it's not a redirect (redirects throw but are successful)
		if (!(error instanceof Response)) {
			const err = error as Error;
			console.error("Calendar callback error details:", {
				message: err.message,
				stack: err.stack,
				companyId: state,
			});

			// More specific error handling
			if (err.message?.includes("No primary calendar")) {
				throw redirect(302, "/app/calendar?error=no_calendar");
			} else if (err.message?.includes("Invalid grant")) {
				throw redirect(302, "/app/calendar?error=invalid_grant");
			} else if (err.message?.includes("Insufficient Permission")) {
				throw redirect(302, "/app/calendar?error=insufficient_permission");
			} else {
				throw redirect(302, "/app/calendar?error=connection_failed");
			}
		}

		// Re-throw redirects
		throw error;
	}
};
