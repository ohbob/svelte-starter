import { LocationService } from "$lib/server/services/calendar/location";
import { locationSchema } from "$lib/utils/validation";
import { error, fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, cookies }) => {
	const selectedCompanyId = cookies.get("selectedCompanyId");

	if (!selectedCompanyId) {
		throw redirect(302, "/app/companies");
	}

	try {
		const location = await LocationService.getById(params.id, selectedCompanyId);

		if (!location) {
			throw error(404, "Location not found");
		}

		return {
			location,
		};
	} catch (err) {
		console.error("Error loading location:", err);
		throw error(404, "Location not found");
	}
};

export const actions: Actions = {
	update: async ({ params, request, cookies }) => {
		console.log("Location update action called for ID:", params.id);

		const selectedCompanyId = cookies.get("selectedCompanyId");
		console.log("Selected company ID:", selectedCompanyId);

		if (!selectedCompanyId) {
			console.log("No selected company ID, redirecting to companies");
			throw redirect(302, "/app/companies");
		}

		try {
			const formData = await request.formData();
			console.log("Form data received:", Object.fromEntries(formData.entries()));

			const data = {
				type: formData.get("type") as string,
				name: formData.get("name") as string,
				description: (formData.get("description") as string) || undefined,
				isDefault: formData.get("isDefault") === "on",

				// In-person fields
				address: (formData.get("address") as string) || undefined,
				city: (formData.get("city") as string) || undefined,
				state: (formData.get("state") as string) || undefined,
				country: (formData.get("country") as string) || undefined,
				postalCode: (formData.get("postalCode") as string) || undefined,
				phone: (formData.get("phone") as string) || undefined,
				contactPerson: (formData.get("contactPerson") as string) || undefined,
				instructions: (formData.get("instructions") as string) || undefined,

				// Virtual fields
				platform: (formData.get("platform") as string) || undefined,
				autoGenerateLink: formData.get("autoGenerateLink") === "on",
				customMeetingUrl: (formData.get("customMeetingUrl") as string) || undefined,
				meetingInstructions: (formData.get("meetingInstructions") as string) || undefined,
			};

			console.log("Parsed data:", data);

			// Validate the data
			const validation = locationSchema.safeParse(data);
			if (!validation.success) {
				console.log("Validation failed:", validation.error.flatten().fieldErrors);
				const errors = validation.error.flatten().fieldErrors;
				return fail(400, {
					error: "Validation failed",
					errors,
					data,
				});
			}

			console.log("Validation passed, updating location");

			// Update the location
			const location = await LocationService.update(params.id, selectedCompanyId, validation.data);

			if (!location) {
				console.log("Location not found or update failed");
				return fail(404, { error: "Location not found" });
			}

			console.log("Location updated successfully, redirecting to /app/calendar/locations");
		} catch (error) {
			console.error("Error updating location:", error);
			return fail(500, { error: "Failed to update location" });
		}

		// Redirect to locations list (outside try-catch to avoid being caught)
		redirect(302, "/app/calendar/locations");
	},
};
