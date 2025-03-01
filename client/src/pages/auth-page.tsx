import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/use-user";
import { useForm } from "react-hook-form";
import { CircleUserRound, LogIn, Lock, User, EyeIcon, EyeOffIcon } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AuthPage() {
  const { login } = useUser();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  
  // Control when form elements appear
  const [showForm, setShowForm] = useState(false);
  
  // Show form after logo appears
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowForm(true);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

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
      <div className="w-full max-w-lg space-y-8">
        {/* Header Section */}
        <div className="flex flex-col items-center space-y-6 text-center overflow-hidden">
          <motion.div 
            className="relative"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              type: "spring", 
              damping: 12,
              duration: 0.8,
              delay: 0.1
            }}
            onAnimationComplete={() => setAnimationComplete(true)}
          >
            {/* Halo effect behind logo */}
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse"></div>
            {/* Logo container */}
            <div className="relative bg-gradient-to-br from-primary/10 to-primary/20 p-5 rounded-full backdrop-blur-sm ring-1 ring-primary/20 shadow-lg overflow-hidden hover:shadow-primary/20 transition-all duration-300">
              {/* Video icon with animation effect */}
              <div className="relative">
                <div className="absolute inset-0 bg-primary/10 animate-ping rounded-full opacity-75"></div>
                <svg 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="w-14 h-14 text-primary"
                >
                  <defs>
                    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="currentColor" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                  {/* Monitor screen */}
                  <rect x="2" y="4" width="20" height="12" rx="2" stroke="url(#logoGradient)" strokeWidth="2" fill="none" />
                  {/* Play button */}
                  <polygon points="10,8 16,10 10,12" fill="url(#logoGradient)" />
                  {/* Stand */}
                  <path d="M8 16L8 18L16 18L16 16" stroke="url(#logoGradient)" strokeWidth="2" strokeLinecap="round" />
                  <rect x="7" y="18" width="10" height="2" rx="1" fill="url(#logoGradient)" />
                </svg>
              </div>
            </div>
          </motion.div>
          <div className="space-y-3 overflow-hidden">
            <motion.h1 
              className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ 
                type: "spring", 
                damping: 12,
                delay: 0.4
              }}
            >
              ¡Bienvenido a PetraPanel!
            </motion.h1>
            <motion.p 
              className="text-base md:text-lg text-muted-foreground/80 max-w-sm mx-auto"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ 
                type: "spring", 
                damping: 12,
                delay: 0.6
              }}
            >
              Tu plataforma avanzada para gestionar y optimizar tus videos de YouTube
            </motion.p>
          </div>
        </div>

        {/* Auth Form Card */}
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ 
              delay: 0.7, 
              duration: 0.5,
              type: "spring",
              stiffness: 100 
            }}
          >
            <Card className="border-border/40 backdrop-blur-sm bg-card/90 shadow-xl overflow-hidden">
              <CardContent className="pt-14 px-8 md:px-10">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="space-y-6">
                      <AnimatePresence>
                        {showForm && (
                          <motion.div 
                            className="space-y-2 pt-4"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2, duration: 0.3 }}
                          >
                            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                              >
                                <User size={18} className="text-muted-foreground" />
                              </motion.div>
                              <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                              >
                                Nombre de usuario
                              </motion.span>
                            </label>
                            <motion.div 
                              className="relative"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.6 }}
                            >
                              <Input
                                placeholder="Ingresa tu nombre de usuario"
                                {...form.register("username", { required: true })}
                                className="h-12 pl-4"
                              />
                            </motion.div>
                            {form.formState.errors.username && (
                              <motion.p 
                                className="text-destructive text-xs mt-1"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                              >
                                Este campo es obligatorio
                              </motion.p>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      <AnimatePresence>
                        {showForm && (
                          <motion.div 
                            className="space-y-2"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4, duration: 0.3 }}
                          >
                            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                              >
                                <Lock size={18} className="text-muted-foreground" />
                              </motion.div>
                              <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                              >
                                Contraseña
                              </motion.span>
                            </label>
                            <motion.div 
                              className="relative"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.8 }}
                            >
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="Ingresa tu contraseña"
                                {...form.register("password", { required: true })}
                                className="h-12 pr-10"
                              />
                              <motion.button 
                                type="button"
                                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                                onClick={() => setShowPassword(!showPassword)}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 1, type: "spring" }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                              </motion.button>
                            </motion.div>
                            {form.formState.errors.password && (
                              <motion.p 
                                className="text-destructive text-xs mt-1"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                              >
                                Este campo es obligatorio
                              </motion.p>
                            )}
                            <motion.div 
                              className="flex justify-end"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 1.1 }}
                            >
                              <a
                                href="#"
                                className="text-xs text-muted-foreground hover:text-primary transition-colors"
                              >
                                ¿Olvidaste tu contraseña?
                              </a>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    <AnimatePresence>
                      {showForm && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1.2, duration: 0.4 }}
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
                      )}
                    </AnimatePresence>
                  </form>
                </Form>
              </CardContent>
              <CardFooter className="px-8 md:px-10 py-4 flex justify-center border-t border-border/20">
                <motion.p 
                  className="text-sm text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.3 }}
                >
                  ¿No tienes una cuenta? {" "}
                  <a href="#" className="text-primary hover:underline">
                    Contacta al administrador
                  </a>
                </motion.p>
              </CardFooter>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Footer Text */}
        <motion.p 
          className="px-4 md:px-8 text-center text-xs md:text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
        >
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
        </motion.p>
      </div>
    </div>
  );
}