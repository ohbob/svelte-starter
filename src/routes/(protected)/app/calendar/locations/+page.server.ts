import { LocationService } from "$lib/server/services/calendar/location";
import { redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ cookies }) => {
	const selectedCompanyId = cookies.get("selectedCompanyId");

	if (!selectedCompanyId) {
		throw redirect(302, "/app/companies");
	}

	try {
		const locations = await LocationService.getByCompany(selectedCompanyId);

		return {
			locations,
		};
	} catch (error) {
		console.error("Error loading locations:", error);
		return {
			locations: [],
		};
	}
};

export const actions: Actions = {
	deleteLocation: async ({ request, cookies }) => {
		const selectedCompanyId = cookies.get("selectedCompanyId");

		if (!selectedCompanyId) {
			throw redirect(302, "/app/companies");
		}

		try {
			const data = await request.formData();
			const locationId = data.get("id") as string;

			if (!locationId) {
				return {
					error: "Location ID is required",
				};
			}

			await LocationService.delete(locationId, selectedCompanyId);

			return {
				success: true,
				message: "Location deleted successfully",
			};
		} catch (error) {
			console.error("Error deleting location:", error);
			return {
				error: error instanceof Error ? error.message : "Failed to delete location",
			};
		}
	},
};
