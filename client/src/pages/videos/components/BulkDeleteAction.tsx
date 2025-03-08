import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

interface BulkDeleteActionProps {
  selectedVideos: number[];
  handleBulkDelete: () => Promise<void>;
}

export function BulkDeleteAction({ selectedVideos, handleBulkDelete }: BulkDeleteActionProps) {
  if (selectedVideos.length === 0) return null;

  return (
    <div className="flex items-center gap-2 pl-2 rounded-md bg-muted py-2">
      <span className="text-sm font-medium">
        {selectedVideos.length} videos seleccionados
      </span>
      <div className="ml-auto flex items-center gap-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              className="gap-1"
              data-delete-selected
            >
              <Trash2 className="w-4 h-4" />
              Eliminar ({selectedVideos.length})
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Se eliminarán permanentemente los {selectedVideos.length} videos seleccionados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar {selectedVideos.length} videos
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}