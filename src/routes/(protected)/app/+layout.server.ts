import { auth } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { companies } from "$lib/server/schema";
import { redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ request, cookies, parent }) => {
	console.log("🔄 App layout load triggered");

	try {
		// Get minimal data from parent layout
		const parentData = await parent();

		// If parent doesn't have user data, redirect to signin
		if (!parentData.user) {
			throw redirect(302, "/signin");
		}

		// If we have a selected company, get just its slug for the "View Company Page" link
		let currentCompanySlug = null;
		if (parentData.selectedCompany?.id) {
			try {
				const companySlug = await db
					.select({ slug: companies.slug })
					.from(companies)
					.where(eq(companies.id, parentData.selectedCompany.id))
					.limit(1);

				if (companySlug.length > 0) {
					currentCompanySlug = companySlug[0].slug;
				}
			} catch (error) {
				console.warn("Failed to load company slug:", error);
				// Continue without slug
			}
		}

		// Just pass through the minimal data with slug added
		return {
			user: parentData.user,
			companies: parentData.companies, // Only id and name
			currentCompany: {
				...parentData.selectedCompany, // id and name
				slug: currentCompanySlug, // Add slug for "View Company Page" link
			},
			selectedCompanyId: parentData.selectedCompany?.id || null,
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
			};
		} catch (fallbackError) {
			console.error("Fallback also failed:", fallbackError);
			throw redirect(302, "/signin");
		}
	}
};
