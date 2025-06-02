import { env } from "$env/dynamic/private";
import { PUBLIC_BASE_URL } from "$env/static/public";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "./db";
import { companies } from "./schema/companies.schema";

// Helper function to generate unique slug
async function generateUniqueSlug(name: string): Promise<string> {
	const baseSlug = name
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "") // Remove special characters
		.replace(/\s+/g, "-") // Replace spaces with hyphens
		.replace(/-+/g, "-") // Replace multiple hyphens with single
		.trim();

	// Keep trying until we find a unique slug
	let attempts = 0;
	let slug = baseSlug;

	while (attempts < 10) {
		// Add random suffix for uniqueness
		const suffix = nanoid(6).toLowerCase();
		slug = attempts === 0 ? `${baseSlug}-${suffix}` : `${baseSlug}-${suffix}-${attempts}`;

		// Check if this slug already exists
		const existing = await db.select().from(companies).where(eq(companies.slug, slug)).limit(1);

		if (existing.length === 0) {
			return slug;
		}

		attempts++;
	}

	// Fallback to completely random slug if all attempts failed
	return `company-${nanoid(12).toLowerCase()}`;
}

export const auth = betterAuth({
	baseURL: PUBLIC_BASE_URL,
	database: drizzleAdapter(db, {
		provider: "pg",
	}),

	// https://www.better-auth.com/docs/concepts/session-management#session-caching
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60, // 5 minutes
		},
	},

	// Auto-create company when user signs up
	hooks: {
		after: createAuthMiddleware(async (ctx) => {
			// Check if this is a signup or OAuth callback
			if (
				ctx.path.includes("sign-up") ||
				ctx.path.includes("callback") ||
				ctx.path.includes("oauth")
			) {
				console.log("🔄 Hook triggered for path:", ctx.path);
				const newSession = ctx.context.newSession;

				if (newSession && newSession.user) {
					const user = newSession.user;
					console.log("👤 Processing user for auto-company creation:", user.email);

					// Check if user already has a company
					const existingCompanies = await db
						.select()
						.from(companies)
						.where(eq(companies.userId, user.id));

					if (existingCompanies.length === 0) {
						const companyName = `${user.name} Company`;
						const slug = await generateUniqueSlug(companyName);

						try {
							await db.insert(companies).values({
								id: nanoid(),
								userId: user.id,
								name: companyName,
								slug: slug,
								isActive: true,
								createdAt: new Date(),
								updatedAt: new Date(),
							});
							console.log(
								`✅ Auto-created company "${companyName}" with slug "${slug}" for user ${user.email}`
							);
						} catch (error) {
							console.error("❌ Failed to auto-create company:", error);
						}
					} else {
						console.log("📋 User already has companies:", existingCompanies.length);
					}
				}
			}
		}),
	},

	// https://www.better-auth.com/docs/concepts/oauth
	socialProviders: {
		github: {
			clientId: env.GITHUB_CLIENT_ID!,
			clientSecret: env.GITHUB_CLIENT_SECRET!,
		},
		google: {
			clientId: env.GOOGLE_CLIENT_ID!,
			clientSecret: env.GOOGLE_CLIENT_SECRET!,
		},
		discord: {
			clientId: env.DISCORD_CLIENT_ID!,
			clientSecret: env.DISCORD_CLIENT_SECRET!,
			// authorizationParams: {
			// 	consent: 'none'  // This is more widely supported
			// }
		},
	},

	// https://www.better-auth.com/docs/authentication/email-password
	// emailAndPassword: {
	//   enabled: true,
	// },
});
