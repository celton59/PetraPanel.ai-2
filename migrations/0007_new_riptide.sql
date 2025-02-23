ALTER TABLE "videos" ADD COLUMN "content_uploaded_by" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "videos" ADD CONSTRAINT "videos_content_uploaded_by_users_id_fk" FOREIGN KEY ("content_uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
