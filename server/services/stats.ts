import { db } from "@db";
import { users, videos } from "@db/schema";
import { eq, count, sql } from "drizzle-orm";

export class StatsService {
  static async getUserStats(userId: number) {
    const stats = await db
      .select({
        optimizations: count(videos.optimizedTitle),
        uploads: count(videos.videoUrl),
      })
      .from(videos)
      .where(eq(videos.createdBy, userId));

    return stats;
  }


  static async getOverallStats() {
    const stats = await db
      .select({
        total_videos: sql<number>`count(distinct ${videos.id})`,
        total_optimizations: count(videos.optimizedTitle),
        total_uploads: count(videos.videoUrl),
      })
      .from(videos);

    return stats[0];
  }
}