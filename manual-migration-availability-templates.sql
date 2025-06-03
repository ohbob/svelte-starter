-- Manual migration for availability templates many-to-many relationship
-- Step 1: Create the junction table
CREATE TABLE IF NOT EXISTS "meeting_type_availability_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_type_id" uuid NOT NULL,
	"availability_template_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Step 2: Add foreign key constraints
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'meeting_type_availability_templates_meeting_type_id_meeting_types_id_fk'
    ) THEN
        ALTER TABLE "meeting_type_availability_templates" ADD CONSTRAINT "meeting_type_availability_templates_meeting_type_id_meeting_types_id_fk" FOREIGN KEY ("meeting_type_id") REFERENCES "public"."meeting_types"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'meeting_type_availability_templates_availability_template_id_availability_templates_id_fk'
    ) THEN
        ALTER TABLE "meeting_type_availability_templates" ADD CONSTRAINT "meeting_type_availability_templates_availability_template_id_availability_templates_id_fk" FOREIGN KEY ("availability_template_id") REFERENCES "public"."availability_templates"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;

-- Step 3: Migrate existing data
INSERT INTO "meeting_type_availability_templates" ("meeting_type_id", "availability_template_id")
SELECT "id", "availability_template_id" 
FROM "meeting_types" 
WHERE "availability_template_id" IS NOT NULL
ON CONFLICT DO NOTHING;

-- Step 4: Drop the old foreign key constraint
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'meeting_types_availability_template_id_availability_templates_id_fk'
    ) THEN
        ALTER TABLE "meeting_types" DROP CONSTRAINT "meeting_types_availability_template_id_availability_templates_id_fk";
    END IF;
END $$;

-- Step 5: Drop the old column
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'meeting_types' AND column_name = 'availability_template_id'
    ) THEN
        ALTER TABLE "meeting_types" DROP COLUMN "availability_template_id";
    END IF;
END $$; 