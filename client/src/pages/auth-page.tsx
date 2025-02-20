import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/use-user";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { CircleUserRound } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { login, register } = useUser();
  const [, setLocation] = useLocation();

  const form = useForm({
    defaultValues: {
      username: "hola",
      password: "1234",
    },
  });

  const onSubmit = async (data: { username: string; password: string }) => {
    try {
      if (isLogin) {
        await login(data);
        setLocation("/");
      } else {
        await register(data);
        setLocation("/");
      }
      toast.success(isLogin ? "¡Bienvenido!" : "Registro exitoso", {
        description: isLogin ? "Has iniciado sesión correctamente" : "Tu cuenta ha sido creada",
      });
    } catch (error: any) {
      toast.error("Error", {
        description: error.message
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 md:p-10 bg-gradient-to-br from-primary/10 via-background to-primary/5">
      <div className="w-full max-w-lg space-y-8">
        {/* Header Section */}
        <div className="flex flex-col items-center space-y-6 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-primary/10 to-primary/20 p-5 rounded-full backdrop-blur-sm ring-1 ring-primary/20">
              <CircleUserRound className="w-14 h-14 text-primary animate-float" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              {isLogin ? "¡Bienvenido de nuevo!" : "Crear una cuenta"}
            </h1>
            <p className="text-base md:text-lg text-muted-foreground/80 max-w-sm mx-auto">
              {isLogin
                ? "Inicia sesión para acceder a tu cuenta y gestionar tus videos"
                : "Regístrate para comenzar a gestionar tus videos"}
            </p>
          </div>
        </div>

        {/* Auth Form Card */}
        <Card className="border-border/40 backdrop-blur-sm bg-card/90 shadow-xl">
          <CardContent className="pt-14 px-8 md:px-10">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="space-y-10">
                  <div className="space-y-2 pt-4">
                    <label className="text-sm font-medium text-foreground">
                      Nombre de usuario
                    </label>
                    <Input
                      placeholder="Ingresa tu nombre de usuario"
                      {...form.register("username", { required: true })}
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">
                      Contraseña
                    </label>
                    <Input
                      type="password"
                      placeholder="Ingresa tu contraseña"
                      {...form.register("password", { required: true })}
                      className="h-12"
                    />
                  </div>
                </div>
                <Button type="submit" size="lg" className="w-full h-12 text-base">
                  {isLogin ? "Iniciar sesión" : "Registrarse"}
                </Button>
              </form>
            </Form>
            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                className="text-sm text-muted-foreground hover:text-primary"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin
                  ? "¿No tienes una cuenta? Regístrate"
                  : "¿Ya tienes una cuenta? Inicia sesión"}
              </Button>
            </div>
          </CardContent>
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