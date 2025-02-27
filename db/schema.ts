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

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  prefix: text("prefix"),
  current_number: integer("current_number").default(0),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow()
});

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

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

export type Video = typeof videos.$inferSelect
export type VideoStatus = Video['status']
export type InsertVideo = typeof videos.$inferInsert;

export type ProjectAccess = typeof projectAccess.$inferSelect;
export type InsertProjectAccess = typeof projectAccess.$inferInsert;

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertProjectSchema = createInsertSchema(projects).extend({
  name: z.string().min(1, "El nombre es requerido"),
  prefix: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  current_number: z.number().optional(),
});

export const selectProjectSchema = createSelectSchema(projects);
export const insertVideoSchema = createInsertSchema(videos);
export const selectVideoSchema = createSelectSchema(videos);

export const insertProjectAccessSchema = createInsertSchema(projectAccess);
export const selectProjectAccessSchema = createSelectSchema(projectAccess);