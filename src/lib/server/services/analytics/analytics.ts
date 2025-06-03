import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "../../db";
import { analytics } from "../../schema";

export interface AnalyticsData {
	totalViews: number;
	uniqueVisitors: number;
	topReferrers: Array<{ referrer: string; count: number }>;
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
		const analyticsData = await db.query.analytics.findMany({
			where: and(
				eq(analytics.companyId, companyId),
				gte(analytics.createdAt, startDate),
				lte(analytics.createdAt, endDate)
			),
			orderBy: [desc(analytics.createdAt)],
		});

		// Calculate metrics
		const totalViews = analyticsData.length;
		const uniqueVisitors = new Set(analyticsData.map((a) => a.ipAddress)).size;

		// Top referrers
		const referrerCounts = analyticsData.reduce(
			(acc, item) => {
				const referrer = item.referrer || "Direct";
				acc[referrer] = (acc[referrer] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);

		const topReferrers = Object.entries(referrerCounts)
			.map(([referrer, count]) => ({ referrer, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 10);

		// Daily views
		const dailyViewCounts = analyticsData.reduce(
			(acc, item) => {
				const date = item.createdAt.toISOString().split("T")[0];
				acc[date] = (acc[date] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);

		const dailyViews = Object.entries(dailyViewCounts)
			.map(([date, views]) => ({ date, views }))
			.sort((a, b) => a.date.localeCompare(b.date));

		// Simple conversion rate calculation (views to unique visitors)
		const conversionRate = uniqueVisitors > 0 ? (uniqueVisitors / totalViews) * 100 : 0;

		return {
			totalViews,
			uniqueVisitors,
			topReferrers,
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
}
