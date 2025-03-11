import { Bell } from "lucide-react";
import NotificationSettings from "../NotificationSettings";

export function NotificationsSection() {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Bell className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-medium">Preferencias de notificaciones</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Configura cómo y cuándo quieres recibir notificaciones sobre actividades importantes.
      </p>
      <NotificationSettings />
    </div>
  );
}