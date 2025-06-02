import { db } from "$lib/server/db";
import { companies, dailyAnalytics, referrerAnalytics } from "$lib/server/schema";
import { json } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url }) => {
	const companyId = url.searchParams.get("companyId");

	if (!companyId) {
		return json({ error: "companyId parameter required" }, { status: 400 });
	}

	try {
		// Get company info
		const company = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);

		// Get daily analytics
		const dailyData = await db
			.select()
			.from(dailyAnalytics)
			.where(eq(dailyAnalytics.companyId, companyId))
			.orderBy(dailyAnalytics.date);

		// Get referrer analytics
		const referrerData = await db
			.select()
			.from(referrerAnalytics)
			.where(eq(referrerAnalytics.companyId, companyId))
			.orderBy(referrerAnalytics.date);

		return json({
			company: company[0] || null,
			dailyAnalytics: dailyData,
			referrerAnalytics: referrerData,
			totalRecords: {
				daily: dailyData.length,
				referrer: referrerData.length,
			},
		});
	} catch (error) {
		console.error("Debug analytics error:", error);
		return json({ error: "Failed to fetch analytics data" }, { status: 500 });
	}
};
