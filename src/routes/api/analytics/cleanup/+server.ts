import { cleanupOldAnalytics } from "$lib/server/analytics";
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

		// Get retention days from request body (default 120)
		const body = await request.json().catch(() => ({}));
		const retentionDays = body.retentionDays || 120;

		// Run cleanup
		const result = await cleanupOldAnalytics(retentionDays);

		return json({
			success: true,
			message: `Cleaned up analytics older than ${retentionDays} days`,
			result,
		});
	} catch (error) {
		console.error("Analytics cleanup failed:", error);
		return json(
			{ error: "Cleanup failed", details: error instanceof Error ? error.message : String(error) },
			{ status: 500 }
		);
	}
};
