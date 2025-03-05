import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  email: text("email"),
  bio: text("bio"),
  phone: text("phone"),
  role: text("role", { enum: ["admin", "reviewer", "content_reviewer", "media_reviewer", "optimizer", "youtuber"] }).notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  prefix: text("prefix"),
  current_number: integer("current_number").default(0),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow()
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

export const insertProjectSchema = createInsertSchema(projects).extend({
  name: z.string().min(1, "El nombre es requerido"),
  prefix: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  current_number: z.number().optional(),
});

export const selectProjectSchema = createSelectSchema(projects);

export const projectAccess = pgTable("project_access", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ProjectAccess = typeof projectAccess.$inferSelect;
export type InsertProjectAccess = typeof projectAccess.$inferInsert;

export const insertProjectAccessSchema = createInsertSchema(projectAccess);
export const selectProjectAccessSchema = createSelectSchema(projectAccess);

// This has to be equal to the 'status' attribute, this is only used for other code
export const VIDEO_STATUSES_ARRAY: readonly [string, ...string[]] = ['available', 'content_corrections', 'content_review', 'upload_media', 'media_corrections', 'media_review', 'final_review', 'completed'];

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ['available', 'content_corrections', 'content_review', 'upload_media', 'media_corrections', 'media_review', 'final_review', 'completed'] }).notNull().default('available'),
  youtubeUrl: text("youtube_url"),
  createdBy: integer("created_by").references(() => users.id),
  tags: text("tags"),
  seriesNumber: text("series_number"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  
  optimizedTitle: text("optimized_title"),
  optimizedDescription: text("optimized_description"),
  optimizedBy: integer("optimized_by").references(() => users.id),
  
  contentReviewedBy: integer("content_reviewed_by").references(() => users.id),
  contentLastReviewedAt: timestamp("content_last_reviewed_at"),
  contentReviewComments: text("content_review_comments").array(),

  contentUploadedBy: integer("content_uploaded_by").references(() => users.id),
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),

  mediaReviewedBy: integer("media_reviewed_by").references(() => users.id),
  mediaLastReviewedAt: timestamp("media_last_reviewed_at"),
  mediaReviewComments: text("media_review_comments").array(),
  mediaVideoNeedsCorrection: boolean("media_video_needs_correction"),
  mediaThumbnailNeedsCorrection: boolean("media_thumbnail_needs_correction"),
  
  publishedAt: timestamp("published_at")
});

export type Video = typeof videos.$inferSelect
export type VideoStatus = Video['status']
export type InsertVideo = typeof videos.$inferInsert;

export const insertVideoSchema = createInsertSchema(videos);
export const selectVideoSchema = createSelectSchema(videos);

export const youtube_channels = pgTable("youtube_channels", {
  id: serial("id").primaryKey(),
  channelId: text("channel_id").notNull().unique(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  description: text("description"),
  subscriberCount: integer("subscriber_count"),
  videoCount: integer("video_count"),
  lastVideoFetch: timestamp("last_video_fetch"),
  lastAnalysis: timestamp("last_analysis"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});


export const youtube_videos = pgTable("youtube_videos", {
  id: serial("id").primaryKey(),
  videoId: text("video_id").notNull().unique(),
  channelId: text("channel_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  publishedAt: timestamp("published_at"),
  thumbnailUrl: text("thumbnail_url"),
  viewCount: integer("view_count"),
  likeCount: integer("like_count"),
  commentCount: integer("comment_count"),
  duration: text("duration"),
  tags: text("tags").array(),
  analyzed: boolean("analyzed").default(false),
  // analysisData: jsonb("analysis_data"),
  sentToOptimize: boolean("sent_to_optimize").default(false),
  sentToOptimizeAt: timestamp("sent_to_optimize_at"),
  sentToOptimizeProjectId: integer("sent_to_optimize_project_id")
    .references(() => projects.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type YoutubeVideo = typeof youtube_videos.$inferSelect
export type InsertYoutubeVideo = typeof youtube_videos.$inferInsert