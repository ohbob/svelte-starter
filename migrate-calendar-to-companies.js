import { sql } from "drizzle-orm";
import { db } from "./src/lib/server/db.ts";

async function migrateCalendarToCompanies() {
	console.log("🔄 Starting calendar migration to companies...");

	try {
		// Step 1: Add company_id columns to calendar tables
		console.log("📝 Adding company_id columns...");

		await db.execute(sql`ALTER TABLE meeting_types ADD COLUMN IF NOT EXISTS company_id TEXT`);
		await db.execute(sql`ALTER TABLE availability ADD COLUMN IF NOT EXISTS company_id TEXT`);
		await db.execute(
			sql`ALTER TABLE calendar_integrations ADD COLUMN IF NOT EXISTS company_id TEXT`
		);

		// Step 2: Update records with company_id from user's first company
		console.log("🔗 Updating meeting_types with company_id...");
		await db.execute(sql`
            UPDATE meeting_types 
            SET company_id = (
                SELECT c.id 
                FROM companies c 
                WHERE c.user_id = meeting_types.user_id 
                LIMIT 1
            )
            WHERE company_id IS NULL
        `);

		console.log("🔗 Updating availability with company_id...");
		await db.execute(sql`
            UPDATE availability 
            SET company_id = (
                SELECT c.id 
                FROM companies c 
                WHERE c.user_id = availability.user_id 
                LIMIT 1
            )
            WHERE company_id IS NULL
        `);

		console.log("🔗 Updating calendar_integrations with company_id...");
		await db.execute(sql`
            UPDATE calendar_integrations 
            SET company_id = (
                SELECT c.id 
                FROM companies c 
                WHERE c.user_id = calendar_integrations.user_id 
                LIMIT 1
            )
            WHERE company_id IS NULL
        `);

		// Step 3: Add foreign key constraints (only if company_id is not null)
		console.log("🔒 Adding foreign key constraints...");

		try {
			await db.execute(sql`
                ALTER TABLE meeting_types 
                ADD CONSTRAINT meeting_types_company_id_fkey 
                FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
            `);
		} catch (e) {
			console.log(
				"⚠️  Foreign key constraint for meeting_types already exists or failed:",
				e.message
			);
		}

		try {
			await db.execute(sql`
                ALTER TABLE availability 
                ADD CONSTRAINT availability_company_id_fkey 
                FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
            `);
		} catch (e) {
			console.log(
				"⚠️  Foreign key constraint for availability already exists or failed:",
				e.message
			);
		}

		try {
			await db.execute(sql`
                ALTER TABLE calendar_integrations 
                ADD CONSTRAINT calendar_integrations_company_id_fkey 
                FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
            `);
		} catch (e) {
			console.log(
				"⚠️  Foreign key constraint for calendar_integrations already exists or failed:",
				e.message
			);
		}

		// Step 4: Make company_id NOT NULL (only for records that have company_id)
		console.log("✅ Setting company_id as NOT NULL...");

		try {
			await db.execute(sql`ALTER TABLE meeting_types ALTER COLUMN company_id SET NOT NULL`);
		} catch (e) {
			console.log("⚠️  Could not set meeting_types.company_id as NOT NULL:", e.message);
		}

		try {
			await db.execute(sql`ALTER TABLE availability ALTER COLUMN company_id SET NOT NULL`);
		} catch (e) {
			console.log("⚠️  Could not set availability.company_id as NOT NULL:", e.message);
		}

		try {
			await db.execute(sql`ALTER TABLE calendar_integrations ALTER COLUMN company_id SET NOT NULL`);
		} catch (e) {
			console.log("⚠️  Could not set calendar_integrations.company_id as NOT NULL:", e.message);
		}

		// Step 5: Drop old user_id columns and constraints
		console.log("🗑️  Dropping old user_id columns...");

		try {
			await db.execute(
				sql`ALTER TABLE meeting_types DROP CONSTRAINT IF EXISTS meeting_types_user_id_user_id_fk`
			);
			await db.execute(sql`ALTER TABLE meeting_types DROP COLUMN IF EXISTS user_id`);
		} catch (e) {
			console.log("⚠️  Could not drop meeting_types.user_id:", e.message);
		}

		try {
			await db.execute(
				sql`ALTER TABLE availability DROP CONSTRAINT IF EXISTS availability_user_id_user_id_fk`
			);
			await db.execute(sql`ALTER TABLE availability DROP COLUMN IF EXISTS user_id`);
		} catch (e) {
			console.log("⚠️  Could not drop availability.user_id:", e.message);
		}

		try {
			await db.execute(
				sql`ALTER TABLE calendar_integrations DROP CONSTRAINT IF EXISTS calendar_integrations_user_id_user_id_fk`
			);
			await db.execute(sql`ALTER TABLE calendar_integrations DROP COLUMN IF EXISTS user_id`);
		} catch (e) {
			console.log("⚠️  Could not drop calendar_integrations.user_id:", e.message);
		}

		console.log("🎉 Calendar migration to companies completed successfully!");
	} catch (error) {
		console.error("❌ Migration failed:", error);
		throw error;
	}
}

// Run the migration
migrateCalendarToCompanies()
	.then(() => {
		console.log("✅ Migration completed!");
		process.exit(0);
	})
	.catch((error) => {
		console.error("❌ Migration failed:", error);
		process.exit(1);
	});
