ALTER TABLE "availability_templates" DROP CONSTRAINT "availability_templates_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "availability_templates" ADD COLUMN "company_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "availability_templates" ADD CONSTRAINT "availability_templates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_templates" DROP COLUMN "user_id";