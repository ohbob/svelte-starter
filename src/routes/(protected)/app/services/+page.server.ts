import { auth } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { services, user } from "$lib/server/schema";
import { fail, redirect } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";

export const load = async ({ request }) => {
	const session = await auth.api.getSession({
		headers: request.headers,
	});

	if (!session) {
		throw redirect(302, "/");
	}

	// Get user data
	const [userData] = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1);

	// Get user's services
	const userServices = await db
		.select()
		.from(services)
		.where(eq(services.userId, session.user.id))
		.orderBy(services.createdAt);

	return {
		user: userData,
		services: userServices,
	};
};

export const actions = {
	create: async ({ request }) => {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			return fail(401, { error: "Unauthorized" });
		}

		const formData = await request.formData();
		const title = formData.get("title")?.toString()?.trim();
		const description = formData.get("description")?.toString()?.trim();
		const price = formData.get("price")?.toString()?.trim();
		const category = formData.get("category")?.toString()?.trim();
		const isActive = formData.get("isActive") === "on";

		if (!title || !description || !price) {
			return fail(400, { error: "Please fill in all required fields" });
		}

		try {
			const [newService] = await db
				.insert(services)
				.values({
					id: crypto.randomUUID(),
					title,
					description,
					price,
					category: category || null,
					isActive,
					userId: session.user.id,
					createdAt: new Date(),
					updatedAt: new Date(),
				})
				.returning();

			// Create notification with new clean API
			// await notification.success(
			// 	"Service Created",
			// 	`Your new service "${title}" has been added to your portfolio and is now live.`,
			// 	{ userId: session.user.id }
			// );

			return { success: true, action: "create", service: newService };
		} catch (error) {
			console.error("Error creating service:", error);
			return fail(500, { error: "Failed to create service" });
		}
	},

	update: async ({ request }) => {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			return fail(401, { error: "Unauthorized" });
		}

		const formData = await request.formData();
		const serviceId = formData.get("serviceId")?.toString();
		const title = formData.get("title")?.toString()?.trim();
		const description = formData.get("description")?.toString()?.trim();
		const price = formData.get("price")?.toString()?.trim();
		const category = formData.get("category")?.toString()?.trim();
		const isActive = formData.get("isActive") === "on";

		if (!serviceId || !title || !description || !price) {
			return fail(400, { error: "Please fill in all required fields" });
		}

		try {
			const [updatedService] = await db
				.update(services)
				.set({
					title,
					description,
					price,
					category: category || null,
					isActive,
					updatedAt: new Date(),
				})
				.where(and(eq(services.id, serviceId), eq(services.userId, session.user.id)))
				.returning();

			if (!updatedService) {
				return fail(404, { error: "Service not found" });
			}

			// Create notification with new clean API
			// await notification.success(
			// 	"Service Updated",
			// 	`Your service "${title}" has been successfully updated.`,
			// 	{ userId: session.user.id }
			// );

			return { success: true, action: "update", service: updatedService };
		} catch (error) {
			console.error("Error updating service:", error);
			return fail(500, { error: "Failed to update service" });
		}
	},

	delete: async ({ request }) => {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			return fail(401, { error: "Unauthorized" });
		}

		const formData = await request.formData();
		const serviceId = formData.get("serviceId")?.toString();

		if (!serviceId) {
			return fail(400, { error: "Service ID is required" });
		}

		try {
			const [deletedService] = await db
				.delete(services)
				.where(and(eq(services.id, serviceId), eq(services.userId, session.user.id)))
				.returning();

			if (!deletedService) {
				return fail(404, { error: "Service not found" });
			}

			// Create notification with new clean API
			// await notification.info(
			// 	"Service Deleted",
			// 	`The service "${deletedService.title}" has been removed from your portfolio.`,
			// 	{ userId: session.user.id }
			// );

			return { success: true, action: "delete" };
		} catch (error) {
			console.error("Error deleting service:", error);
			return fail(500, { error: "Failed to delete service" });
		}
	},
};
