import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Project } from "@db/schema";
import { toast } from "sonner";
import api, { refreshCSRFToken } from "../lib/axios";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export function useProjects() {
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading, error } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      try {
        // Usamos la instancia de axios para todas las peticiones
        const response = await api.get("/api/projects");
        const result: ApiResponse<Project[]> = response.data;
        return result.data;
      } catch (error: any) {
        console.error("Error fetching projects:", error);
        throw new Error(error.response?.data?.message || "Error fetching projects");
      }
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const createProjectMutation = useMutation({
    mutationFn: async (project: Pick<Project, "name" | "description" | "prefix">) => {
      try {
        // Refrescar proactivamente el token CSRF antes de una operación importante
        await refreshCSRFToken();
        
        // Usar nuestra instancia de axios configurada con protección CSRF
        const response = await api.post("/api/projects", project);
        return response.data.data;
      } catch (error: any) {
        console.error("Error creating project:", error);
        
        // Manejo mejorado de errores de CSRF
        if (error.response?.status === 403 && 
            (error.response?.data?.message?.includes('CSRF') || 
             error.response?.data?.message?.includes('token') || 
             error.response?.data?.message?.includes('Token'))) {
          throw new Error("Error de validación de seguridad. Se intentará refrescar automáticamente.");
        }
        
        throw new Error(error.response?.data?.message || "Error creating project");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast.success("Proyecto creado correctamente");
    },
    onError: (error: Error) => {
      if (error.message.includes('seguridad') || error.message.includes('token') || error.message.includes('CSRF')) {
        toast.error("Error de seguridad", {
          description: "Hubo un problema con la validación de seguridad. Inténtalo de nuevo.",
        });
      } else {
        toast.error(error.message || "Error al crear el proyecto");
      }
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async (data: { id: number; project: Partial<Project> }) => {
      try {
        // Refrescar proactivamente el token CSRF antes de una operación importante
        await refreshCSRFToken();
        
        // Usar nuestra instancia de axios configurada con protección CSRF
        const response = await api.put(`/api/projects/${data.id}`, data.project);
        return response.data.data;
      } catch (error: any) {
        console.error("Error updating project:", error);
        
        // Manejo mejorado de errores de CSRF
        if (error.response?.status === 403 && 
            (error.response?.data?.message?.includes('CSRF') || 
             error.response?.data?.message?.includes('token') || 
             error.response?.data?.message?.includes('Token'))) {
          throw new Error("Error de validación de seguridad. Se intentará refrescar automáticamente.");
        }
        
        throw new Error(error.response?.data?.message || "Error updating project");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast.success("Proyecto actualizado correctamente");
    },
    onError: (error: Error) => {
      if (error.message.includes('seguridad') || error.message.includes('token') || error.message.includes('CSRF')) {
        toast.error("Error de seguridad", {
          description: "Hubo un problema con la validación de seguridad. Inténtalo de nuevo.",
        });
      } else {
        toast.error(error.message || "Error al actualizar el proyecto");
      }
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: number) => {
      try {
        // Refrescar proactivamente el token CSRF antes de una operación importante
        await refreshCSRFToken();
        
        // Usar nuestra instancia de axios configurada con protección CSRF
        await api.delete(`/api/projects/${id}`);
        return id;
      } catch (error: any) {
        console.error("Error deleting project:", error);
        
        // Manejo mejorado de errores de CSRF
        if (error.response?.status === 403 && 
            (error.response?.data?.message?.includes('CSRF') || 
             error.response?.data?.message?.includes('token') || 
             error.response?.data?.message?.includes('Token'))) {
          throw new Error("Error de validación de seguridad. Se intentará refrescar automáticamente.");
        }
        
        throw new Error(error.response?.data?.message || "Error deleting project");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast.success("Proyecto eliminado correctamente");
    },
    onError: (error: Error) => {
      if (error.message.includes('seguridad') || error.message.includes('token') || error.message.includes('CSRF')) {
        toast.error("Error de seguridad", {
          description: "Hubo un problema con la validación de seguridad. Inténtalo de nuevo.",
        });
      } else {
        toast.error(error.message || "Error al eliminar el proyecto");
      }
    },
  });

  return {
    projects,
    isLoading,
    error,
    createProject: createProjectMutation.mutateAsync,
    updateProject: updateProjectMutation.mutateAsync,
    deleteProject: deleteProjectMutation.mutateAsync,
  };
}