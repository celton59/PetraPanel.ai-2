import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api, { refreshCSRFToken } from "../lib/axios";

interface BackupMetadata {
  timestamp: string;
  projectId: number;
  version: string;
  contentHash: string;
  size: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export function useBackups(projectId: number) {
  const queryClient = useQueryClient();

  const { data: backups = [], isLoading } = useQuery<BackupMetadata[]>({
    queryKey: [`/api/projects/${projectId}/backups`],
    queryFn: async () => {
      try {
        // Usamos la instancia de axios configurada con protección CSRF
        const response = await api.get(`/api/projects/${projectId}/backups`);
        return response.data.data;
      } catch (error: any) {
        console.error("Error fetching backups:", error);
        throw new Error(error.response?.data?.message || "Error fetching backups");
      }
    },
    enabled: Boolean(projectId)
  });

  const createBackupMutation = useMutation({
    mutationFn: async () => {
      try {
        // Refrescar proactivamente el token CSRF antes de una operación importante
        await refreshCSRFToken();
        
        // Usar nuestra instancia de axios configurada con protección CSRF
        const response = await api.post(`/api/projects/${projectId}/backup`);
        return response.data.data;
      } catch (error: any) {
        console.error("Error creating backup:", error);
        
        // Manejo mejorado de errores de CSRF
        if (error.response?.status === 403 && 
            (error.response?.data?.message?.includes('CSRF') || 
             error.response?.data?.message?.includes('token') || 
             error.response?.data?.message?.includes('Token'))) {
          throw new Error("Error de validación de seguridad. Se intentará refrescar automáticamente.");
        }
        
        throw new Error(error.response?.data?.message || "Error creating backup");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/backups`] });
      toast.success("Backup created successfully");
    },
    onError: (error: Error) => {
      if (error.message.includes('seguridad') || error.message.includes('token') || error.message.includes('CSRF')) {
        toast.error("Error de seguridad", {
          description: "Hubo un problema con la validación de seguridad. Inténtalo de nuevo.",
        });
      } else {
        toast.error(error.message || "Error creating backup");
      }
    }
  });

  const restoreBackupMutation = useMutation({
    mutationFn: async (timestamp: string) => {
      try {
        // Refrescar proactivamente el token CSRF antes de una operación importante
        await refreshCSRFToken();
        
        // Usar nuestra instancia de axios configurada con protección CSRF
        await api.post(`/api/projects/${projectId}/restore`, { timestamp });
        return timestamp;
      } catch (error: any) {
        console.error("Error restoring backup:", error);
        
        // Manejo mejorado de errores de CSRF
        if (error.response?.status === 403 && 
            (error.response?.data?.message?.includes('CSRF') || 
             error.response?.data?.message?.includes('token') || 
             error.response?.data?.message?.includes('Token'))) {
          throw new Error("Error de validación de seguridad. Se intentará refrescar automáticamente.");
        }
        
        throw new Error(error.response?.data?.message || "Error restoring backup");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/videos`] });
      toast.success("Project restored successfully");
    },
    onError: (error: Error) => {
      if (error.message.includes('seguridad') || error.message.includes('token') || error.message.includes('CSRF')) {
        toast.error("Error de seguridad", {
          description: "Hubo un problema con la validación de seguridad. Inténtalo de nuevo.",
        });
      } else {
        toast.error(error.message || "Error restoring backup");
      }
    }
  });

  return {
    backups,
    isLoading,
    createBackup: createBackupMutation.mutateAsync,
    restoreBackup: restoreBackupMutation.mutateAsync,
    isCreating: createBackupMutation.isPending,
    isRestoring: restoreBackupMutation.isPending
  };
}
