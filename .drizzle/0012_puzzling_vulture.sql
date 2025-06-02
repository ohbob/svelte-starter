ALTER TABLE "analytics" RENAME COLUMN "user_id" TO "company_id";--> statement-breakpoint
ALTER TABLE "daily_analytics" RENAME COLUMN "user_id" TO "company_id";--> statement-breakpoint
ALTER TABLE "referrer_analytics" RENAME COLUMN "user_id" TO "company_id";--> statement-breakpoint
ALTER TABLE "daily_analytics" DROP CONSTRAINT "daily_analytics_user_id_date_unique";--> statement-breakpoint
ALTER TABLE "referrer_analytics" DROP CONSTRAINT "referrer_analytics_user_id_date_domain_path_unique";--> statement-breakpoint
ALTER TABLE "analytics" DROP CONSTRAINT "analytics_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "daily_analytics" DROP CONSTRAINT "daily_analytics_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "referrer_analytics" DROP CONSTRAINT "referrer_analytics_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "analytics" ADD CONSTRAINT "analytics_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_analytics" ADD CONSTRAINT "daily_analytics_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrer_analytics" ADD CONSTRAINT "referrer_analytics_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_analytics" ADD CONSTRAINT "daily_analytics_company_id_date_unique" UNIQUE("company_id","date");--> statement-breakpoint
ALTER TABLE "referrer_analytics" ADD CONSTRAINT "referrer_analytics_company_id_date_domain_path_unique" UNIQUE("company_id","date","domain","path");