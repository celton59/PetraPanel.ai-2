import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { AvatarUpload } from "./AvatarUpload";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Lock } from "lucide-react"; // Import the Lock icon
import { toast } from "sonner";

const profileSchema = z.object({
  fullName: z.string().min(1, "El nombre es requerido"),
  username: z.string().min(3, "El nombre de usuario debe tener al menos 3 caracteres"),
  bio: z.string().optional(),
  phone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, refetch } = useUser();
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
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar el perfil');
      }

      const responseData = await response.json();
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
      setIsUpdating(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-primary">Mi Perfil</h1>
        <p className="text-muted-foreground">
          Gestiona tu información personal y preferencias
        </p>
      </div>

      <Card className="overflow-hidden bg-card">
        <div className="relative p-6">
          <div className="absolute inset-0 h-32 bg-gradient-to-r from-primary/10 via-primary/5 to-background" />
          <div className="relative flex flex-col md:flex-row items-center gap-6">
            <AvatarUpload
              url={user?.avatarUrl}
              onUploadComplete={refetch}
              size="lg"
            />
            <div className="space-y-2 text-center md:text-left">
              <h2 className="text-2xl font-semibold text-primary">
                {user?.username || 'Usuario'}
              </h2>
              <p className="text-muted-foreground">
                {user?.email || 'usuario@example.com'}
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                <Badge variant="outline" className="capitalize">
                  {user?.role || 'Usuario'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="seguridad">Seguridad</TabsTrigger>
          <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
          <TabsTrigger value="actividad">Actividad</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-6">
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
        </TabsContent>
        <TabsContent value="seguridad" className="mt-6"> {/* Added TabsContent for "seguridad" */}
          <Card className="p-6 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Lock className="h-5 w-5 text-primary/70" />
                <h3 className="text-lg font-medium">Cambiar Contraseña</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Actualiza tu contraseña de acceso.
              </p>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const currentPassword = formData.get('currentPassword') as string;
              const newPassword = formData.get('newPassword') as string;

              try {
                const response = await fetch('/api/profile/password', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ currentPassword, newPassword }),
                });

                if (!response.ok) throw new Error('Error al cambiar la contraseña');

                toast("Contraseña actualizada", {
                  description: "Tu contraseña ha sido cambiada correctamente",
                });
              } catch (error) {
                toast.error("Error", {
                  description: "No se pudo actualizar la contraseña",
                });
              }
            }} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Contraseña actual</Label>
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva contraseña</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                  />
                </div>
              </div>
              <Button type="submit">Actualizar contraseña</Button>
            </form>
          </Card>
        </TabsContent>
        <TabsContent value="notificaciones" className="mt-6">{/* Placeholder for Notifications Tab */}
          <p>Notificaciones content here</p>
        </TabsContent>
        <TabsContent value="actividad" className="mt-6"> {/* Placeholder for Activity Tab */}
          <p>Actividad content here</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}