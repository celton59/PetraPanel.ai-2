
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";

interface UserFormActionsProps {
  isLoading: boolean;
  onClose: () => void;
  isEditing: boolean;
  isValid?: boolean;
  isDirty?: boolean;
  onDelete?: () => void;
}

export const UserFormActions = ({ 
  isLoading, 
  onClose, 
  isEditing, 
  isValid = true,
  isDirty = false,
  onDelete 
}: UserFormActionsProps) => {
  return (
    <div className="flex flex-col-reverse sm:flex-row gap-3 sm:items-center">
      {isEditing && onDelete && (
        <Button
          type="button"
          variant="destructive"
          onClick={onDelete}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Eliminar usuario
        </Button>
      )}
      <div className="flex flex-col-reverse sm:flex-row gap-3 w-full sm:w-auto sm:ml-auto">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !isValid || !isDirty}
          className="w-full sm:w-auto min-w-[120px]"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Guardando...</span>
            </div>
          ) : isEditing ? (
            'Guardar cambios'
          ) : (
            'Crear usuario'
          )}
        </Button>
      </div>
    </div>
  );
};
