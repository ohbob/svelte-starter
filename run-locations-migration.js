import { sql } from "drizzle-orm";
import fs from "fs";
import { db } from "./src/lib/server/db.ts";

async function runMigration() {
	try {
		console.log("Running locations migration...");

		const sqlContent = fs.readFileSync("./create-locations-table.sql", "utf8");
		const statements = sqlContent.split(";").filter((stmt) => stmt.trim());

		for (const statement of statements) {
			if (statement.trim()) {
				try {
					await db.execute(sql.raw(statement.trim()));
					console.log("✓ Executed:", statement.trim().substring(0, 50) + "...");
				} catch (error) {
					if (error.message.includes("already exists") || error.message.includes("duplicate")) {
						console.log("⚠ Skipped (already exists):", statement.trim().substring(0, 50) + "...");
					} else {
						console.error("✗ Error:", error.message);
					}
				}
			}
		}

		console.log("Migration completed!");
		process.exit(0);
	} catch (error) {
		console.error("Migration failed:", error);
		process.exit(1);
	}
}

runMigration();
