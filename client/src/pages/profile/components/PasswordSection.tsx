import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export function PasswordSection() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    
    // Referencia al botón para controlar el estado de carga
    let submitButton: HTMLButtonElement | null = null;
    try {
      if (e && e.currentTarget) {
        submitButton = e.currentTarget.querySelector('button[type="submit"]') as HTMLButtonElement;
        if (submitButton) {
          submitButton.disabled = true;
          submitButton.innerHTML = '<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Actualizando...';
        }
      }
    } catch (buttonError) {
      console.error("Error al acceder al botón:", buttonError);
    }

    try {
      const response = await fetch('/api/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cambiar la contraseña');
      }

      // Mostrar toast
      try {
        toast.success("Contraseña actualizada", {
          description: "Tu contraseña ha sido cambiada correctamente",
          duration: 5000, // Duración más larga
        });
      } catch (toastError) {
        console.error("Error mostrando toast:", toastError);
        // Solo si el toast falla, mostramos alerta como respaldo
        alert("Contraseña actualizada correctamente");
      }

      // Limpiar los campos después de una actualización exitosa
      try {
        if (e && e.currentTarget) {
          const passwordInputs = e.currentTarget.querySelectorAll('input[type="password"], input[type="text"]');
          passwordInputs.forEach(input => {
            (input as HTMLInputElement).value = '';
          });
        }
      } catch (cleanError) {
        console.error("Error al limpiar campos:", cleanError);
      }
    } catch (error: any) {
      // Mostrar toast de error
      try {
        toast.error("Error", {
          description: error.message || "No se pudo actualizar la contraseña",
        });
      } catch (toastError) {
        console.error("Error mostrando toast de error:", toastError);
        // Solo si el toast falla, mostramos alerta como respaldo
        alert(`Error: ${error.message || "No se pudo actualizar la contraseña"}`);
      }
    } finally {
      // Restaurar el botón
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Actualizar contraseña';
      }
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
          Actualiza tu contraseña de acceso.
        </p>
      </div>

      <form onSubmit={handlePasswordSubmit} className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Contraseña actual</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                name="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                required
              />
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
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nueva contraseña</Label>
            <div className="relative">
              <Input
                id="newPassword"
                name="newPassword"
                type={showNewPassword ? "text" : "password"}
                required
              />
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
          </div>
        </div>
        <Button type="submit">Actualizar contraseña</Button>
      </form>
    </Card>
  );
}