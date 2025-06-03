CREATE TABLE "meeting_type_availability_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_type_id" uuid NOT NULL,
	"availability_template_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "meeting_types" DROP CONSTRAINT "meeting_types_availability_template_id_availability_templates_id_fk";
--> statement-breakpoint
ALTER TABLE "meeting_type_availability_templates" ADD CONSTRAINT "meeting_type_availability_templates_meeting_type_id_meeting_types_id_fk" FOREIGN KEY ("meeting_type_id") REFERENCES "public"."meeting_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_type_availability_templates" ADD CONSTRAINT "meeting_type_availability_templates_availability_template_id_availability_templates_id_fk" FOREIGN KEY ("availability_template_id") REFERENCES "public"."availability_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_types" DROP COLUMN "availability_template_id";