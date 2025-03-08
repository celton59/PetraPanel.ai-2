import { Button } from "@/components/ui/button";
import { Plus, FileVideo } from "lucide-react";
import { User } from "@/types/user";

interface EmptyStateProps {
  user: User;
}

export function EmptyState({ user }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 rounded-full bg-muted p-3">
        <FileVideo className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-medium">No hay videos disponibles</h3>
      <p className="mb-4 max-w-md text-sm text-muted-foreground">
        {user.role === "admin"
          ? "No se encontraron videos. Puedes crear uno nuevo haciendo clic en el botón de abajo."
          : user.role === "creator"
          ? "No hay videos asignados a ti. Contacta con un administrador para recibir asignaciones."
          : "No hay videos para optimizar en este momento. Los videos aparecerán aquí cuando estén listos para revisión."}
      </p>
      {user.role === "admin" && (
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Crear nuevo video
        </Button>
      )}
    </div>
  );
}