
import { NewVideoDialog } from "@/components/video/NewVideoDialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Video, User, Settings, FolderKanban } from "lucide-react";
import { Link } from "react-router-dom";

export function DashboardActions() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="p-4">
        <div className="space-y-2">
          <NewVideoDialog />
        </div>
      </Card>
      <Card className="p-4">
        <div className="space-y-2">
          <Link to="/projects">
            <Button variant="outline" className="w-full">
              <FolderKanban className="mr-2 h-4 w-4" />
              Proyectos
            </Button>
          </Link>
        </div>
      </Card>
      <Card className="p-4">
        <div className="space-y-2">
          <Link to="/settings?tab=users">
            <Button variant="outline" className="w-full">
              <User className="mr-2 h-4 w-4" />
              Usuarios
            </Button>
          </Link>
        </div>
      </Card>
      <Card className="p-4">
        <div className="space-y-2">
          <Link to="/settings">
            <Button variant="outline" className="w-full">
              <Settings className="mr-2 h-4 w-4" />
              Configuración
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
