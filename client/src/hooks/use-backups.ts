import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
      const response = await fetch(`/api/projects/${projectId}/backups`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Error fetching backups");
      }
      
      const result: ApiResponse<BackupMetadata[]> = await response.json();
      return result.data;
    },
    enabled: Boolean(projectId)
  });

  const createBackupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/backup`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error creating backup");
      }

      const result: ApiResponse<BackupMetadata> = await response.json();
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/backups`] });
      toast.success("Backup created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error creating backup");
    }
  });

  const restoreBackupMutation = useMutation({
    mutationFn: async (timestamp: string) => {
      const response = await fetch(`/api/projects/${projectId}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timestamp }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error restoring backup");
      }

      return timestamp;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/videos`] });
      toast.success("Project restored successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error restoring backup");
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
