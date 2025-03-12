import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { User } from "@db/schema";

const profileSchema = z.object({
  fullName: z.string().min(1, "El nombre es requerido"),
  username: z.string().min(3, "El nombre de usuario debe tener al menos 3 caracteres"),
  bio: z.string().optional(),
  phone: z.string()
    .transform(val => val === "" ? undefined : val)
    .refine(
      val => !val || val.replace(/\D/g, '').length >= 9, 
      "El teléfono debe tener al menos 9 dígitos"
    )
    .optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface PersonalInfoSectionProps {
  user: User | null;
  refetch: () => Promise<any>;
}

export function PersonalInfoSection({ user, refetch }: PersonalInfoSectionProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      username: user?.username || '',
      bio: user?.bio || '',
      phone: user?.phone || ''
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (user) {
      form.reset({
        fullName: user.fullName || '',
        username: user.username || '',
        bio: user.bio || '',
        phone: user.phone || ''
      });
    }
  }, [user, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    setIsUpdating(true);
    try {
      // Importamos api y refreshCSRFToken de nuestro archivo axios mejorado
      const { refreshCSRFToken } = await import('@/lib/axios');
      const api = (await import('@/lib/axios')).default;
      
      // Refrescar proactivamente el token CSRF antes de una operación importante
      await refreshCSRFToken();
      
      // Usar nuestra instancia de axios configurada con manejo CSRF
      const response = await api.post('/api/profile', data);
      
      await refetch();

      toast("Perfil actualizado", {
        description: "Tu información ha sido actualizada correctamente",
      });

      // Marcar el formulario como "pristine" después de una actualización exitosa
      form.reset(data);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Error", {
        description: error.message || "No se pudo actualizar el perfil. Por favor, intenta de nuevo.",
      });
    } finally {
      // Asegurarse de que el estado de carga siempre se restablezca
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-1">
            Información Personal
          </h3>
          <p className="text-sm text-muted-foreground">
            Actualiza tu información personal y de contacto
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Tu nombre completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de usuario</FormLabel>
                    <FormControl>
                      <Input placeholder="@usuario" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Correo electrónico</Label>
                <Input
                  type="email"
                  value={user?.email || ''}
                  disabled
                />
              </div>

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="+34 600 000 000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Biografía</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Cuéntanos un poco sobre ti..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isUpdating || !form.formState.isValid || !form.formState.isDirty}
              >
                {isUpdating && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Guardar cambios
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}