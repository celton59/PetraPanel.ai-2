ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "videos" ALTER COLUMN "status" SET DEFAULT 'available';