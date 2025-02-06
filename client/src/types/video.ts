
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

// Alternativa como enum
export enum VideoStatusEnum {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  TITLE_CORRECTIONS = "title_corrections",
  OPTIMIZE_REVIEW = "optimize_review",
  UPLOAD_REVIEW = "upload_review",
  YOUTUBE_READY = "youtube_ready",
  REVIEW = "review",
  MEDIA_CORRECTIONS = "media_corrections",
  COMPLETED = "completed"
}
