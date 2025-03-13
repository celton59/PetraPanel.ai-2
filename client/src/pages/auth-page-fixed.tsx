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
  LockKeyhole, ShieldAlert, Eye, EyeOff, Unlock, X, Check,
  Info
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
import api, { refreshCSRFToken } from "../lib/axios";
import { Badge } from "@/components/ui/badge";

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
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinValues, setPinValues] = useState(['', '', '', '']);
  const [pinError, setPinError] = useState('');
  const [showDevAccess, setShowDevAccess] = useState(false);
  const [rememberAccess, setRememberAccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [csrfStatus, setCsrfStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [appVersion, setAppVersion] = useState("v2.6.0");
  const [appUpdateDate, setAppUpdateDate] = useState("12.03.2025");
  const pinRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  
  // PIN correcto para acceder a las cuentas de prueba
  const CORRECT_PIN = ['5', '9', '5', '9']; // PIN sencillo: 5959
  
  // Verificar si hay PIN guardado en localStorage al cargar el componente
  useEffect(() => {
    const hasAccessToken = localStorage.getItem('devAccessToken');
    if (hasAccessToken === 'true') {
      setShowDevAccess(true);
    }
    
    // Cargar token CSRF al iniciar
    const loadCSRFToken = async () => {
      setCsrfStatus('loading');
      try {
        await refreshCSRFToken(true);
        setCsrfStatus('success');
      } catch (error) {
        console.error("Error al cargar token CSRF:", error);
        setCsrfStatus('error');
      }
    };
    
    loadCSRFToken();
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
    
    // Asegurarse de tener un token CSRF fresco
    try {
      await refreshCSRFToken();
    } catch (csrfError) {
      console.error("Error al refrescar CSRF para login rápido:", csrfError);
      toast.error("Error de seguridad", {
        description: "No se pudo obtener un token de seguridad. Intente recargar la página.",
        position: "top-right",
        duration: 5000
      });
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
    // Asegurarse de tener un token CSRF fresco
    try {
      await refreshCSRFToken();
    } catch (csrfError) {
      console.error("Error al refrescar CSRF para login:", csrfError);
      toast.error("Error de seguridad", {
        description: "No se pudo obtener un token de seguridad. Intente recargar la página.",
        position: "top-right",
        duration: 5000
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await login({ username: data.username, password: data.password, rememberMe: data.rememberMe });
      
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
          
          {/* CSRF Status Indicator */}
          <div className="flex items-center justify-center">
            {csrfStatus === 'loading' ? (
              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Cargando...</span>
              </Badge>
            ) : csrfStatus === 'success' ? (
              <Badge variant="outline" className="flex items-center gap-1 text-xs bg-green-50 text-green-800 border-green-200">
                <Check className="w-3 h-3" />
                <span>Seguridad lista</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="flex items-center gap-1 text-xs bg-red-50 text-red-800 border-red-200">
                <X className="w-3 h-3" />
                <span>Error de seguridad</span>
              </Badge>
            )}
          </div>
        </div>

        {/* Auth Form Card - PRIMERO */}
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
                        <CircleUserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
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
                      <FormLabel className="text-sm font-medium">
                        Contraseña
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Ingresa tu contraseña"
                            className="h-12 pl-10 pr-10 animate-pulse-border focus:ring-2 ring-primary/20 transition-all"
                            autoComplete="current-password"
                            {...field}
                          />
                        </FormControl>
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex items-center justify-between">
                  <FormField
                    control={form.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="rememberMe" 
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <label
                          htmlFor="rememberMe"
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          Recordarme
                        </label>
                      </div>
                    )}
                  />
                  
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              
                <Button disabled={isLoading} className="w-full h-12" type="submit">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Iniciando...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Iniciar sesión
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="px-8 md:px-10 pt-0 pb-8 flex flex-col">
            <div className="w-full">
              <p className="text-xs text-muted-foreground mb-3 mt-4 text-center">
                ACCESO RÁPIDO POR ROL
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {predefinedCredentials.map((cred, index) => (
                  <Button
                    key={cred.role}
                    variant="outline"
                    className="h-auto py-3 px-4 font-normal justify-start text-left text-xs relative"
                    disabled={isLoading}
                    onClick={() => handleQuickLogin(cred.username, cred.password)}
                    style={{ animationDelay: `${0.2 + index * 0.1}s` }}
                  >
                    <div className="flex flex-col items-center w-full">
                      {cred.icon}
                      <span className="mt-2 text-xs font-medium">{cred.displayName}</span>
                    </div>
                    
                    {index === 0 && !showDevAccess && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    )}
                  </Button>
                ))}
              </div>
            </div>
          </CardFooter>
        </Card>
        
        {/* App version and update date */}
        <div className="flex items-center justify-center text-xs text-muted-foreground mt-4">
          <Info className="w-3 h-3 mr-1" />
          <span>PetraPanel {appVersion} | Actualizado: {appUpdateDate}</span>
        </div>
      </div>
    </div>
  );
}