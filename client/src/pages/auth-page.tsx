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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 md:p-10 bg-gradient-to-br from-primary/10 via-background to-primary/5 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-2/3 h-2/3 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] w-2/3 h-2/3 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-2xl animate-pulse opacity-70" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-primary/10 rounded-full blur-2xl animate-pulse opacity-70" style={{ animationDelay: '1s' }} />
      </div>
      
      <div className="w-full max-w-lg space-y-8 relative z-10 animate-fade-in">
        {/* Header Section */}
        <div className="flex flex-col items-center space-y-6 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-primary/10 to-primary/20 p-5 rounded-full backdrop-blur-sm ring-1 ring-primary/20 shadow-lg">
              <CircleUserRound className="w-14 h-14 text-primary animate-float" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent animate-shimmer">
              ¡Bienvenido de nuevo!
            </h1>
            <p className="text-base md:text-lg text-muted-foreground/80 max-w-sm mx-auto">
              Inicia sesión para acceder a tu cuenta y gestionar tus videos
            </p>
          </div>
        </div>

        {/* Auth Form Card */}
        <Card className="border-border/40 backdrop-blur-sm bg-card/90 shadow-xl animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="pb-0 pt-8 px-8 md:px-10">
            <div className="flex items-center space-x-2 mb-2">
              <div className="p-1.5 rounded-full bg-primary/10">
                <KeyRound className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm font-medium">Acceso seguro</span>
            </div>
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
                
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full h-12 text-base mt-2"
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