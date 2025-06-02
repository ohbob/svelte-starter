import { getAnalytics } from "$lib/server/analytics.js";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent }) => {
	const { currentCompany } = await parent();

	if (!currentCompany?.id) {
		return {
			analytics: {
				totalViews: 0,
				recentViews: 0,
				previousPeriodViews: 0,
				todayViews: 0,
				dailyViews: [],
				topReferrers: [],
			},
		};
	}

	try {
		const analytics = await getAnalytics(currentCompany.id as string);

		return {
			analytics,
		};
	} catch (error) {
		console.error("❌ Error loading analytics:", error);
		return {
			analytics: {
				totalViews: 0,
				recentViews: 0,
				previousPeriodViews: 0,
				todayViews: 0,
				dailyViews: [],
				topReferrers: [],
			},
		};
	}
};
