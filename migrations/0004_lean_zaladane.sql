ALTER TABLE "videos" ADD COLUMN "content_last_reviewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "content_review_comments" text[];--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "media_last_reviewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "media_review_comments" text[];--> statement-breakpoint
ALTER TABLE "videos" DROP COLUMN IF EXISTS "last_reviewed_at";--> statement-breakpoint
ALTER TABLE "videos" DROP COLUMN IF EXISTS "last_review_comments";--> statement-breakpoint
ALTER TABLE "videos" DROP COLUMN IF EXISTS "title_corrected";--> statement-breakpoint
ALTER TABLE "videos" DROP COLUMN IF EXISTS "media_corrected";