import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/use-user";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleUserRound, KeyRound, LogIn, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useState } from "react";
import { z } from "zod";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

// Definir esquema de validación de Zod
const loginSchema = z.object({
  username: z.string().min(1, "El nombre de usuario es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
  rememberMe: z.boolean().optional().default(false)
});

// Definir tipo de datos del formulario
type LoginFormValues = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const { login } = useUser();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  // Configurar el formulario con validación de Zod
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false
    },
  });

  // Función de envío del formulario con manejo de estados
  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      await login({ username: data.username, password: data.password });
      
      // Simular un pequeño retraso para una mejor experiencia
      setTimeout(() => {
        setLocation("/");
        toast.success("¡Bienvenido!", { 
          description: "Has iniciado sesión correctamente",
          position: "top-center" 
        });
        setIsLoading(false);
      }, 500);
    } catch (error: any) {
      setIsLoading(false);
      toast.error("Error de inicio de sesión", {
        description: error.message || "Credenciales incorrectas. Por favor, inténtalo de nuevo."
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 md:p-10 bg-background overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none"></div>
      
      {/* Simple header accent line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/80 via-purple-500/80 to-pink-500/80"></div>
      
      <div className="w-full max-w-lg space-y-8 relative z-10 animate-fade-in">
        {/* Header Section */}
        <div className="flex flex-col items-center space-y-6 text-center">
          {/* Logo/Brand */}
          <div className="relative mb-2">
            <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10 shadow-sm">
              <div className="relative bg-gradient-to-br from-primary to-purple-500 p-3 rounded-md shadow-inner">
                <CircleUserRound className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>
          
          {/* Welcome Text */}
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              <span className="text-primary">Petra</span>Panel
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-sm mx-auto">
              Inicia sesión para gestionar tu contenido multimedia
            </p>
          </div>
        </div>

        {/* Auth Form Card */}
        <Card className="border border-border/30 bg-card shadow-md hover:shadow-lg transition-shadow duration-300 animate-fade-in rounded-xl" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="pb-0 pt-8 px-8 md:px-10">
            {/* Eliminamos el texto de "Acceso seguro" */}
          </CardHeader>
          <CardContent className="pt-6 px-8 md:px-10">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-medium">
                        Nombre de usuario
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            placeholder="Ingresa tu nombre de usuario"
                            className="h-12 pl-10 animate-pulse-border focus:ring-2 ring-primary/20 transition-all"
                            autoComplete="username"
                            {...field}
                          />
                        </FormControl>
                        <CircleUserRound className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-sm font-medium">
                          Contraseña
                        </FormLabel>
                        <a 
                          href="#" 
                          className="text-xs text-primary hover:underline"
                        >
                          ¿Olvidaste tu contraseña?
                        </a>
                      </div>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Ingresa tu contraseña"
                            className="h-12 pl-10 animate-pulse-border focus:ring-2 ring-primary/20 transition-all"
                            autoComplete="current-password"
                            {...field}
                          />
                        </FormControl>
                        <KeyRound className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end">
                  <FormField
                    control={form.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            id="rememberMe"
                          />
                        </FormControl>
                        <label 
                          htmlFor="rememberMe"
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          Recordar mi sesión
                        </label>
                      </FormItem>
                    )}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full h-12 text-base mt-2 font-medium shadow-md hover:shadow-lg transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Iniciando sesión...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-5 w-5" />
                      Iniciar sesión
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          
          <CardFooter className="px-8 md:px-10 flex flex-col space-y-4 pb-8">
            <Separator className="my-2" />
            <div className="text-center text-sm text-muted-foreground">
              <span>¿No tienes cuenta? </span>
              <a href="#" className="text-primary font-medium hover:underline">
                Contacta al administrador
              </a>
            </div>
          </CardFooter>
        </Card>

        {/* Footer Text */}
        <p className="px-4 md:px-8 text-center text-xs md:text-sm text-muted-foreground">
          Al continuar, aceptas nuestros{" "}
          <a
            href="#"
            className="underline underline-offset-4 hover:text-primary transition-colors"
          >
            Términos de servicio
          </a>{" "}
          y{" "}
          <a
            href="#"
            className="underline underline-offset-4 hover:text-primary transition-colors"
          >
            Política de privacidad
          </a>
        </p>
      </div>
    </div>
  );
}