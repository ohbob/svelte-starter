CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"address" text,
	"city" text,
	"state" text,
	"country" text,
	"postal_code" text,
	"phone" text,
	"contact_person" text,
	"instructions" text,
	"platform" text,
	"auto_generate_link" boolean DEFAULT false,
	"custom_meeting_url" text,
	"meeting_instructions" text,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "host_notes" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "cancellation_token" text;--> statement-breakpoint
ALTER TABLE "meeting_types" ADD COLUMN "location_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_types" ADD CONSTRAINT "meeting_types_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_cancellation_token_unique" UNIQUE("cancellation_token");