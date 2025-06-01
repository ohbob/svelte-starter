import { auth } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { services, user } from "$lib/server/schema";
import { fail, redirect } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";

// Helper: Get authenticated session or fail
const getAuthenticatedSession = async (request) => {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) throw redirect(302, "/");
	return session;
};

// Helper: Extract and validate form data
const extractServiceData = (formData) => {
	const title = formData.get("title")?.toString()?.trim();
	const description = formData.get("description")?.toString()?.trim();
	const price = formData.get("price")?.toString()?.trim();
	const category = formData.get("category")?.toString()?.trim();
	const isActive = formData.get("isActive") === "on";

	if (!title || !description || !price) {
		throw new Error("Please fill in all required fields");
	}

	return { title, description, price, category: category || null, isActive };
};

// Helper: Handle database operations with consistent error handling
const handleDbOperation = async (operation, errorMessage) => {
	try {
		return await operation();
	} catch (error) {
		console.error(`${errorMessage}:`, error);
		throw new Error(errorMessage);
	}
};

export const load = async ({ request }) => {
	const session = await getAuthenticatedSession(request);

	const [userData, userServices] = await Promise.all([
		db.select().from(user).where(eq(user.id, session.user.id)).limit(1),
		db
			.select()
			.from(services)
			.where(eq(services.userId, session.user.id))
			.orderBy(services.createdAt),
	]);

	return {
		user: userData[0],
		services: userServices,
	};
};

export const actions = {
	create: async ({ request }) => {
		const session = await getAuthenticatedSession(request);
		const formData = await request.formData();

		try {
			const serviceData = extractServiceData(formData);

			const newService = await handleDbOperation(
				() =>
					db
						.insert(services)
						.values({
							id: crypto.randomUUID(),
							...serviceData,
							userId: session.user.id,
							createdAt: new Date(),
							updatedAt: new Date(),
						})
						.returning(),
				"Failed to create service"
			);

			return { success: true, action: "create", service: newService[0] };
		} catch (error) {
			return fail(error.message.includes("required fields") ? 400 : 500, { error: error.message });
		}
	},

	update: async ({ request }) => {
		const session = await getAuthenticatedSession(request);
		const formData = await request.formData();
		const serviceId = formData.get("serviceId")?.toString();

		if (!serviceId) {
			return fail(400, { error: "Service ID is required" });
		}

		try {
			const serviceData = extractServiceData(formData);

			const updatedService = await handleDbOperation(
				() =>
					db
						.update(services)
						.set({ ...serviceData, updatedAt: new Date() })
						.where(and(eq(services.id, serviceId), eq(services.userId, session.user.id)))
						.returning(),
				"Failed to update service"
			);

			if (!updatedService[0]) {
				return fail(404, { error: "Service not found" });
			}

			return { success: true, action: "update", service: updatedService[0] };
		} catch (error) {
			return fail(error.message.includes("required fields") ? 400 : 500, { error: error.message });
		}
	},

	delete: async ({ request }) => {
		const session = await getAuthenticatedSession(request);
		const formData = await request.formData();
		const serviceId = formData.get("serviceId")?.toString();

		if (!serviceId) {
			return fail(400, { error: "Service ID is required" });
		}

		try {
			const deletedService = await handleDbOperation(
				() =>
					db
						.delete(services)
						.where(and(eq(services.id, serviceId), eq(services.userId, session.user.id)))
						.returning(),
				"Failed to delete service"
			);

			if (!deletedService[0]) {
				return fail(404, { error: "Service not found" });
			}

			return { success: true, action: "delete" };
		} catch (error) {
			return fail(500, { error: error.message });
		}
	},
};
