import { AnalyticsService } from "$lib/server/services";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { companyId, path, referrer } = await request.json();

		if (!companyId || !path) {
			return json({ error: "Missing required fields" }, { status: 400 });
		}

		const analyticsService = new AnalyticsService();

		// Track the view
		await analyticsService.trackView(
			companyId,
			path,
			referrer,
			request.headers.get("user-agent") || undefined,
			request.headers.get("x-forwarded-for") || "127.0.0.1"
		);

		return json({ success: true });
	} catch (error) {
		console.error("Error adding analytics:", error);
		return json({ error: "Failed to add analytics" }, { status: 500 });
	}
};
