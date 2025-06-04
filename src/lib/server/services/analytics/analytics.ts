import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "../../db";
import { analytics, dailyAnalytics, referrerAnalytics } from "../../schema";

export interface AnalyticsData {
	totalViews: number;
	todayViews: number;
	recentViews: number;
	uniqueVisitors: number;
	topReferrers: Array<{
		referrer: string;
		domain: string;
		path: string | null;
		views: number;
		percentage: number;
		source: string;
	}>;
	todayReferrers: Array<{
		referrer: string;
		domain: string;
		path: string | null;
		views: number;
		percentage: number;
		source: string;
	}>;
	dailyViews: Array<{ date: string; views: number }>;
	conversionRate: number;
}

export interface CreateAnalyticsData {
	companyId: string;
	path: string;
	referrer?: string;
	userAgent?: string;
	ipAddress?: string;
}

export class AnalyticsService {
	async track(data: CreateAnalyticsData) {
		await db.insert(analytics).values({
			companyId: data.companyId,
			path: data.path,
			referrer: data.referrer,
			userAgent: data.userAgent,
			ipAddress: data.ipAddress,
		});
	}

	async getCompanyAnalytics(
		companyId: string,
		startDate: Date,
		endDate: Date
	): Promise<AnalyticsData> {
		// Get today's date
		const today = new Date().toISOString().split("T")[0];
		const startDateStr = startDate.toISOString().split("T")[0];

		// Get total views (all time)
		const totalViewsResult = await db
			.select({ total: sql<number>`sum(views)` })
			.from(dailyAnalytics)
			.where(eq(dailyAnalytics.companyId, companyId));

		// Get today's views
		const todayViewsResult = await db
			.select({ total: sql<number>`sum(views)` })
			.from(dailyAnalytics)
			.where(and(eq(dailyAnalytics.companyId, companyId), eq(dailyAnalytics.date, today)));

		// Get recent views (last X days)
		const recentViewsResult = await db
			.select({ total: sql<number>`sum(views)` })
			.from(dailyAnalytics)
			.where(and(eq(dailyAnalytics.companyId, companyId), gte(dailyAnalytics.date, startDateStr)));

		// Get daily views for chart
		const dailyViews = await db
			.select({
				date: dailyAnalytics.date,
				views: dailyAnalytics.views,
			})
			.from(dailyAnalytics)
			.where(and(eq(dailyAnalytics.companyId, companyId), gte(dailyAnalytics.date, startDateStr)))
			.orderBy(dailyAnalytics.date);

		// Get top referrers (last X days) - limit to 5
		const topReferrersRaw = await db
			.select({
				domain: referrerAnalytics.domain,
				path: referrerAnalytics.path,
				views: sql<number>`sum(views)`,
			})
			.from(referrerAnalytics)
			.where(
				and(eq(referrerAnalytics.companyId, companyId), gte(referrerAnalytics.date, startDateStr))
			)
			.groupBy(referrerAnalytics.domain, referrerAnalytics.path)
			.orderBy(desc(sql`sum(views)`))
			.limit(5);

		// Get today's top referrers - limit to 5
		const todayReferrersRaw = await db
			.select({
				domain: referrerAnalytics.domain,
				path: referrerAnalytics.path,
				views: sql<number>`sum(views)`,
			})
			.from(referrerAnalytics)
			.where(and(eq(referrerAnalytics.companyId, companyId), eq(referrerAnalytics.date, today)))
			.groupBy(referrerAnalytics.domain, referrerAnalytics.path)
			.orderBy(desc(sql`sum(views)`))
			.limit(5);

		// Calculate unique visitors from raw analytics data
		const analyticsData = await db.query.analytics.findMany({
			where: and(
				eq(analytics.companyId, companyId),
				gte(analytics.createdAt, startDate),
				lte(analytics.createdAt, endDate)
			),
		});

		const uniqueVisitors = new Set(analyticsData.map((a) => a.ipAddress)).size;
		const conversionRate =
			uniqueVisitors > 0 ? (uniqueVisitors / (totalViewsResult[0]?.total || 1)) * 100 : 0;

		// Get total views for percentage calculation
		const totalRecentViews = recentViewsResult[0]?.total || 0;
		const totalTodayViews = todayViewsResult[0]?.total || 0;

		// Format referrers with percentages and clean display names
		const topReferrers = topReferrersRaw.map((r) => ({
			referrer: r.domain + (r.path || ""),
			domain: r.domain,
			path: r.path,
			views: r.views,
			percentage: totalRecentViews > 0 ? Math.round((r.views / totalRecentViews) * 100) : 0,
			source: r.domain === "direct" ? "Direct" : r.domain,
		}));

		const todayReferrers = todayReferrersRaw.map((r) => ({
			referrer: r.domain + (r.path || ""),
			domain: r.domain,
			path: r.path,
			views: r.views,
			percentage: totalTodayViews > 0 ? Math.round((r.views / totalTodayViews) * 100) : 0,
			source: r.domain === "direct" ? "Direct" : r.domain,
		}));

		return {
			totalViews: totalViewsResult[0]?.total || 0,
			todayViews: todayViewsResult[0]?.total || 0,
			recentViews: recentViewsResult[0]?.total || 0,
			uniqueVisitors,
			topReferrers,
			todayReferrers,
			dailyViews,
			conversionRate,
		};
	}

