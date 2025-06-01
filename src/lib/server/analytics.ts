import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "./db";
import { dailyAnalytics, referrerAnalytics } from "./schema";

// Helper function to process referrer URL
function processReferrer(referrerUrl: string) {
	if (!referrerUrl) return null;

	try {
		const url = new URL(referrerUrl);

		// Normalize domain (remove www)
		const domain = url.hostname.replace(/^www\./, "");

		// Limit path to 5 levels max
		const pathParts = url.pathname.split("/").filter(Boolean);
		const path = pathParts.length > 0 ? "/" + pathParts.slice(0, 5).join("/") : "/";

		// Extract UTM and campaign parameters
		const campaignParams: Record<string, string> = {};
		const utmParams = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];

		utmParams.forEach((param) => {
			const value = url.searchParams.get(param);
			if (value) campaignParams[param] = value;
		});

		// Also capture other common campaign parameters
		const otherParams = ["ref", "source", "campaign"];
		otherParams.forEach((param) => {
			const value = url.searchParams.get(param);
			if (value) campaignParams[param] = value;
		});

		return {
			domain,
			path: path === "/" ? null : path,
			campaignParams: Object.keys(campaignParams).length > 0 ? campaignParams : null,
		};
	} catch {
		return null;
	}
}

// Track a page view (upsert daily stats)
export async function trackPageView(userId: string, path: string, request: Request) {
	try {
		const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
		const referrerUrl = request.headers.get("referer") || "";

		// Upsert daily analytics using raw SQL
		await db.execute(sql`
            INSERT INTO daily_analytics (user_id, date, views, created_at, updated_at)
            VALUES (${userId}, ${today}, 1, NOW(), NOW())
            ON CONFLICT (user_id, date)
            DO UPDATE SET 
                views = daily_analytics.views + 1,
                updated_at = NOW()
        `);

		// Track referrer if present
		if (referrerUrl) {
			const referrerData = processReferrer(referrerUrl);
			if (referrerData) {
				const { domain, path: refPath, campaignParams } = referrerData;

				await db.execute(sql`
                    INSERT INTO referrer_analytics (user_id, date, domain, path, campaign_params, views, created_at, updated_at)
                    VALUES (${userId}, ${today}, ${domain}, ${refPath}, ${campaignParams ? JSON.stringify(campaignParams) : null}, 1, NOW(), NOW())
                    ON CONFLICT (user_id, date, domain, path)
                    DO UPDATE SET 
                        views = referrer_analytics.views + 1,
                        updated_at = NOW()
                `);
			}
		}
	} catch (error) {
		console.error("Failed to track page view:", error);
	}
}

// Get analytics data for dashboard
export async function getAnalytics(userId: string, days: number = 30) {
	const startDate = new Date();
	startDate.setDate(startDate.getDate() - days);
	const startDateStr = startDate.toISOString().split("T")[0];

	// Get today's date
	const today = new Date().toISOString().split("T")[0];

	// Get total views (all time)
	const totalViewsResult = await db
		.select({ total: sql<number>`sum(views)` })
		.from(dailyAnalytics)
		.where(eq(dailyAnalytics.userId, userId));

	// Get today's views
	const todayViewsResult = await db
		.select({ total: sql<number>`sum(views)` })
		.from(dailyAnalytics)
		.where(and(eq(dailyAnalytics.userId, userId), eq(dailyAnalytics.date, today)));

	// Get recent views (last X days)
	const recentViewsResult = await db
		.select({ total: sql<number>`sum(views)` })
		.from(dailyAnalytics)
		.where(and(eq(dailyAnalytics.userId, userId), gte(dailyAnalytics.date, startDateStr)));

	// Get daily views for chart
	const dailyViews = await db
		.select({
			date: dailyAnalytics.date,
			views: dailyAnalytics.views,
		})
		.from(dailyAnalytics)
		.where(and(eq(dailyAnalytics.userId, userId), gte(dailyAnalytics.date, startDateStr)))
		.orderBy(dailyAnalytics.date);

	// Get top referrers (last X days)
	const topReferrers = await db
		.select({
			domain: referrerAnalytics.domain,
			path: referrerAnalytics.path,
			views: sql<number>`sum(views)`,
		})
		.from(referrerAnalytics)
		.where(and(eq(referrerAnalytics.userId, userId), gte(referrerAnalytics.date, startDateStr)))
		.groupBy(referrerAnalytics.domain, referrerAnalytics.path)
		.orderBy(desc(sql`sum(views)`))
		.limit(10);

	// Get today's top referrers
	const todayReferrers = await db
		.select({
			domain: referrerAnalytics.domain,
			path: referrerAnalytics.path,
			views: sql<number>`sum(views)`,
		})
		.from(referrerAnalytics)
		.where(and(eq(referrerAnalytics.userId, userId), eq(referrerAnalytics.date, today)))
		.groupBy(referrerAnalytics.domain, referrerAnalytics.path)
		.orderBy(desc(sql`sum(views)`))
		.limit(5);

	return {
		totalViews: totalViewsResult[0]?.total || 0,
		todayViews: todayViewsResult[0]?.total || 0,
		recentViews: recentViewsResult[0]?.total || 0,
		dailyViews,
		topReferrers: topReferrers.map((r) => ({
			referrer: r.domain + (r.path || ""),
			domain: r.domain,
			path: r.path,
			views: r.views,
		})),
		todayReferrers: todayReferrers.map((r) => ({
			referrer: r.domain + (r.path || ""),
			domain: r.domain,
			path: r.path,
			views: r.views,
		})),
	};
}

// Cleanup old analytics data (run this daily via cron)
export async function cleanupOldAnalytics(retentionDays: number = 120) {
	try {
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
		const cutoffDateStr = cutoffDate.toISOString().split("T")[0];

		// Delete old daily analytics
		const deletedDaily = await db
			.delete(dailyAnalytics)
			.where(lt(dailyAnalytics.date, cutoffDateStr));

		// Delete old referrer analytics
		const deletedReferrers = await db
			.delete(referrerAnalytics)
			.where(lt(referrerAnalytics.date, cutoffDateStr));

		console.log(`Cleaned up analytics older than ${retentionDays} days`);
		return { deletedDaily, deletedReferrers };
	} catch (error) {
		console.error("Failed to cleanup old analytics:", error);
		throw error;
	}
}
