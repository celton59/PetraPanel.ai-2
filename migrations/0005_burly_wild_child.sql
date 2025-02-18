ALTER TABLE "videos" DROP CONSTRAINT "videos_reviewed_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "content_reviewed_by" integer;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "media_reviewed_by" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "videos" ADD CONSTRAINT "videos_content_reviewed_by_users_id_fk" FOREIGN KEY ("content_reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "videos" ADD CONSTRAINT "videos_media_reviewed_by_users_id_fk" FOREIGN KEY ("media_reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "videos" DROP COLUMN IF EXISTS "reviewed_by";