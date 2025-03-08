import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState } from "react";

interface BulkDeleteActionProps {
  selectedVideos: number[];
  handleBulkDelete: () => Promise<void>;
}

export function BulkDeleteAction({ selectedVideos, handleBulkDelete }: BulkDeleteActionProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await handleBulkDelete();
    } finally {
      setIsDeleting(false);
      setShowConfirmDialog(false);
    }
  };

  return (
    <>
      <div className="bg-background border rounded-lg p-2 shadow-sm fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex items-center gap-2">
        <span className="text-sm px-2">
          {selectedVideos.length} {selectedVideos.length === 1 ? "video seleccionado" : "videos seleccionados"}
        </span>
        <Button 
          variant="destructive" 
          size="sm"
          onClick={() => setShowConfirmDialog(true)}
          className="gap-1.5"
          data-delete-selected
        >
          <Trash2 className="h-3.5 w-3.5" />
          Eliminar
        </Button>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar {selectedVideos.length} {selectedVideos.length === 1 ? "video" : "videos"}? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}