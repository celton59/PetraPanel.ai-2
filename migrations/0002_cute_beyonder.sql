ALTER TABLE "videos" RENAME COLUMN "optimized_by_id" TO "optimized_by";--> statement-breakpoint
ALTER TABLE "videos" RENAME COLUMN "current_reviewer_id" TO "reviewed_by";--> statement-breakpoint
ALTER TABLE "videos" DROP CONSTRAINT "videos_optimized_by_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "created_by" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "videos" ADD CONSTRAINT "videos_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "videos" ADD CONSTRAINT "videos_optimized_by_users_id_fk" FOREIGN KEY ("optimized_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "videos" ADD CONSTRAINT "videos_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
