import { pgTable, text, serial, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export type VideoStatus =
  | "pending"
  | "in_progress"
  | "title_corrections"
  | "optimize_review"
  | "upload_review"
  | "youtube_ready"
  | "review"
  | "media_corrections"
  | "completed";

export type VideoMetadata = {
  roleView?: {
    optimizer?: {
      status: 'disponible' | 'en_proceso' | 'en_revision' | 'con_correcciones' | 'completado';
      assignedAt?: string;
      lastUpdated?: string;
    };
    reviewer?: {
      status: 'disponible' | 'en_proceso' | 'con_correcciones' | 'completado';
      assignedAt?: string;
      lastUpdated?: string;
      comments?: string;
    };
  };
  corrections?: {
    status: string;
    requestedAt: string;
    files: {
      video?: {
        needsCorrection: boolean;
        originalUrl: string | null;
      };
      thumbnail?: {
        needsCorrection: boolean;
        originalUrl: string | null;
      };
    };
    history: Array<{
      timestamp: string;
      comment: string;
      requestedBy: number;
      files: {
        videoRequested: boolean;
        thumbnailRequested: boolean;
      };
    }>;
  };
  customStatus?: 'en_revision';
  secondaryStatus?: {
    type: 'title_approved' | 'title_rejected' | 'media_approved' | 'media_rejected';
    updatedAt: string;
    comment?: string;
  };
  optimization?: {
    assignedTo?: {
      userId: number;
      username: string;
      assignedAt: string;
    };
    optimizedBy?: {
      userId: number;
      username: string;
      optimizedAt: string;
    };
    approvalHistory?: Array<{
      action: 'approved' | 'rejected';
      by: {
        userId: number;
        username: string;
      };
      timestamp: string;
      comment?: string;
    }>;
  };
  roleView?: {
    youtuber?: {
      status: string;
      hideAssignment?: boolean;
      uploads?: {
        video?: {
          uploadedAt: string;
          uploadedBy: {
            userId: number;
            username: string;
          };
          status: 'pending' | 'approved' | 'rejected';
        };
        thumbnail?: {
          uploadedAt: string;
          uploadedBy: {
            userId: number;
            username: string;
          };
          status: 'pending' | 'approved' | 'rejected';
        };
      };
    };
    reviewer?: {
      lastReview?: {
        timestamp: string;
        comment?: string;
        userId: number;
        username: string;
        status: 'approved' | 'rejected';
      };
      assignedAt?: string;
      currentReviewStage?: 'media' | 'content' | 'final';
    };
  };
};

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  email: text("email"),
  bio: text("bio"),
  phone: text("phone"),
  role: text("role", { enum: ["uploader", "admin", "reviewer", "optimizer"] }).notNull().default("uploader"),
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
  createdById: integer("created_by_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
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

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"),
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),
  youtubeUrl: text("youtube_url"),
  optimizedTitle: text("optimized_title"),
  optimizedDescription: text("optimized_description"),
  optimizedById: integer("optimized_by_id").references(() => users.id),
  tags: text("tags"),
  seriesNumber: text("series_number"),
  currentReviewerId: integer("current_reviewer_id"),
  lastReviewedAt: timestamp("last_reviewed_at"),
  lastReviewComments: text("last_review_comments"),
  createdById: integer("created_by_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  publishedAt: timestamp("published_at"),
  metadata: jsonb("metadata"),
  title_corrected: boolean("title_corrected").notNull().default(false),
  media_corrected: boolean("media_corrected").notNull().default(false),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;
export type Video = typeof videos.$inferSelect & { metadata?: VideoMetadata };
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