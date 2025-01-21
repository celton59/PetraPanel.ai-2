export type UserRole = "admin" | "reviewer" | "optimizer" | "youtuber" | "uploader";

export interface Project {
  id: number;
  name: string;
}

export interface ProjectAccess {
  projectId: number;
  userId: number;
  project?: Project;
}

export interface Profile {
  id: number;
  email: string;
  fullName: string;
  username: string;
  phone?: string;
  bio?: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
  avatarUrl?: string;
  projectAccess?: ProjectAccess[];
}

export interface CreateUserDTO {
  fullName: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  bio?: string;
  projectIds?: number[];
}

export interface UpdateUserDTO {
  fullName?: string;
  username?: string;
  email?: string;
  role?: UserRole;
  phone?: string;
  bio?: string;
  projectIds?: number[];
}