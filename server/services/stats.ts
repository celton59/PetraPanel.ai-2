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
      .where(eq(videos.createdById, userId));

    return stats;
  }

  static async getOptimizationStats() {
    const stats = await db
      .select({
        userId: videos.currentReviewerId,
        username: users.username,
        fullName: users.fullName,
        optimizations: count(),
      })
      .from(videos)
      .innerJoin(users, eq(users.id, videos.currentReviewerId))
      .where(sql`${videos.optimizedTitle} is not null`)
      .groupBy(videos.currentReviewerId, users.username, users.fullName);

    return stats;
  }

  static async getUploadStats() {
    const stats = await db
      .select({
        userId: videos.createdById,
        username: users.username,
        fullName: users.fullName,
        uploads: count(),
      })
      .from(videos)
      .innerJoin(users, eq(users.id, videos.createdById))
      .where(sql`${videos.videoUrl} is not null`)
      .groupBy(videos.createdById, users.username, users.fullName);

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