	async getPathAnalytics(companyId: string, path: string, days: number = 30) {
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - days);

		return await db.query.analytics.findMany({
			where: and(
				eq(analytics.companyId, companyId),
				eq(analytics.path, path),
				gte(analytics.createdAt, startDate)
			),
			orderBy: [desc(analytics.createdAt)],
		});
	}

	async cleanup(olderThanDays: number = 90) {
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

		const deleted = await db.delete(analytics).where(lte(analytics.createdAt, cutoffDate));

		return deleted;
	}

	// Track a page view (equivalent to old trackView function)
	async trackView(
		companyId: string,
		path: string,
		referrer?: string,
		userAgent?: string,
		ipAddress?: string
	) {
		try {
			// Get today's date
			const today = new Date().toISOString().split("T")[0];

			// Parse referrer to extract domain and path
			let domain = "direct";
			let referrerPath = null;
			let campaignParams = null;

			if (referrer && referrer !== "") {
				try {
					const url = new URL(referrer);
					domain = url.hostname.replace(/^www\./, "");
					referrerPath = url.pathname;

					// Extract campaign parameters
					const searchParams = url.searchParams;
					const utmParams: Record<string, string> = {};
					for (const [key, value] of searchParams.entries()) {
						if (key.startsWith("utm_") || key.startsWith("ref_")) {
							utmParams[key] = value;
						}
					}
					if (Object.keys(utmParams).length > 0) {
						campaignParams = utmParams;
					}
				} catch {
					// If URL parsing fails, treat as direct
					domain = "direct";
				}
			}

			// Update daily analytics (upsert)
			await db
				.insert(dailyAnalytics)
				.values({
					companyId,
					date: today,
					views: 1,
				})
				.onConflictDoUpdate({
					target: [dailyAnalytics.companyId, dailyAnalytics.date],
					set: {
						views: sql`${dailyAnalytics.views} + 1`,
						updatedAt: new Date(),
					},
				});

			// Update referrer analytics (upsert)
			await db
				.insert(referrerAnalytics)
				.values({
					companyId,
					date: today,
					domain,
					path: referrerPath,
					campaignParams,
					views: 1,
				})
				.onConflictDoUpdate({
					target: [
						referrerAnalytics.companyId,
						referrerAnalytics.date,
						referrerAnalytics.domain,
						referrerAnalytics.path,
					],
					set: {
						views: sql`${referrerAnalytics.views} + 1`,
						updatedAt: new Date(),
					},
				});

			// Also store in the raw analytics table for detailed tracking
			await db.insert(analytics).values({
				companyId,
				path,
				userAgent,
				ipAddress,
				referrer,
			});

			console.log(`Tracked view for company ${companyId}: ${path} from ${domain}`);
		} catch (error) {
			console.error("Failed to track view:", error);
			// Don't throw - analytics failures shouldn't break the app
		}
	}

	// Cleanup old analytics data (equivalent to old cleanupOldAnalytics function)
	async cleanupOldAnalytics(retentionDays: number = 120) {
		try {
			const cutoffDate = new Date();
			cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
			const cutoffDateStr = cutoffDate.toISOString().split("T")[0];

			// Delete old daily analytics
			const deletedDaily = await db
				.delete(dailyAnalytics)
				.where(lte(dailyAnalytics.date, cutoffDateStr));

			// Delete old referrer analytics
			const deletedReferrers = await db
				.delete(referrerAnalytics)
				.where(lte(referrerAnalytics.date, cutoffDateStr));

			console.log(`Cleaned up analytics older than ${retentionDays} days`);
			return { deletedDaily, deletedReferrers };
		} catch (error) {
			console.error("Failed to cleanup old analytics:", error);
			throw error;
		}
	}
}
