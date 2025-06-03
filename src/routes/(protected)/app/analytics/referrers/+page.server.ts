import { AnalyticsService } from "$lib/server/services";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent }) => {
	// Get session and company data from parent layouts
	const { user, currentCompany } = await parent();

	if (!user || !currentCompany?.id) {
		return {
			analytics: {
				totalViews: 0,
				todayViews: 0,
				recentViews: 0,
				dailyViews: [],
				topReferrers: [],
				todayReferrers: [],
			},
		};
	}

	try {
		const analyticsService = new AnalyticsService();

		// Calculate date range (last 30 days)
		const endDate = new Date();
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - 30);

		const analytics = await analyticsService.getCompanyAnalytics(
			currentCompany.id,
			startDate,
			endDate
		);

		return {
			analytics,
		};
	} catch (error) {
		console.error("Error loading referrers analytics:", error);
		return {
			analytics: {
				totalViews: 0,
				todayViews: 0,
				recentViews: 0,
				dailyViews: [],
				topReferrers: [],
				todayReferrers: [],
			},
		};
	}
};
