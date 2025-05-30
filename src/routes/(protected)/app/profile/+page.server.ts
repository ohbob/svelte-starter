import { auth } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { user } from "$lib/server/schema";
import { fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";

export const load = async ({ request }) => {
	const session = await auth.api.getSession({
		headers: request.headers,
	});

	if (!session) {
		throw redirect(302, "/");
	}

	// Get current user data
	const [userData] = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1);

	return {
		user: userData,
	};
};

export const actions = {
	updateProfile: async ({ request }) => {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			return fail(401, { error: "Unauthorized" });
		}

		const formData = await request.formData();
		const customUrl = formData.get("customUrl")?.toString()?.trim();
		const contactEmail = formData.get("contactEmail")?.toString()?.trim();

		// Validate custom URL
		if (customUrl) {
			// Check if URL is already taken
			const existingUser = await db
				.select()
				.from(user)
				.where(eq(user.customUrl, customUrl))
				.limit(1);

			if (existingUser.length > 0 && existingUser[0].id !== session.user.id) {
				return fail(400, { error: "This URL is already taken" });
			}

			// Validate URL format (alphanumeric, hyphens, underscores only)
			if (!/^[a-zA-Z0-9_-]+$/.test(customUrl)) {
				return fail(400, {
					error: "URL can only contain letters, numbers, hyphens, and underscores",
				});
			}

			if (customUrl.length < 3 || customUrl.length > 30) {
				return fail(400, { error: "URL must be between 3 and 30 characters" });
			}
		}

		// Validate contact email
		if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
			return fail(400, { error: "Please enter a valid email address" });
		}

		try {
			await db
				.update(user)
				.set({
					customUrl: customUrl || null,
					contactEmail: contactEmail || null,
					updatedAt: new Date(),
				})
				.where(eq(user.id, session.user.id));

			return { success: true };
		} catch (error) {
			console.error("Error updating profile:", error);
			return fail(500, { error: "Failed to update profile" });
		}
	},
};
