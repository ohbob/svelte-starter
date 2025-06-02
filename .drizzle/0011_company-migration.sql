ALTER TABLE "services" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "services" CASCADE;--> statement-breakpoint
ALTER TABLE "availability" RENAME COLUMN "user_id" TO "company_id";--> statement-breakpoint
ALTER TABLE "calendar_integrations" RENAME COLUMN "user_id" TO "company_id";--> statement-breakpoint
ALTER TABLE "meeting_types" RENAME COLUMN "user_id" TO "company_id";--> statement-breakpoint
ALTER TABLE "availability" DROP CONSTRAINT "availability_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "calendar_integrations" DROP CONSTRAINT "calendar_integrations_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "meeting_types" DROP CONSTRAINT "meeting_types_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "companies" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "companies" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "companies" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "companies" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "vat" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "reg_nr" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "logo" text;--> statement-breakpoint
ALTER TABLE "availability" ADD CONSTRAINT "availability_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_integrations" ADD CONSTRAINT "calendar_integrations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_types" ADD CONSTRAINT "meeting_types_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" DROP COLUMN "tagline";--> statement-breakpoint
ALTER TABLE "companies" DROP COLUMN "industry";--> statement-breakpoint
ALTER TABLE "companies" DROP COLUMN "website";--> statement-breakpoint
ALTER TABLE "companies" DROP COLUMN "zip_code";--> statement-breakpoint
ALTER TABLE "companies" DROP COLUMN "timezone";--> statement-breakpoint
ALTER TABLE "companies" DROP COLUMN "business_hours";--> statement-breakpoint
ALTER TABLE "companies" DROP COLUMN "social_media";--> statement-breakpoint
ALTER TABLE "companies" DROP COLUMN "accepts_online_booking";--> statement-breakpoint
ALTER TABLE "companies" DROP COLUMN "requires_confirmation";--> statement-breakpoint
ALTER TABLE "companies" DROP COLUMN "cancellation_policy";--> statement-breakpoint
ALTER TABLE "companies" DROP COLUMN "payment_methods";--> statement-breakpoint
ALTER TABLE "companies" DROP COLUMN "languages";--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_slug_unique" UNIQUE("slug");