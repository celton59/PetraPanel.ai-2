import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/use-user";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  CircleUserRound, KeyRound, LogIn, Loader2, LayoutDashboard, 
  Video, Camera, PenTool, ClipboardCheck, Upload, FileText,
  LockKeyhole, ShieldAlert, Eye, EyeOff, Unlock, X, Check
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useState, useRef, useEffect } from "react";
import { z } from "zod";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";

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
  const [showPinDialog, setShowPinDialog] = useState(false); // No mostrar el diálogo de PIN al cargar
  const [pinValues, setPinValues] = useState(['', '', '', '']);
  const [pinError, setPinError] = useState('');
  const [showDevAccess, setShowDevAccess] = useState(false);
  const [rememberAccess, setRememberAccess] = useState(false);
  const pinRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  
  // PIN correcto para acceder a las cuentas de prueba
  const CORRECT_PIN = ['5', '9', '5', '9']; // PIN sencillo: 5959
  
  // Verificar si hay PIN guardado en localStorage al cargar el componente
  useEffect(() => {
    const hasAccessToken = localStorage.getItem('devAccessToken');
    if (hasAccessToken === 'true') {
      setShowDevAccess(true);
    }
  }, []);
  
  // Enfocar el primer campo del PIN cuando se carga la página
  useEffect(() => {
    if (showPinDialog) {
      setTimeout(() => pinRefs[0].current?.focus(), 100);
    }
  }, [showPinDialog]);

  // Configurar el formulario con validación de Zod
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false
    },
  });

  // Definimos credenciales predeterminadas para diferentes roles
  const predefinedCredentials = [
    { username: "hola", password: "1234", role: "admin", displayName: "Admin", icon: <LayoutDashboard className="h-5 w-5" /> },
    { username: "mediareviewer", password: "1234", role: "media_reviewer", displayName: "Media Reviewer", icon: <Camera className="h-5 w-5" /> },
    { username: "youtuber", password: "1234", role: "youtuber", displayName: "Youtuber", icon: <Video className="h-5 w-5" /> },
    { username: "optimizer", password: "1234", role: "optimizer", displayName: "Optimizer", icon: <PenTool className="h-5 w-5" /> },
    { username: "reviewer", password: "1234", role: "reviewer", displayName: "Reviewer", icon: <ClipboardCheck className="h-5 w-5" /> },
    { username: "contentreviewer", password: "1234", role: "content_reviewer", displayName: "Content Reviewer", icon: <FileText className="h-5 w-5" /> },
    { username: "uploader", password: "1234", role: "uploader", displayName: "Uploader", icon: <Upload className="h-5 w-5" /> },
  ];
  
  // Función para manejar los cambios en los campos del PIN
  const handlePinChange = (index: number, value: string) => {
    // Verificar que el input sea un solo dígito numérico
    if (!/^\d*$/.test(value)) return;
    
    // Actualizar el valor del PIN en el estado
    const newPinValues = [...pinValues];
    newPinValues[index] = value.substring(0, 1); // Solo tomamos el primer dígito
    setPinValues(newPinValues);
    
    // Si se completó un dígito, mover al siguiente campo
    if (value && index < 3) {
      pinRefs[index + 1].current?.focus();
    }
    
    // Si se completan todos los dígitos, verificar el PIN
    if (newPinValues.every(digit => digit !== '') && index === 3) {
      // Verificar PIN después de un pequeño retraso para mejorar UX
      setTimeout(() => verifyPin(newPinValues), 300);
    }
  };
  
  // Función para manejar las teclas especiales (retroceso, flechas)
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Si se presiona retroceso y el campo está vacío, mover al campo anterior
    if (e.key === 'Backspace' && !pinValues[index] && index > 0) {
      pinRefs[index - 1].current?.focus();
    }
    // Si se presiona la flecha izquierda, mover al campo anterior
    else if (e.key === 'ArrowLeft' && index > 0) {
      pinRefs[index - 1].current?.focus();
    }
    // Si se presiona la flecha derecha, mover al campo siguiente
    else if (e.key === 'ArrowRight' && index < 3) {
      pinRefs[index + 1].current?.focus();
    }
  };
  
  // Verificar si el PIN ingresado es correcto
  const verifyPin = (currentPin: string[]) => {
    if (JSON.stringify(currentPin) === JSON.stringify(CORRECT_PIN)) {
      setPinError('');
      setShowDevAccess(true);
      
      // Si se ha seleccionado recordar el acceso, guardamos en localStorage
      if (rememberAccess) {
        localStorage.setItem('devAccessToken', 'true');
      }
      
      setShowPinDialog(false);
      
      // Mostrar mensaje de éxito
      toast.success("PIN correcto", {
        description: "Acceso a cuentas de prueba desbloqueado.",
        position: "top-right",
        duration: 3000
      });
    } else {
      setPinError('PIN incorrecto. Inténtalo de nuevo.');
      setPinValues(['', '', '', '']);
      pinRefs[0].current?.focus();
      
      // Hacer vibrar el diálogo para indicar error
      const dialog = document.querySelector('[role="dialog"]');
      if (dialog) {
        dialog.classList.add('animate-shake');
        setTimeout(() => dialog.classList.remove('animate-shake'), 500);
      }
    }
  };
  
  // Reiniciar los campos del PIN
  const resetPin = () => {
    setPinValues(['', '', '', '']);
    setPinError('');
  };
  
  // Mostrar el diálogo de PIN para acceder a las cuentas de desarrollador
  const showDevPinDialog = () => {
    setShowPinDialog(true);
    resetPin();
    // Enfocar el primer campo después de que el diálogo esté visible
    setTimeout(() => pinRefs[0].current?.focus(), 100);
  };
  
  // Helper de inicio de sesión rápido con credenciales predefinidas
  const handleQuickLogin = async (username: string, password: string) => {
    // Si no está desbloqueado el acceso a cuentas de prueba, mostrar el diálogo de PIN
    if (!showDevAccess) {
      showDevPinDialog();
      return;
    }
    
    setIsLoading(true);
    try {
      console.log(`Iniciando sesión con el usuario ${username}`);
      await login({ username, password });
      
      // Simular un pequeño retraso para una mejor experiencia
      setTimeout(() => {
        setLocation("/");
        setIsLoading(false);
      }, 500);
    } catch (error: any) {
      setIsLoading(false);
      console.error(`Error en inicio de sesión con ${username}:`, error);
      
      toast.error("Error de inicio de sesión", {
        description: error.message || "Credenciales incorrectas. Por favor, inténtalo manualmente.",
        position: "top-right",
        duration: 5000
      });
    }
  };

  // Función de envío del formulario con manejo de estados
  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      await login({ username: data.username, password: data.password });
      
      // Simular un pequeño retraso para una mejor experiencia
      setTimeout(() => {
        setLocation("/");
        setIsLoading(false);
      }, 500);
    } catch (error: any) {
      setIsLoading(false);
      toast.error("Error de inicio de sesión", {
        description: error.message || "Credenciales incorrectas. Por favor, inténtalo de nuevo.",
        position: "top-right",
        duration: 3000
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 md:p-10 bg-background overflow-hidden">
      {/* Diálogo para el PIN de acceso a cuentas de desarrollo */}
      <Dialog 
        open={showPinDialog} 
        onOpenChange={(open) => {
          // El usuario siempre puede cerrar el diálogo
          setShowPinDialog(open);
        }}
        modal={false} // El diálogo no bloquea la página
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl">
              <LockKeyhole className="w-5 h-5 mr-2 text-primary" />
              Verificación de PIN
            </DialogTitle>
            <DialogDescription>
              Ingresa el PIN para acceder a las cuentas de prueba
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {/* Mensaje de error */}
            {pinError && (
              <div className="flex items-center text-sm font-medium text-destructive mb-4 p-2 bg-destructive/10 rounded-md border border-destructive/20">
                <ShieldAlert className="w-4 h-4 mr-2" />
                {pinError}
              </div>
            )}
            
            {/* Campos para el PIN */}
            <div className="flex justify-center gap-3 my-6">
              {[0, 1, 2, 3].map((index) => (
                <Input
                  key={index}
                  type="text"
                  maxLength={1}
                  value={pinValues[index]}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-14 h-14 text-2xl text-center shadow-sm"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  ref={pinRefs[index]}
                />
              ))}
            </div>
            
            <div className="text-center text-xs text-muted-foreground mt-2">
              <div className="flex items-center justify-center">
                <ShieldAlert className="w-3 h-3 mr-1" />
                Este PIN protege el acceso a cuentas de prueba
              </div>
            </div>
            
            {/* Checkbox para recordar el acceso */}
            <div className="flex items-center justify-center mt-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="rememberPin"
                  checked={rememberAccess}
                  onCheckedChange={checked => setRememberAccess(checked === true)}
                />
                <label 
                  htmlFor="rememberPin"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Recordar mi acceso
                </label>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2">
            <Button 
              variant="outline" 
              className="w-full sm:w-auto" 
              onClick={() => setShowPinDialog(false)}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              variant="default" 
              className="w-full sm:w-auto" 
              onClick={() => verifyPin(pinValues)}
              disabled={pinValues.some(value => value === '')}
            >
              <Unlock className="w-4 h-4 mr-2" />
              Verificar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Indicador de acceso desbloqueado */}
      {showDevAccess && (
        <div className="fixed top-4 right-4 z-50 flex items-center space-x-2 text-xs text-primary animate-fade-in-down p-2 rounded-md bg-primary/5 border border-primary/20">
          <Unlock className="w-3 h-3" />
          <span>Acceso de prueba desbloqueado</span>
        </div>
      )}

      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none"></div>
      
      {/* Simple header accent line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/80 via-purple-500/80 to-pink-500/80"></div>
      
      <div className="w-full max-w-lg space-y-8 relative z-10 animate-fade-in">
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
                        <span className="text-xs text-muted-foreground">
                          ¿Olvidaste tu contraseña?
                        </span>
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
              <span>¿No tienes cuenta? Contacta al administrador</span>
            </div>
          </CardFooter>
        </Card>

        {/* Botones de inicio rápido para pruebas con información de credenciales */}
        <div className="flex flex-col gap-4 mt-8 mb-8">
          <div className="text-center">
            <h3 className="text-base font-medium text-foreground mb-1">Acceso rápido por rol</h3>
            <p className="text-xs text-muted-foreground">Selecciona un perfil para iniciar sesión automáticamente</p>
          </div>
          
          <div className="bg-muted/40 p-4 rounded-xl border border-border/30 shadow-sm">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 justify-items-center">
              {predefinedCredentials.map((cred) => (
                <Button 
                  key={cred.username}
                  variant="outline" 
                  onClick={(e) => { e.preventDefault(); handleQuickLogin(cred.username, cred.password); }}
                  disabled={isLoading}
                  className="flex flex-col items-center justify-center h-20 relative group bg-card hover:bg-accent/10 transition-all w-full"
                  size="sm"
                >
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/10 mb-2 text-primary mx-auto">
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>{cred.icon}</>
                    )}
                  </div>
                  <span className="text-xs font-medium">{cred.displayName}</span>
                  {showDevAccess && (
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 p-3 bg-popover text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border">
                      <div className="font-medium mb-1 pb-1 border-b text-center text-sm">{cred.displayName}</div>
                      <p className="mt-1"><strong>Usuario:</strong> {cred.username}</p>
                      <p><strong>Contraseña:</strong> {cred.password}</p>
                    </div>
                  )}
                </Button>
              ))}
            </div>
            <div className="mt-3 text-center text-xs text-muted-foreground">
              {showDevAccess ? (
                <span>Pasa el cursor sobre un rol para ver las credenciales</span>
              ) : (
                <>
                  <span>Necesitas verificar el PIN para usar el acceso rápido</span>
                  <button 
                    onClick={showDevPinDialog}
                    className="block mx-auto mt-2 text-primary hover:underline hover:text-primary/80 transition-colors"
                  >
                    Ingresar PIN para desbloquear
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

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