CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"tagline" text,
	"description" text,
	"industry" text,
	"email" text NOT NULL,
	"phone" text,
	"website" text,
	"address" text,
	"city" text,
	"state" text,
	"zip_code" text,
	"country" text,
	"timezone" text DEFAULT 'America/New_York',
	"business_hours" text,
	"social_media" text,
	"accepts_online_booking" boolean DEFAULT true,
	"requires_confirmation" boolean DEFAULT false,
	"cancellation_policy" text,
	"payment_methods" text,
	"languages" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "calendar_integrations" ADD COLUMN "selected_calendar_id" text;--> statement-breakpoint
ALTER TABLE "calendar_integrations" ADD COLUMN "selected_calendar_name" text;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;