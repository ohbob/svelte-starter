import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);

async function cleanup() {
	try {
		console.log("Cleaning up orphaned calendar integrations...");

		// Check orphaned records first
		const orphaned = await db.execute(
			sql`SELECT user_id FROM calendar_integrations WHERE user_id NOT IN (SELECT id FROM "user")`
		);
		console.log("Found orphaned records:", orphaned.rows.length);

		// Delete orphaned calendar integrations
		const result = await db.execute(
			sql`DELETE FROM calendar_integrations WHERE user_id NOT IN (SELECT id FROM "user")`
		);
		console.log("Deleted orphaned records:", result.rowCount);

		// Show remaining count
		const count = await db.execute(sql`SELECT COUNT(*) as count FROM calendar_integrations`);
		console.log("Remaining calendar integrations:", count.rows[0].count);

		await client.end();
		console.log("Cleanup completed successfully!");
	} catch (error) {
		console.error("Error:", error);
		await client.end();
		process.exit(1);
	}
}

cleanup();
