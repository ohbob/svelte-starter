import { readFileSync } from "fs";
import { db } from "./src/lib/server/db.ts";

async function runMigration() {
	try {
		console.log("Running availability templates migration...");

		const migrationSQL = readFileSync("./manual-migration-availability-templates.sql", "utf8");

		// Split by statement separator and run each statement
		const statements = migrationSQL.split("-- Step").filter((s) => s.trim());

		for (let i = 0; i < statements.length; i++) {
			const statement = statements[i].trim();
			if (statement) {
				console.log(`Running step ${i + 1}...`);
				await db.execute(statement);
			}
		}

		console.log("Migration completed successfully!");
		process.exit(0);
	} catch (error) {
		console.error("Migration failed:", error);
		process.exit(1);
	}
}

runMigration();
