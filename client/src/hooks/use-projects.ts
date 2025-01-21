import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Project } from "@db/schema";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export function useProjects() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  const { data: projects = [], isLoading, error } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await fetch("/api/projects", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Error fetching projects");
      }
      const result: ApiResponse<Project[]> = await response.json();
      return result.data;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const createProjectMutation = useMutation({
    mutationFn: async (project: Pick<Project, "name" | "description" | "prefix">) => {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error creating project");
      }

      const result: ApiResponse<Project> = await response.json();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast.success("Proyecto creado correctamente");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al crear el proyecto");
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async (data: { id: number; project: Partial<Project> }) => {
      const response = await fetch(`/api/projects/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.project),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error updating project");
      }

      const result: ApiResponse<Project> = await response.json();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast.success("Proyecto actualizado correctamente");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al actualizar el proyecto");
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error deleting project");
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast.success("Proyecto eliminado correctamente");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al eliminar el proyecto");
    },
  });

  return {
    projects,
    isLoading,
    error,
    isAdmin: user?.role === 'admin',
    createProject: createProjectMutation.mutateAsync,
    updateProject: updateProjectMutation.mutateAsync,
    deleteProject: deleteProjectMutation.mutateAsync,
  };
}