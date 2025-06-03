import { AnalyticsService } from "$lib/server/services";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Optional: Add authentication/API key check here
		const authHeader = request.headers.get("authorization");
		const expectedToken = process.env.CLEANUP_API_TOKEN || "your-secret-token";

		if (authHeader !== `Bearer ${expectedToken}`) {
			return json({ error: "Unauthorized" }, { status: 401 });
		}

		const { retentionDays = 120 } = await request.json();

		const analyticsService = new AnalyticsService();
		const result = await analyticsService.cleanupOldAnalytics(retentionDays);

		return json({
			success: true,
			message: `Cleaned up analytics older than ${retentionDays} days`,
			result,
		});
	} catch (error) {
		console.error("Analytics cleanup error:", error);
		return json({ error: "Failed to cleanup analytics" }, { status: 500 });
	}
};
