import { pgTable, text, serial, integer, timestamp, boolean, numeric, jsonb, vector } from "drizzle-orm/pg-core";
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
  maxAssignedVideos: integer("max_assigned_videos").default(10), // Número máximo de videos que puede tener asignados simultáneamente, por defecto 10
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
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
  
  publishedAt: timestamp("published_at"),
  
  // Campos para la papelera
  isDeleted: boolean("is_deleted").default(false),
  deletedAt: timestamp("deleted_at"),
  deletedBy: integer("deleted_by").references(() => users.id)
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

export type YoutubeChannel = typeof youtube_channels.$inferSelect;

// Tabla para configurar las tarifas por acción según el rol
export const actionRates = pgTable("action_rates", {
  id: serial("id").primaryKey(),
  actionType: text("action_type", { 
    enum: [
      "content_optimization", 
      "content_review", 
      "upload_media", 
      "media_review", 
      "video_creation"
    ] 
  }).notNull(),
  roleId: text("role_id", { 
    enum: ["admin", "reviewer", "content_reviewer", "media_reviewer", "optimizer", "youtuber"]
  }).notNull(),
  rate: numeric("rate").notNull(),
  projectId: integer("project_id").references(() => projects.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const youtube_videos = pgTable("youtube_videos", {
  id: serial("id").primaryKey(),
  youtubeId: text("youtube_id").notNull().unique(),
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
  // Campo para almacenar los datos de análisis
  analysisData: jsonb("analysis_data"),
  sentToOptimize: boolean("sent_to_optimize").default(false),
  sentToOptimizeAt: timestamp("sent_to_optimize_at"),
  sentToOptimizeProjectId: integer("sent_to_optimize_project_id")
    .references(() => projects.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isEvergreen: boolean("is_evergreen"),
  evergreenConfidence: numeric("evergreen_confidence")
});

export type YoutubeVideo = typeof youtube_videos.$inferSelect
export type InsertYoutubeVideo = typeof youtube_videos.$inferInsert
// Tabla para registrar las acciones realizadas por los usuarios
export const userActions = pgTable("user_actions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  actionType: text("action_type", { 
    enum: [
      "content_optimization", 
      "content_review", 
      "upload_media", 
      "media_review", 
      "video_creation"
    ] 
  }).notNull(),
  videoId: integer("video_id")
    .references(() => videos.id, { onDelete: "cascade" }),
  projectId: integer("project_id")
    .references(() => projects.id),
  rateApplied: numeric("rate_applied"),
  isPaid: boolean("is_paid").default(false),
  paymentDate: timestamp("payment_date"),
  paymentReference: text("payment_reference"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabla para registrar los pagos a los usuarios
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: numeric("amount").notNull(),
  paymentDate: timestamp("payment_date").notNull(),
  reference: text("reference"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ActionRate = typeof actionRates.$inferSelect;
export type InsertActionRate = typeof actionRates.$inferInsert;

export type UserAction = typeof userActions.$inferSelect;
export type InsertUserAction = typeof userActions.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

export const insertActionRateSchema = createInsertSchema(actionRates);
export const selectActionRateSchema = createSelectSchema(actionRates);

export const insertUserActionSchema = createInsertSchema(userActions);
export const selectUserActionSchema = createSelectSchema(userActions);

export const insertPaymentSchema = createInsertSchema(payments);
export const selectPaymentSchema = createSelectSchema(payments);

// Tabla para notificaciones
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type", { 
    enum: ["info", "success", "warning", "error", "system"] 
  }).notNull().default("info"),
  isRead: boolean("is_read").default(false),
  isArchived: boolean("is_archived").default(false),
  actionUrl: text("action_url"),
  actionLabel: text("action_label"),
  relatedEntityType: text("related_entity_type"),
  relatedEntityId: integer("related_entity_id"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id)
});

// Tabla para configuración de notificaciones por usuario
export const notificationSettings = pgTable("notification_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  emailEnabled: boolean("email_enabled").default(true),
  pushEnabled: boolean("push_enabled").default(true),
  inAppEnabled: boolean("in_app_enabled").default(true),
  // Tipos específicos de notificaciones que el usuario puede configurar
  contentChangesEnabled: boolean("content_changes_enabled").default(true),
  assignmentsEnabled: boolean("assignments_enabled").default(true),
  mentionsEnabled: boolean("mentions_enabled").default(true),
  statusChangesEnabled: boolean("status_changes_enabled").default(true),
  systemMessagesEnabled: boolean("system_messages_enabled").default(true),
  updatedAt: timestamp("updated_at").defaultNow()
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

export type NotificationSetting = typeof notificationSettings.$inferSelect;
export type InsertNotificationSetting = typeof notificationSettings.$inferInsert;

export const insertNotificationSchema = createInsertSchema(notifications);
export const selectNotificationSchema = createSelectSchema(notifications);

export const insertNotificationSettingSchema = createInsertSchema(notificationSettings);
export const selectNotificationSettingSchema = createSelectSchema(notificationSettings);


// Tabla para title embeddings

export const titleEmbeddings = pgTable("title_embeddings", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").notNull(),
  title: text("title").notNull(),
  vector: vector("vector", { dimensions: 1536 }).notNull(),
  is_evergreen: boolean("is_evergreen").default(false),
  confidence: numeric("confidence"),
  createdAt: timestamp("created_at").defaultNow()
})

// Tabla training title examples 

export const trainingTitleExamples = pgTable("training_title_examples", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  youtubeId: text("youtube_id").notNull(), 
  is_evergreen: boolean("is_evergreen").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  vectorProcessed: boolean("vector_processed").default(false),
  confidence: numeric("confidence"),
  category: text("category").notNull(),
  embedding: vector("embedding", { dimensions: 1536 }).notNull(),
})

