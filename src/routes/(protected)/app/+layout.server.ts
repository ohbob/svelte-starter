import { getAnalytics } from "$lib/server/analytics";
import { auth } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { companies, user } from "$lib/server/schema";
import { redirect } from "@sveltejs/kit";
import { asc, eq } from "drizzle-orm";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ request, cookies }) => {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			throw redirect(302, "/signin");
		}

		// Fetch complete user data from database including customUrl
		const userData = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1);
		const completeUser = userData[0];

		if (!completeUser) {
			throw redirect(302, "/signin");
		}

		// Get user's companies with proper ordering
		const userCompanies = await db
			.select()
			.from(companies)
			.where(eq(companies.userId, session.user.id))
			.orderBy(asc(companies.createdAt));

		// Get selected company ID from cookie
		const selectedCompanyId = cookies.get("selectedCompanyId");

		// Determine current company
		let currentCompany = null;
		if (selectedCompanyId && userCompanies.length > 0) {
			currentCompany = userCompanies.find((c) => c.id === selectedCompanyId) || userCompanies[0];
		} else if (userCompanies.length > 0) {
			// Auto-select the first company if none is selected
			currentCompany = userCompanies[0];
			// Set the cookie so it persists
			cookies.set("selectedCompanyId", currentCompany.id, {
				path: "/",
				maxAge: 60 * 60 * 24 * 30, // 30 days
				httpOnly: false, // Allow client-side access
				secure: false, // Set to true in production with HTTPS
				sameSite: "lax",
			});
		}

		// Load analytics data for current company
		let analyticsData = null;
		if (currentCompany) {
			analyticsData = await getAnalytics(currentCompany.id);
		}

		return {
			user: completeUser,
			companies: userCompanies,
			currentCompany,
			analytics: analyticsData,
		};
	} catch (error: any) {
		console.error("Error in layout server load:", error);

		// If it's a redirect, re-throw it
		if (error?.status === 302) {
			throw error;
		}

		// For other errors, try to handle gracefully
		throw new Error("Failed to load application data");
	}
};
