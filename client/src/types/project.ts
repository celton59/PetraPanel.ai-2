export interface Project {
  id: number;
  name: string;
  prefix?: string;
  current_number?: number;
  description: string | null;
  createdById?: number;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
}

export interface CreateProjectDTO {
  name: string;
  prefix: string;
  description?: string;
}

export interface UpdateProjectDTO extends CreateProjectDTO {
  id: number;
}