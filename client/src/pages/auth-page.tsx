import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/use-user";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleUserRound, KeyRound, LogIn, Loader2, LayoutDashboard, Video, Camera } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { z } from "zod";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import axios from "axios";

// Definir esquema de validación de Zod
const loginSchema = z.object({
  username: z.string().min(1, "El nombre de usuario es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
  rememberMe: z.boolean().optional().default(false)
});

// Definir tipo de datos del formulario
type LoginFormValues = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const { login, user } = useUser();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Efecto para manejar los errores de URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    
    if (errorParam) {
      switch(errorParam) {
        case 'invalid_credentials':
          setError('Nombre de usuario o contraseña incorrectos.');
          break;
        case 'server_error':
          setError('Error del servidor. Inténtalo de nuevo más tarde.');
          break;
        case 'session_error':
          setError('Error al crear la sesión. Inténtalo de nuevo.');
          break;
        case 'missing_form_data':
          setError('Faltan datos del formulario. Por favor, completa todos los campos.');
          break;
        default:
          setError('Ha ocurrido un error. Por favor, inténtalo de nuevo.');
      }
    }
  }, []);
  
  // Redirigir al usuario si ya está autenticado
  useEffect(() => {
    if (user) {
      setLocation('/');
    }
  }, [user, setLocation]);

  // Configurar el formulario con validación de Zod
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false
    },
  });

  // Función para manejar la validación del formulario
  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Usar axios para enviar la solicitud de inicio de sesión
      const response = await axios.post('/api/login', data, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        // Mostrar mensaje de éxito
        toast.success('Inicio de sesión exitoso');
        
        // Actualizar el estado del usuario
        window.location.href = '/';
      }
    } catch (error: any) {
      console.error('Error de inicio de sesión:', error);
      
      // Manejar el error
      if (error.response) {
        setError(error.response.data.message || 'Credenciales incorrectas');
      } else {
        setError('Error al conectar con el servidor');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 md:p-10 bg-background">
      {/* Simple header accent line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/80 via-purple-500/80 to-pink-500/80"></div>
      
      <div className="w-full max-w-lg space-y-8 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col items-center space-y-6 text-center">
          {/* Logo/Brand */}
          <div className="relative mb-2">
            <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10 shadow-sm group">
              <div className="relative bg-gradient-to-br from-primary to-purple-500 p-3 rounded-md shadow-inner">
                <Video className="w-12 h-12 text-white" />
                {/* Círculo rojo que solo aparece al pasar el cursor */}
                <div className="absolute top-0 right-0 w-3 h-3 rounded-full bg-red-500 border border-white shadow-glow opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {/* Animación de ping para el círculo */}
                  <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></div>
                </div>
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
        <Card className="border border-border/30 bg-card shadow-md rounded-xl">
          <CardHeader className="pb-0 pt-8 px-8 md:px-10">
            {/* Eliminamos el texto de "Acceso seguro" */}
          </CardHeader>
          <CardContent className="pt-6 px-8 md:px-10">
            {/* Formulario react con validación completa */}
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
                            {...field}
                            placeholder="Ingresa tu nombre de usuario"
                            className="h-12 pl-10"
                            autoComplete="username"
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
                        <span className="text-xs text-muted-foreground">
                          ¿Olvidaste tu contraseña?
                        </span>
                      </div>
                      <div className="relative">
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="Ingresa tu contraseña"
                            className="h-12 pl-10"
                            autoComplete="current-password"
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
                    <FormItem className="flex flex-row items-center justify-end space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          id="rememberMe"
                        />
                      </FormControl>
                      <FormLabel
                        htmlFor="rememberMe"
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        Recordar mi sesión
                      </FormLabel>
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full h-12 text-base mt-2 font-medium"
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
                
                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded text-red-600 text-sm">
                    <p>{error}</p>
                  </div>
                )}
              </form>
            </Form>
          </CardContent>
          
          <CardFooter className="px-8 md:px-10 flex flex-col space-y-4 pb-8">
            <Separator className="my-2" />
            <div className="text-center text-sm text-muted-foreground">
              <span>¿No tienes cuenta? Contacta al administrador</span>
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