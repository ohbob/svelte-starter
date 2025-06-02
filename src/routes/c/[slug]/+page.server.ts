import { trackView } from "$lib/server/analytics";
import { db } from "$lib/server/db";
import { meetingTypes } from "$lib/server/schema/calendar.schema";
import { companies } from "$lib/server/schema/companies.schema";
import { error } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";

export async function load({ params, request, getClientAddress }) {
	const { slug } = params;

	try {
		// Get company by slug
		const company = await db
			.select()
			.from(companies)
			.where(and(eq(companies.slug, slug), eq(companies.isActive, true)))
			.limit(1);

		if (!company.length) {
			throw error(404, "Company not found");
		}

		const companyData = company[0];

		// Track the page view
		const referrer = request.headers.get("referer") || "";
		const userAgent = request.headers.get("user-agent") || "";
		const ipAddress = getClientAddress();
		const path = `/c/${slug}`;

		// Track view asynchronously (don't block page load)
		trackView(companyData.id, path, referrer, userAgent, ipAddress).catch((err) => {
			console.error("Failed to track view:", err);
		});

		// Get active meeting types for this company
		const companyMeetingTypes = await db
			.select()
			.from(meetingTypes)
			.where(and(eq(meetingTypes.companyId, companyData.id), eq(meetingTypes.isActive, true)));

		return {
			company: companyData,
			meetingTypes: companyMeetingTypes,
		};
	} catch (err) {
		console.error("Error loading company page:", err);
		throw error(500, "Failed to load company page");
	}
}
