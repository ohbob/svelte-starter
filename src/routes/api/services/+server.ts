import { auth } from "$lib/server/auth";
import { db } from "$lib/server/db";
import { services } from "$lib/server/schema";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
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

		const newService = {
			id: crypto.randomUUID(),
			title: title.trim(),
			description: description.trim(),
			price: price.toString(),
			category: category?.trim() || null,
			isActive: isActive ?? true,
			userId: session.user.id,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const [created] = await db.insert(services).values(newService).returning();

		return json(created);
	} catch (error) {
		console.error("Error creating service:", error);
		return json({ error: "Failed to create service" }, { status: 500 });
	}
};
