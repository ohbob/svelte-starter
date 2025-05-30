import { auth } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { services } from "$lib/server/schema";
import { json } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import type { RequestHandler } from "./$types";

export const PUT: RequestHandler = async ({ request, params }) => {
	const session = await auth.api.getSession({
		headers: request.headers,
	});

	if (!session) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const data = await request.json();
		const { title, description, price, category, isActive } = data;

		if (!title || !description || !price) {
			return json({ error: "Missing required fields" }, { status: 400 });
		}

		const updateData = {
			title: title.trim(),
			description: description.trim(),
			price: price.toString(),
			category: category?.trim() || null,
			isActive: isActive ?? true,
			updatedAt: new Date(),
		};

		const [updated] = await db
			.update(services)
			.set(updateData)
			.where(and(eq(services.id, params.id), eq(services.userId, session.user.id)))
			.returning();

		if (!updated) {
			return json({ error: "Service not found" }, { status: 404 });
		}

		return json(updated);
	} catch (error) {
		console.error("Error updating service:", error);
		return json({ error: "Failed to update service" }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ request, params }) => {
	const session = await auth.api.getSession({
		headers: request.headers,
	});

	if (!session) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const [deleted] = await db
			.delete(services)
			.where(and(eq(services.id, params.id), eq(services.userId, session.user.id)))
			.returning();

		if (!deleted) {
			return json({ error: "Service not found" }, { status: 404 });
		}

		return json({ success: true });
	} catch (error) {
		console.error("Error deleting service:", error);
		return json({ error: "Failed to delete service" }, { status: 500 });
	}
};
