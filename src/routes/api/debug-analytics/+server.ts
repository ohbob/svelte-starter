import { AnalyticsService } from "$lib/server/services";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url }) => {
	try {
		const companyId = url.searchParams.get("companyId");

		if (!companyId) {
			return json({ error: "companyId required" }, { status: 400 });
		}

		const analyticsService = new AnalyticsService();

		// Calculate date range (last 30 days)
		const endDate = new Date();
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - 30);

		const analytics = await analyticsService.getCompanyAnalytics(companyId, startDate, endDate);

		return json({
			success: true,
			companyId,
			analytics,
		});
	} catch (error) {
		console.error("Debug analytics error:", error);
		return json({ error: "Failed to get analytics data" }, { status: 500 });
	}
};
