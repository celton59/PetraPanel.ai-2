import { User } from "@/types/user";
import { ImageIcon } from "lucide-react";

interface EmptyStateProps {
  user: User;
}

export function EmptyState({ user }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-card rounded-lg border border-dashed">
      <div className="rounded-full bg-primary/10 p-3 mb-4">
        <ImageIcon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-lg font-medium">No hay videos disponibles</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
        {user?.role === "optimizer"
          ? "Los videos aparecerán aquí cuando haya contenido para optimizar"
          : "Comienza agregando tu primer video usando el botón superior"}
      </p>
    </div>
  );
}