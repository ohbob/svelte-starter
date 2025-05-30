CREATE TABLE "analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"path" text NOT NULL,
	"user_agent" text,
	"ip_address" "inet",
	"referrer" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
