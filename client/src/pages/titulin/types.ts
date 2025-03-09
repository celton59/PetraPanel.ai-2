export interface TitulinVideo {
  id: number;
  videoId: string;
  channelId: string;
  title: string;
  description: string | null;
  publishedAt: string | null;
  thumbnailUrl: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  duration: string | null;
  tags: string[] | null;
  analyzed: boolean;
  sentToOptimize: boolean;
  sentToOptimizeAt: string | null;
  sentToOptimizeProjectId: number | null;
  analysisData: {
    isEvergreen: boolean;
    confidence: number;
    reason: string;
  } | null;
}

export interface Channel {
  id: number;
  channelId: string;
  name: string;
  lastVideoFetch: string | null;
}

export interface VideoResponse {
  videos: TitulinVideo[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
}