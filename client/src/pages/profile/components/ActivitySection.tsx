import { Activity } from "lucide-react";
import { ActivityFeed } from "../ActivityFeed";

export function ActivitySection() {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Activity className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-medium">Historial de actividad</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Revisa tu historial de actividad reciente en la plataforma.
      </p>
      <ActivityFeed />
    </div>
  );
}