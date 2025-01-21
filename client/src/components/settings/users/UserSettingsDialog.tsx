import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PersonalInfoSection } from "./info/PersonalInfoSection";
import { SecuritySection } from "./security/SecuritySection";
import { UserFormActions } from "./UserFormActions";
import { useState } from "react";
import { Profile, UserRole, ProjectAccess } from "@/types/user";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUserStore } from "@/stores/userStore";
import { toast } from "sonner";
import * as z from "zod";

const userFormSchema = z.object({
  full_name: z.string()
    .min(1, "El nombre es requerido")
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder los 100 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ\s']+$/, "El nombre solo puede contener letras y espacios"),
  username: z.string()
    .min(3, "El nombre de usuario debe tener al menos 3 caracteres")
    .max(30, "El nombre de usuario no puede exceder los 30 caracteres")
    .regex(/^[a-z0-9_]+$/, "El nombre de usuario solo puede contener letras minúsculas, números y guiones bajos"),
  email: z.string()
    .email("El formato del email no es válido")
    .min(5, "El email debe tener al menos 5 caracteres")
    .max(100, "El email no puede exceder los 100 caracteres"),
  phone: z.string()
    .regex(/^\+?[0-9\s-()]+$/, "El formato del teléfono no es válido")
    .min(7, "El teléfono debe tener al menos 7 dígitos")
    .max(20, "El teléfono no puede exceder los 20 caracteres")
    .optional()
    .or(z.literal("")),
  bio: z.string()
    .max(500, "La biografía no puede exceder los 500 caracteres")
    .optional()
    .or(z.literal("")),
  role: z.enum(["admin", "reviewer", "optimizer", "youtuber", "uploader"] as const),
  password: z.string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(100, "La contraseña no puede exceder los 100 caracteres")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "La contraseña debe contener al menos una letra minúscula, una mayúscula y un número")
    .optional()
    .or(z.literal(""))
});

type UserFormData = z.infer<typeof userFormSchema>;

interface UserSettingsDialogProps {
  user: Profile | null;
  open: boolean;
  onClose: () => void;
}

export const UserSettingsDialog = ({ user, open, onClose }: UserSettingsDialogProps) => {
  const { createUser, updateUser } = useUserStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<number[]>(
    user?.projectAccess?.map((p: ProjectAccess) => p.projectId) || []
  );

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      full_name: user?.fullName || "",
      username: user?.username || "",
      email: user?.email || "",
      phone: user?.phone || "",
      bio: user?.bio || "",
      role: (user?.role as UserRole) || "uploader",
      password: "",
    },
    mode: "onChange",
  });

  // Verificar disponibilidad de username
  const checkUsername = async (username: string) => {
    if (username === user?.username) return true;
    setIsCheckingUsername(true);
    try {
      const response = await fetch(`/api/check-username?username=${username}`);
      const data = await response.json();
      if (!data.available) {
        form.setError("username", {
          type: "manual",
          message: "Este nombre de usuario ya está en uso"
        });
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error checking username:", error);
      return false;
    } finally {
      setIsCheckingUsername(false);
    }
  };

  // Verificar disponibilidad de email
  const checkEmail = async (email: string) => {
    if (email === user?.email) return true;
    setIsCheckingEmail(true);
    try {
      const response = await fetch(`/api/check-email?email=${email}`);
      const data = await response.json();
      if (!data.available) {
        form.setError("email", {
          type: "manual",
          message: "Este email ya está registrado"
        });
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error checking email:", error);
      return false;
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const onSubmit = async (data: UserFormData) => {
    try {
      setIsSubmitting(true);

      // Verificar username y email
      const [usernameAvailable, emailAvailable] = await Promise.all([
        checkUsername(data.username),
        checkEmail(data.email)
      ]);

      if (!usernameAvailable || !emailAvailable) {
        return;
      }

      if (user) {
        const updateData = {
          fullName: data.full_name,
          username: data.username,
          email: data.email,
          phone: data.phone || "",
          bio: data.bio || "",
          role: data.role,
          projectIds: selectedProjects,
          ...(data.password && { password: data.password })
        };

        const success = await updateUser(user.id, updateData);
        if (success) {
          toast.success("Usuario actualizado correctamente");
          onClose();
        }
      } else {
        if (!data.password) {
          toast.error("La contraseña es requerida para nuevos usuarios");
          return;
        }

        await createUser({
          fullName: data.full_name,
          username: data.username,
          email: data.email,
          password: data.password,
          phone: data.phone || "",
          bio: data.bio || "",
          role: data.role,
          projectIds: selectedProjects,
        });

        toast.success("Usuario creado correctamente");
        onClose();
      }
    } catch (error) {
      console.error("Error en el formulario:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(user ? "Error al actualizar usuario" : "Error al crear usuario");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-6">
                <PersonalInfoSection
                  form={form}
                  formData={{
                    full_name: form.getValues("full_name"),
                    username: form.getValues("username"),
                    email: form.getValues("email"),
                    phone: form.getValues("phone"),
                    bio: form.getValues("bio"),
                  }}
                  setFormData={(data) => {
                    Object.entries(data).forEach(([key, value]) => {
                      form.setValue(key as keyof UserFormData, value as any, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    });
                  }}
                  isCheckingUsername={isCheckingUsername}
                  isCheckingEmail={isCheckingEmail}
                />
              </div>

              <div className="space-y-6">
                <SecuritySection
                  form={form}
                  formData={{
                    role: form.getValues("role"),
                    password: form.getValues("password"),
                  }}
                  setFormData={(data) => {
                    Object.entries(data).forEach(([key, value]) => {
                      form.setValue(key as keyof UserFormData, value as any, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    });
                  }}
                  isEditing={!!user}
                  currentUser={user}
                  selectedProjects={selectedProjects}
                  setSelectedProjects={setSelectedProjects}
                />
              </div>
            </div>

            <UserFormActions
              isLoading={isSubmitting}
              onClose={onClose}
              isEditing={!!user}
              isValid={form.formState.isValid}
              isDirty={form.formState.isDirty}
            />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};