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
import { ApiUser, useUsers, UserWithProjects } from "@/hooks/useUsers";
import { User } from "@db/schema";

// Definimos la estructura de datos del formulario para evitar errores de tipado
export interface UserFormData {
  fullName: string | null | undefined;
  username: string | undefined;
  email: string | null | undefined;
  phone: string | null | undefined;
  bio: string | null | undefined;
  role?: string | undefined;
  password: string | undefined;
  maxAssignedVideos?: number;
  maxMonthlyVideos?: number;
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
      role: user?.role ?? "youtuber",
      password: "",
      maxAssignedVideos: user?.maxAssignedVideos ?? 10,
      maxMonthlyVideos: user?.maxMonthlyVideos ?? 50,
    },
    resolver: async (values) => {
      const errors: Record<string, { type: string; message: string }> = {};
      
      // Validar campos requeridos
      if (!values.username || values.username.trim() === '') {
        errors.username = {
          type: 'required',
          message: 'El nombre de usuario es obligatorio',
        };
      } else if (values.username.length < 3) {
        errors.username = {
          type: 'minLength',
          message: 'El nombre de usuario debe tener al menos 3 caracteres',
        };
      }
      
      // Validar correo electrónico
      if (!values.email || values.email.trim() === '') {
        errors.email = {
          type: 'required',
          message: 'El correo electrónico es obligatorio',
        };
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
        errors.email = {
          type: 'pattern',
          message: 'Ingresa un correo electrónico válido',
        };
      }
      
      // Validar nombre completo
      if (!values.fullName || values.fullName.trim() === '') {
        errors.fullName = {
          type: 'required',
          message: 'El nombre completo es obligatorio',
        };
      } else if (values.fullName.length < 3) {
        errors.fullName = {
          type: 'minLength',
          message: 'El nombre completo debe tener al menos 3 caracteres',
        };
      }
      
      // Validar contraseña solo para nuevos usuarios
      if (!user && (!values.password || values.password.trim() === '')) {
        errors.password = {
          type: 'required',
          message: 'La contraseña es obligatoria para nuevos usuarios',
        };
      } else if (values.password && values.password.length < 6) {
        errors.password = {
          type: 'minLength',
          message: 'La contraseña debe tener al menos 6 caracteres',
        };
      }
      
      return {
        values,
        errors: Object.keys(errors).length > 0 ? errors : {},
      };
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
      // Verificar validez del formulario antes de continuar
      const formState = form.getValues();
      const formErrors = form.formState.errors;
      
      if (Object.keys(formErrors).length > 0) {
        const errorMessages = Object.entries(formErrors)
          .map(([field, error]) => `${field}: ${error.message}`)
          .join(", ");
        
        setError(`Por favor corrija los siguientes errores: ${errorMessages}`);
        setIsSubmitting(false);
        return;
      }

      // Validar los campos obligatorios específicamente
      const missingFields = [];
      if (!formDataToSubmit.username || formDataToSubmit.username.trim() === '') missingFields.push("nombre de usuario");
      if (!formDataToSubmit.fullName || formDataToSubmit.fullName.toString().trim() === '') missingFields.push("nombre completo");
      if (!formDataToSubmit.email || formDataToSubmit.email.toString().trim() === '') missingFields.push("correo electrónico");
      if (!user && (!formDataToSubmit.password || formDataToSubmit.password.trim() === '')) missingFields.push("contraseña");
      
      if (missingFields.length > 0) {
        setError(`Campos obligatorios vacíos: ${missingFields.join(", ")}`);
        setIsSubmitting(false);
        return;
      }

      // Asegúrate de que los campos requeridos no sean undefined
      const userData: Partial<User> & { projectIds: number[] } = {
        fullName: formDataToSubmit.fullName || "",
        username: formDataToSubmit.username || "",
        email: formDataToSubmit.email || "",
        phone: formDataToSubmit.phone || null,
        bio: formDataToSubmit.bio || null,
        role: formDataToSubmit.role || "youtuber",
        projectIds: selectedProjects,
      };
      
      // Solo incluir límites de videos si el rol es youtuber
      if (formDataToSubmit.role === "youtuber") {
        userData.maxAssignedVideos = formDataToSubmit.maxAssignedVideos || 10;
        userData.maxMonthlyVideos = formDataToSubmit.maxMonthlyVideos || 50;
      }

      // Solo incluir la contraseña si está presente y no está vacía
      if (formDataToSubmit.password && formDataToSubmit.password.trim() !== '') {
        userData.password = formDataToSubmit.password;
      }

      // Verificar formato de correo electrónico
      if (userData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email.toString())) {
        setError("El formato del correo electrónico no es válido");
        setIsSubmitting(false);
        return;
      }

      console.log("Datos a enviar:", userData);

      if (user) {
        await updateUser({ user: userData, userId: user.id});
      } else {
        // Verificación adicional para nuevos usuarios
        if (!userData.password) {
          setError("La contraseña es requerida para nuevos usuarios");
          setIsSubmitting(false);
          return;
        }

        if (userData.password.length < 6) {
          setError("La contraseña debe tener al menos 6 caracteres");
          setIsSubmitting(false);
          return;
        }

        await createUser(userData as unknown as User);
      }

      setIsSubmitting(false);
      setShowConfirmDialog(false);
      onClose();

    } catch (error: any) {
      console.error("Error en el formulario:", error);
      
      // Manejo mejorado de errores específicos
      let errorMessage = error.message || (user ? "Error al actualizar usuario" : "Error al crear usuario");
      
      // Detectar errores comunes y dar mensajes más amigables
      if (errorMessage.includes("CSRF") || errorMessage.includes("token")) {
        errorMessage = "Error de seguridad en el envío del formulario. Intente nuevamente.";
      } else if (errorMessage.includes("username") && errorMessage.includes("uso")) {
        errorMessage = "El nombre de usuario ya está en uso. Por favor elija otro.";
      } else if (errorMessage.includes("email") && (errorMessage.includes("uso") || errorMessage.includes("existe"))) {
        errorMessage = "El correo electrónico ya está registrado.";
      }
      
      setError(errorMessage);
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
                  phone: form.watch("phone"),
                  bio: form.watch("bio"),
                  maxAssignedVideos: form.watch("maxAssignedVideos") ? Number(form.watch("maxAssignedVideos")) : undefined,
                  maxMonthlyVideos: form.watch("maxMonthlyVideos") ? Number(form.watch("maxMonthlyVideos")) : undefined,
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