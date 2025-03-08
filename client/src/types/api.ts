export interface ApiVideo {
  id: number;
  title: string;
  optimizedTitle?: string;
  description?: string;
  status: string;
  projectId: number;
  projectName?: string;
  creatorId?: number;
  optimizerId?: number;
  assignedToId?: number;
  assignedToName?: string;
  createdAt: string;
  updatedAt: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  seriesNumber?: number;
  creatorName?: string;
  optimizerName?: string;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface UpdateVideoData {
  title?: string;
  optimizedTitle?: string;
  description?: string;
  status?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  assignedToId?: number | null;
  creatorId?: number | null;
  optimizerId?: number | null;
  projectId?: number;
  seriesNumber?: number | null;
}

export interface ApiProject {
  id: number;
  name: string;
  description?: string;
  prefix?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiUser {
  id: number;
  username: string;
  email?: string;
  fullName?: string;
  role: 'admin' | 'creator' | 'optimizer';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  profileImageUrl?: string;
}