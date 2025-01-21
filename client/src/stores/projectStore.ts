import { create } from 'zustand';
import { Project, CreateProjectDTO, UpdateProjectDTO } from '@/types/project';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface ProjectState {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  createProject: (project: CreateProjectDTO) => Promise<void>;
  updateProject: (id: number, project: UpdateProjectDTO) => Promise<void>;
  deleteProject: (id: number) => Promise<void>;
  fetchProjects: () => Promise<void>;
}

const validateProject = (project: any): project is Project => {
  return (
    project &&
    typeof project.id === 'number' &&
    typeof project.name === 'string' &&
    (project.prefix === undefined || typeof project.prefix === 'string') &&
    (project.current_number === undefined || typeof project.current_number === 'number') &&
    (project.description === null || typeof project.description === 'string')
  );
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    console.log("ProjectStore: Fetching projects");
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/projects');
      console.log("ProjectStore: API response status", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error fetching projects');
      }

      const result: ApiResponse<Project[]> = await response.json();
      console.log("ProjectStore: Projects received", result);

      if (!Array.isArray(result.data)) {
        throw new Error('Invalid response format: expected an array of projects');
      }

      // Validate each project in the response
      const validProjects = result.data.filter(validateProject);
      if (validProjects.length !== result.data.length) {
        console.warn('Some projects were invalid and were filtered out');
      }

      set({ projects: validProjects, isLoading: false });
    } catch (error) {
      console.error("ProjectStore: Error fetching projects", error);
      set({ error: error instanceof Error ? error.message : 'Unknown error', isLoading: false });
    }
  },

  createProject: async (projectData: CreateProjectDTO) => {
    console.log("ProjectStore: Creating project", projectData);
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error creating project');
      }

      const result: ApiResponse<Project> = await response.json();
      console.log("ProjectStore: Project created", result);

      if (!validateProject(result.data)) {
        throw new Error('Invalid project data received from server');
      }

      set(state => ({
        projects: [...state.projects, result.data],
        isLoading: false
      }));
    } catch (error) {
      console.error("ProjectStore: Error creating project", error);
      set({ error: error instanceof Error ? error.message : 'Unknown error', isLoading: false });
      throw error;
    }
  },

  updateProject: async (id: number, projectData: UpdateProjectDTO) => {
    console.log("ProjectStore: Updating project", { id, projectData });
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error updating project');
      }

      const result: ApiResponse<Project> = await response.json();
      console.log("ProjectStore: Project updated", result);

      if (!validateProject(result.data)) {
        throw new Error('Invalid project data received from server');
      }

      set(state => ({
        projects: state.projects.map(p => p.id === id ? result.data : p),
        isLoading: false
      }));
    } catch (error) {
      console.error("ProjectStore: Error updating project", error);
      set({ error: error instanceof Error ? error.message : 'Unknown error', isLoading: false });
      throw error;
    }
  },

  deleteProject: async (id: number) => {
    console.log("ProjectStore: Deleting project", id);
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error deleting project');
      }

      console.log("ProjectStore: Project deleted", id);
      set(state => ({
        projects: state.projects.filter(p => p.id !== id),
        isLoading: false
      }));
    } catch (error) {
      console.error("ProjectStore: Error deleting project", error);
      set({ error: error instanceof Error ? error.message : 'Unknown error', isLoading: false });
      throw error;
    }
  },
}));