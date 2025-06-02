import { getAnalytics } from "$lib/server/analytics";
import { auth } from "$lib/server/auth";
import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ request, cookies, parent }) => {
	console.log("🔄 App layout load triggered");

	try {
		// Get data from parent layout first - this ensures consistency
		const parentData = await parent();

		// If parent doesn't have user data, redirect to signin
		if (!parentData.user) {
			throw redirect(302, "/signin");
		}

		// Use parent's company data as the source of truth
		let currentCompany = parentData.selectedCompany;
		let userCompanies = parentData.companies || [];

		// If no companies exist, return minimal data
		if (userCompanies.length === 0) {
			return {
				user: parentData.user,
				companies: [],
				currentCompany: null,
				selectedCompanyId: null,
				analytics: null,
				todaysViews: 0,
			};
		}

		// Ensure we have a selected company
		if (!currentCompany && userCompanies.length > 0) {
			currentCompany = userCompanies[0];
			// Set cookie for consistency
			cookies.set("selectedCompanyId", currentCompany.id, {
				path: "/",
				maxAge: 60 * 60 * 24 * 30, // 30 days
				httpOnly: false,
				secure: false,
				sameSite: "lax",
			});
		}

		// Load analytics data with error handling
		let analyticsData = null;
		let todaysViews = 0;

		if (currentCompany) {
			try {
				analyticsData = await getAnalytics(currentCompany.id);
			} catch (analyticsError) {
				console.warn("Failed to load analytics data:", analyticsError);
				// Continue without analytics data rather than failing completely
				analyticsData = null;
			}
		}

		return {
			user: parentData.user,
			companies: userCompanies,
			currentCompany,
			selectedCompanyId: currentCompany?.id || null,
			analytics: analyticsData,
			todaysViews,
		};
	} catch (error: any) {
		console.error("Error in app layout server load:", error);

		// If it's a redirect, re-throw it
		if (error?.status === 302) {
			throw error;
		}

		// For other errors, try to provide fallback data
		try {
			const session = await auth.api.getSession({
				headers: request.headers,
			});

			if (!session) {
				throw redirect(302, "/signin");
			}

			// Return minimal fallback data
			return {
				user: session.user,
				companies: [],
				currentCompany: null,
				selectedCompanyId: null,
				analytics: null,
				todaysViews: 0,
			};
		} catch (fallbackError) {
			console.error("Fallback also failed:", fallbackError);
			throw redirect(302, "/signin");
		}
	}
};
