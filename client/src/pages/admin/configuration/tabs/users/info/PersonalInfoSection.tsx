import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { User as UserIcon, UserRound, Mail, Phone, Type, Loader2, Check, X } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { User } from "@db/schema";

interface PersonalInfoSectionProps {
  isCheckingUsername: boolean;
  isCheckingEmail: boolean;
  form: UseFormReturn<Partial<User>>;
}

export function PersonalInfoSection ({
  form,
  isCheckingUsername,
  isCheckingEmail,
}: PersonalInfoSectionProps) {
  const getFieldIcon = (fieldName: "username" | "email") => {
    const isChecking = fieldName === "username" ? isCheckingUsername : isCheckingEmail;
    const hasError = !!form.formState.errors[fieldName];
    const isDirty = form.formState.dirtyFields[fieldName];

    if (isChecking) {
      return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    }
    if (isDirty) {
      return hasError ? 
        <X className="h-4 w-4 text-destructive" /> : 
        <Check className="h-4 w-4 text-success" />;
    }
    return null;
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <UserRound className="h-5 w-5 text-primary/70" />
          <h3 className="text-lg font-medium">Información Personal</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Ingresa la información básica del usuario. Los campos marcados con * son obligatorios.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center space-x-2">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <span>Nombre completo *</span>
              </FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ''} placeholder="Juan Pérez" />
              </FormControl>
              <FormDescription>
                Usa tu nombre real para una mejor identificación
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center space-x-2">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <span>Nombre de usuario *</span>
              </FormLabel>
              <div className="relative">
                <FormControl>
                  <Input {...field} placeholder="usuario123" />
                </FormControl>
                <div className="absolute right-3 top-2.5">
                  {getFieldIcon("username")}
                </div>
              </div>
              <FormDescription>
                Solo letras minúsculas, números y guiones bajos
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>Email *</span>
              </FormLabel>
              <div className="relative">
                <FormControl>
                  <Input {...field} value={field.value || ''} type="email" placeholder="usuario@ejemplo.com" />
                </FormControl>
                <div className="absolute right-3 top-2.5">
                  {getFieldIcon("email")}
                </div>
              </div>
              <FormDescription>
                Usaremos este email para notificaciones importantes
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>Teléfono</span>
              </FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  value={field.value || ''}
                  placeholder="+34 600 000 000" 
                />
              </FormControl>
              <FormDescription>
                Formato internacional preferido (ej: +34 600 000 000)
              </FormDescription>
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
            <FormLabel className="flex items-center space-x-2">
              <Type className="h-4 w-4 text-muted-foreground" />
              <span>Biografía</span>
            </FormLabel>
            <FormControl>
              <Textarea 
                {...field}
                value={field.value || ''}
                placeholder="Cuéntanos un poco sobre ti..." 
                className="min-h-[100px]"
              />
            </FormControl>
            <FormDescription>
              Máximo 500 caracteres
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </Card>
  );
};