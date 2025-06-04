import { eq } from "drizzle-orm";
import { db } from "./src/lib/server/db.ts";
import { calendarIntegrations, companies } from "./src/lib/server/schema/index.ts";

async function checkCalendarIntegrations() {
	console.log("🔍 Checking calendar integrations...");

	try {
		// Get all companies
		const allCompanies = await db.select().from(companies);
		console.log(`📊 Found ${allCompanies.length} companies:`);
		allCompanies.forEach((company) => {
			console.log(`  - ${company.name} (ID: ${company.id}, User: ${company.userId})`);
		});

		// Get all calendar integrations
		const allIntegrations = await db.select().from(calendarIntegrations);
		console.log(`\n📅 Found ${allIntegrations.length} calendar integrations:`);
		allIntegrations.forEach((integration) => {
			console.log(
				`  - User: ${integration.userId}, Provider: ${integration.provider}, Active: ${integration.isActive}`
			);
			console.log(`    Calendar ID: ${integration.calendarId}`);
			console.log(
				`    Selected Calendar: ${integration.selectedCalendarId} (${integration.selectedCalendarName})`
			);
			console.log(`    Expires: ${integration.expiresAt}`);
			console.log(`    Created: ${integration.createdAt}`);
			console.log("");
		});

		// Check specific company integration
		if (allCompanies.length > 0) {
			const firstCompany = allCompanies[0];
			console.log(`\n🔍 Checking integration for company: ${firstCompany.name}`);

			const userIntegrations = await db
				.select()
				.from(calendarIntegrations)
				.where(eq(calendarIntegrations.userId, firstCompany.userId));

			console.log(`Found ${userIntegrations.length} integrations for user ${firstCompany.userId}`);

			const activeIntegrations = userIntegrations.filter((i) => i.isActive);
			console.log(`Active integrations: ${activeIntegrations.length}`);
		}
	} catch (error) {
		console.error("❌ Error checking calendar integrations:", error);
	}

	process.exit(0);
}

checkCalendarIntegrations();
