import { AnalyticsService } from "$lib/server/services";
import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent }) => {
	// Get session and company data from parent layouts
	const { user, currentCompany } = await parent();

	if (!user || !currentCompany?.id) {
		return {
			analytics: {
				totalViews: 0,
				todayViews: 0,
				recentViews: 0,
				previousPeriodViews: 0,
				uniqueVisitors: 0,
				dailyViews: [],
				topReferrers: [],
				todayReferrers: [],
				conversionRate: 0,
			},
		};
	}

	try {
		const analyticsService = new AnalyticsService();

		// Calculate date range (last 30 days)
		const endDate = new Date();
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - 30);

		// Get current period analytics
		const analytics = await analyticsService.getCompanyAnalytics(
			currentCompany.id,
			startDate,
			endDate
		);

		// Calculate previous period for comparison (30 days before the current period)
		const previousEndDate = new Date(startDate);
		const previousStartDate = new Date(startDate);
		previousStartDate.setDate(previousStartDate.getDate() - 30);

		const previousAnalytics = await analyticsService.getCompanyAnalytics(
			currentCompany.id,
			previousStartDate,
			previousEndDate
		);

		return {
			analytics: {
				...analytics,
				previousPeriodViews: previousAnalytics.recentViews,
			},
		};
	} catch (error) {
		console.error("Error loading analytics:", error);
		return {
			analytics: {
				totalViews: 0,
				todayViews: 0,
				recentViews: 0,
				previousPeriodViews: 0,
				uniqueVisitors: 0,
				dailyViews: [],
				topReferrers: [],
				todayReferrers: [],
				conversionRate: 0,
			},
		};
	}
};

export const actions: Actions = {
	cleanup: async ({ request, parent }) => {
		const { user, currentCompany } = await parent();

		if (!user?.id || !currentCompany?.id) {
			return fail(401, { error: "Unauthorized" });
		}

		const formData = await request.formData();
		const retentionDays = parseInt(formData.get("retentionDays") as string) || 120;

		try {
			const analyticsService = new AnalyticsService();
			const result = await analyticsService.cleanupOldAnalytics(retentionDays);

			return {
				success: true,
				message: `Cleaned up analytics older than ${retentionDays} days`,
				result,
			};
		} catch (error) {
			console.error("Analytics cleanup error:", error);
			return fail(500, { error: "Failed to cleanup analytics" });
		}
	},
};
