import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Eye, EyeOff, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

// Esquema de validación para el cambio de contraseña
const passwordSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es obligatoria"),
  newPassword: z.string().min(1, "La nueva contraseña es obligatoria")
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

// Función para evaluar la fortaleza de la contraseña
function evaluatePasswordStrength(password: string): { score: number; feedback: string[] } {
  const feedback: string[] = [];
  let score = 0;
  
  // Longitud base - hasta 40 puntos
  const lengthScore = Math.min(password.length * 4, 40);
  score += lengthScore;
  
  // Verificar complejidad - hasta 60 puntos adicionales
  if (/[A-Z]/.test(password)) score += 15;
  if (/[a-z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^A-Za-z0-9]/.test(password)) score += 20;
  
  // Patrones y variedad
  const uniqueChars = new Set(password.split('')).size;
  const uniqueRatio = uniqueChars / password.length;
  score += Math.floor(uniqueRatio * 15); // Hasta 15 puntos por variedad
  
  // Si hay patrones comunes o palabras de diccionario, reducir puntuación
  if (/123|abc|qwerty|password|admin|welcome/i.test(password)) {
    score = Math.max(score - 25, 0);
    feedback.push("Evita patrones comunes y palabras predecibles");
  }

  // Si la longitud es muy corta, dar retroalimentación
  if (password.length < 10) {
    feedback.push("Aumenta la longitud para mayor seguridad");
  }

  // Si falta variedad, dar retroalimentación
  if (uniqueRatio < 0.7) {
    feedback.push("Utiliza más caracteres diferentes");
  }

  return { score: Math.min(score, 100), feedback };
}

export function PasswordSection() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] as string[] });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Definir formulario
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },
  });

  // Calcular fortaleza cuando cambia el valor de la contraseña
  const watchNewPassword = form.watch("newPassword");
  
  if (watchNewPassword) {
    const strength = evaluatePasswordStrength(watchNewPassword);
    if (passwordStrength.score !== strength.score) {
      setPasswordStrength(strength);
    }
  }

  const getStrengthColor = (score: number) => {
    if (score < 40) return "bg-destructive";
    if (score < 70) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const getStrengthLabel = (score: number) => {
    if (score < 40) return "Débil";
    if (score < 70) return "Media";
    return "Fuerte";
  };

  const onSubmit = async (data: PasswordFormValues) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al cambiar la contraseña');
      }

      // Éxito: mostrar toast y resetear formulario
      toast.success("Contraseña actualizada", {
        description: "Tu contraseña ha sido cambiada correctamente",
        duration: 5000,
      });
      
      form.reset();
      setPasswordStrength({ score: 0, feedback: [] });
      
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "No se pudo actualizar la contraseña",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Lock className="h-5 w-5 text-primary/70" />
          <h3 className="text-lg font-medium">Cambiar Contraseña</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Actualiza tu contraseña de acceso. Usa una contraseña segura con al menos 8 caracteres,
          que incluya mayúsculas, minúsculas, números y caracteres especiales.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña actual</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      {...field}
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="Ingresa tu contraseña actual"
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nueva contraseña</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      {...field}
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Crea una contraseña segura"
                      onChange={(e) => {
                        field.onChange(e);
                        setPasswordStrength(evaluatePasswordStrength(e.target.value));
                      }}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <FormMessage />
                
                {/* Indicador de fortaleza de contraseña */}
                {watchNewPassword && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium flex items-center gap-1">
                        {passwordStrength.score < 40 ? (
                          <AlertCircle className="h-3 w-3 text-destructive" />
                        ) : passwordStrength.score < 70 ? (
                          <Info className="h-3 w-3 text-amber-500" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        )}
                        Seguridad: {getStrengthLabel(passwordStrength.score)}
                      </span>
                      <span className="text-xs">{passwordStrength.score}%</span>
                    </div>
                    <Progress 
                      value={passwordStrength.score} 
                      className="h-1.5" 
                      indicatorClassName={getStrengthColor(passwordStrength.score)}
                    />
                    
                    {passwordStrength.feedback.length > 0 && (
                      <Alert variant="destructive" className="py-2 mt-2">
                        <AlertDescription className="text-xs">
                          {passwordStrength.feedback.map((feedback, index) => (
                            <div key={index} className="flex items-start gap-1">
                              <span>•</span>
                              <span>{feedback}</span>
                            </div>
                          ))}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </FormItem>
            )}
          />
          
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Actualizando...
              </>
            ) : (
              "Actualizar contraseña"
            )}
          </Button>
        </form>
      </Form>
    </Card>
  );
}