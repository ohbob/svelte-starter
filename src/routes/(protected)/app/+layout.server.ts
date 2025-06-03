import { CompanyService } from "$lib/server/services";
import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ parent }) => {
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
				const companyService = new CompanyService();
				const company = await companyService.getCompanyById(parentData.selectedCompany.id);

				if (company) {
					currentCompanySlug = company.slug;
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

		// For other errors, redirect to signin instead of making another session call
		throw redirect(302, "/signin");
	}
};
