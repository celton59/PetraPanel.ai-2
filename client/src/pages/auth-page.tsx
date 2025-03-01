import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/use-user";
import { useForm } from "react-hook-form";
import { LogIn, Lock, User, EyeIcon, EyeOffIcon } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useState } from "react";
import { motion } from "framer-motion";

export default function AuthPage() {
  const { login } = useUser();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      username: "hola",
      password: "1234",
    },
  });

  const onSubmit = async (data: { username: string; password: string }) => {
    setIsLoading(true);
    try {
      await login(data);
      setLocation("/");
      toast.success("¡Bienvenido!", { description: "Has iniciado sesión correctamente" });
    } catch (error: any) {
      toast.error("Error", {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 md:p-10 bg-gradient-to-br from-primary/10 via-background to-primary/5">
      <motion.div 
        className="w-full max-w-lg space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header Section */}
        <div className="flex flex-col items-center space-y-6 text-center">
          <div className="relative w-32 h-32">
            {/* Advanced logo design with high-end animation */}
            <motion.div 
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <svg
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
              >
                {/* Shimmering background */}
                <defs>
                  <radialGradient id="radialGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                    <stop offset="0%" stopColor="rgba(139, 92, 246, 0.9)" />
                    <stop offset="100%" stopColor="rgba(79, 70, 229, 0.7)" />
                  </radialGradient>
                  
                  <linearGradient id="gradientFill" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4338ca" />
                    <stop offset="50%" stopColor="#6d28d9" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                  
                  <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                  
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                
                {/* Outer Spinning Ring */}
                <motion.g
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <circle cx="50" cy="50" r="48" stroke="url(#accentGradient)" strokeWidth="1" fill="none" strokeDasharray="1,3" />
                  <circle cx="50" cy="50" r="46" stroke="url(#accentGradient)" strokeWidth="0.5" fill="none" strokeDasharray="1,6" />
                </motion.g>
                
                {/* Main Circle with gradient */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="url(#gradientFill)"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                />
                
                {/* Inner circle with subtle pulse */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="0.5"
                  fill="none"
                  animate={{ scale: [1, 1.02, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                
                {/* Center glow */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r="35"
                  fill="url(#radialGradient)"
                  filter="url(#glow)"
                  animate={{ opacity: [0.7, 0.9, 0.7] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
                
                {/* Media elements */}
                <g>
                  {/* Film reel elements */}
                  <motion.g
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                  >
                    <circle cx="30" cy="30" r="3" fill="white" opacity="0.8" />
                    <circle cx="70" cy="30" r="3" fill="white" opacity="0.8" />
                    <circle cx="30" cy="70" r="3" fill="white" opacity="0.8" />
                    <circle cx="70" cy="70" r="3" fill="white" opacity="0.8" />
                  </motion.g>
                  
                  {/* Triangular play button with glow and pulse */}
                  <motion.path
                    d="M60,50 L40,35 L40,65 Z"
                    fill="white"
                    filter="url(#glow)"
                    initial={{ scale: 0 }}
                    animate={{ 
                      scale: 1,
                      filter: ["brightness(1)", "brightness(1.2)", "brightness(1)"]
                    }}
                    transition={{ 
                      scale: { duration: 0.5, delay: 0.8, type: "spring" },
                      filter: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    }}
                  />
                  
                  {/* Audio/video waves with sequential drawing effect */}
                  <motion.path
                    d="M65,35 C75,40 75,60 65,65"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: [0.5, 0.9, 0.5] }}
                    transition={{ 
                      pathLength: { delay: 1, duration: 1, ease: "easeOut" },
                      opacity: { delay: 1, duration: 3, repeat: Infinity, ease: "easeInOut" }
                    }}
                  />
                  
                  <motion.path
                    d="M70,30 C83,40 83,60 70,70"
                    stroke="white"
                    strokeWidth="1"
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: [0.3, 0.7, 0.3] }}
                    transition={{ 
                      pathLength: { delay: 1.2, duration: 1, ease: "easeOut" },
                      opacity: { delay: 1.2, duration: 4, repeat: Infinity, ease: "easeInOut" }
                    }}
                  />
                </g>
              </svg>
            </motion.div>
            
            {/* Dynamic light effect */}
            <motion.div 
              className="absolute inset-0 bg-white/10 blur-3xl rounded-full"
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: [0, 0.3, 0],
                scale: [0.6, 1.1, 0.6],
                rotate: [0, 180, 360]
              }}
              transition={{ 
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.5, 1]
              }}
            />
          </div>
          <div className="space-y-3">
            <motion.h1 
              className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              ¡Bienvenido a PetraPanel!
            </motion.h1>
            <motion.p 
              className="text-base md:text-lg text-muted-foreground/80 max-w-sm mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Tu plataforma avanzada para gestionar y optimizar tus videos de YouTube
            </motion.p>
          </div>
        </div>

        {/* Auth Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="border-border/40 backdrop-blur-sm bg-card/90 shadow-xl">
            <CardContent className="pt-8 px-8 md:px-10">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <User size={18} className="text-muted-foreground" />
                        Nombre de usuario
                      </label>
                      <div className="relative">
                        <Input
                          placeholder="Ingresa tu nombre de usuario"
                          {...form.register("username", { required: true })}
                          className="h-12 pl-4"
                        />
                      </div>
                      {form.formState.errors.username && (
                        <p className="text-destructive text-xs mt-1">
                          Este campo es obligatorio
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Lock size={18} className="text-muted-foreground" />
                        Contraseña
                      </label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Ingresa tu contraseña"
                          {...form.register("password", { required: true })}
                          className="h-12 pr-10"
                        />
                        <button 
                          type="button"
                          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                        </button>
                      </div>
                      {form.formState.errors.password && (
                        <p className="text-destructive text-xs mt-1">
                          Este campo es obligatorio
                        </p>
                      )}
                      <div className="flex justify-end">
                        <a
                          href="#"
                          className="text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                          ¿Olvidaste tu contraseña?
                        </a>
                      </div>
                    </div>
                  </div>
                  
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                  >
                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full h-12 text-base gap-2"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                          Iniciando sesión...
                        </>
                      ) : (
                        <>
                          <LogIn size={18} />
                          Iniciar sesión
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="px-8 md:px-10 py-4 flex justify-center border-t border-border/20">
              <p className="text-sm text-muted-foreground">
                ¿No tienes una cuenta? {" "}
                <a href="#" className="text-primary hover:underline">
                  Contacta al administrador
                </a>
              </p>
            </CardFooter>
          </Card>
        </motion.div>

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
      </motion.div>
    </div>
  );
}