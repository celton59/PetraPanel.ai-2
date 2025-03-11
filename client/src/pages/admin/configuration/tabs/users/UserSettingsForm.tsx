import { useState } from "react";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { PersonalInfoSection } from "./info/PersonalInfoSection";
import { SecuritySection } from "./security/SecuritySection";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ApiUser, useUsers } from "@/hooks/useUsers";
import { User } from "@db/schema";

// Definimos la estructura de datos del formulario para evitar errores de tipado
export interface UserFormData {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  bio: string;
  role?: string;
  password: string;
}

interface UserSettingsFormProps {
  user: ApiUser | undefined;
  onClose: () => void;
}

export function UserSettingsForm({ user, onClose }: UserSettingsFormProps) {
  // const { createUser, updateUser } = useUserStore();
  const { createUser, updateUser } = useUsers()
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formDataToSubmit, setFormDataToSubmit] = useState<Partial<User> | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<number[]>(
    Array.isArray(user?.projectAccess)
      ? user.projectAccess.map((p) => p.projectId)
      : []
  );

  const form = useForm<Partial<User>>({
    defaultValues: {
      fullName: user?.fullName ? user.fullName : undefined,
      username: user?.username,
      email: user?.email ?? '',
      phone: user?.phone ? user.phone : undefined,
      bio: user?.bio ? user.bio : undefined,
      role: user?.role ?? undefined,
      password: "",
      
    },
  });

  const handleSubmit = async (data: Partial<User>) => {
    setFormDataToSubmit(data);
    setShowConfirmDialog(true);
  };

  const confirmAndSubmit = async () => {
    if (!formDataToSubmit) return;

    if (!selectedProjects.length) {
      setError("Debe seleccionar al menos un proyecto");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const userData: Partial<User> & { projectIds: number[] } = {
        fullName: formDataToSubmit.fullName,
        username: formDataToSubmit.username,
        email: formDataToSubmit.email,
        phone: formDataToSubmit.phone,
        bio: formDataToSubmit.bio,
        role: formDataToSubmit.role,
        projectIds: selectedProjects,
        ...(formDataToSubmit.password && { password: formDataToSubmit.password }),
      };


      if (user) {
        await updateUser({ user: userData, userId: user.id});
      } else {
        if (!formDataToSubmit.password) {
          setError("La contraseña es requerida para nuevos usuarios");
          return;
        }

        // TODO fix this
        await createUser(userData as unknown as User);
      }

      setIsSubmitting(false);
      setShowConfirmDialog(false);
      onClose()

    } catch (error: any) {
      console.error("Error en el formulario:", error);
      setError(error.message || (user ? "Error al actualizar usuario" : "Error al crear usuario"));
      setIsSubmitting(false);
      setShowConfirmDialog(false);
    }
  };

  return (
    <div className="p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" noValidate>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-6">
              <PersonalInfoSection
                form={form}
                formData={{
                  role: user?.role,
                  password: "",
                  fullName: form.watch("fullName"),
                  username: form.watch("username"),
                  email: form.watch("email"),
                  phone: form.watch("phone") || "",
                  bio: form.watch("bio") || "",
                }}
                setFormData={(data) => {
                  Object.entries(data).forEach(([key, value]) => {
                    form.setValue(key as keyof Partial<User>, value as string);
                  });
                  form.trigger();
                }}
                isCheckingUsername={false}
                isCheckingEmail={false}
              />
            </div>

            <div className="space-y-6">
              <SecuritySection
                form={form}
                formData={{
                  role: user?.role,
                  password: "",
                  fullName: form.watch("fullName"),
                  username: form.watch("username"),
                  email: form.watch("email"),
                  phone: form.watch("phone") || "",
                  bio: form.watch("bio") || "",
                }}
                setFormData={(data) => {
                  Object.entries(data).forEach(([key, value]) => {
                    form.setValue(key as keyof Partial<User>, value as string);
                  });
                  form.trigger();
                }}
                isEditing={!!user}
                selectedProjects={selectedProjects}
                setSelectedProjects={setSelectedProjects}
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {user ? "Actualizando..." : "Creando..."}
                </>
              ) : (
                user ? "Actualizar" : "Crear"
              )}
            </Button>
          </div>
        </form>
      </Form>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar {user ? 'actualización' : 'creación'}?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas {user ? 'actualizar' : 'crear'} este usuario?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              disabled={isSubmitting} 
              onClick={confirmAndSubmit}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirmando...
                </>
              ) : (
                'Confirmar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}