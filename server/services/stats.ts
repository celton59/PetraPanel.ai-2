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

  static async getOptimizationStats() {
    const stats = await db
      .select({
        userId: videos.optimizedBy,
        username: users.username,
        fullName: users.fullName,
        optimizations: count(),
      })
      .from(videos)
      .innerJoin(users, eq(users.id, videos.optimizedBy))
      .where(sql`${videos.optimizedTitle} is not null`)
      .groupBy(videos.optimizedBy, users.username, users.fullName);

    return stats;
  }

  static async getUploadStats() {
    const stats = await db
      .select({
        userId: videos.contentUploadedBy,
        username: users.username,
        fullName: users.fullName,
        uploads: count(),
      })
      .from(videos)
      .innerJoin(users, eq(users.id, videos.contentUploadedBy))
      .where(sql`${videos.videoUrl} is not null`)
      .groupBy(videos.contentUploadedBy, users.username, users.fullName);

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