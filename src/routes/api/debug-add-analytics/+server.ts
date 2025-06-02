import { trackView } from "$lib/server/analytics";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { companyId, views = 5 } = await request.json();

		if (!companyId) {
			return json({ error: "companyId required" }, { status: 400 });
		}

		// Add some test analytics data
		const promises = [];
		for (let i = 0; i < views; i++) {
			promises.push(
				trackView(
					companyId,
					`/test-page-${i}`,
					i % 2 === 0 ? "https://google.com" : "direct",
					"Mozilla/5.0 Test Browser",
					"127.0.0.1"
				)
			);
		}

		await Promise.all(promises);

		return json({
			success: true,
			message: `Added ${views} test analytics records for company ${companyId}`,
		});
	} catch (error) {
		console.error("Debug add analytics error:", error);
		return json({ error: "Failed to add analytics data" }, { status: 500 });
	}
};
