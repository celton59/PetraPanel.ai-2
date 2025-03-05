import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { User } from "@db/schema";

const roleDescriptions: Record<User['role'], string> = {
  admin: "Control total del sistema",
  reviewer: "Revisa y aprueba videos",
  optimizer: "Optimiza títulos y metadatos",
  youtuber: "Gestiona el canal de YouTube",
  content_reviewer: "Revisa y aprueba contenido",
  media_reviewer: "Revisa y aprueba medios",
};

const rolePermissions: Record<User['role'], string[]> = {
  admin: [
    "Gestionar usuarios y roles",
    "Gestionar proyectos",
    "Acceso completo a todas las funciones",
  ],
  reviewer: [
    "Ver videos pendientes de revisión",
    "Aprobar o rechazar videos",
    "Añadir comentarios de revisión",
  ],
  optimizer: [
    "Editar títulos y descripciones",
    "Optimizar metadatos",
    "Ver estadísticas de SEO",
  ],
  youtuber: [
    "Publicar videos en YouTube",
    "Gestionar playlists",
    "Ver analytics de YouTube",
  ],
  content_reviewer: [
    "Ver videos pendientes de revisión",
    "Aprobar o rechazar videos",
    "Añadir comentarios de revisión",
  ],
  media_reviewer: [
    "Ver videos pendientes de revisión",
    "Aprobar o rechazar videos",
    "Añadir comentarios de revisión",
  ]
};

export const RolesTab = () => {
  const roles: User['role'][] = ["admin", "reviewer", "optimizer", "youtuber"];

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2">
        <Info className="w-4 h-4 mt-1 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Los roles determinan qué acciones puede realizar cada usuario en el sistema.
          Cada rol tiene permisos específicos que no pueden ser modificados.
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rol</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Permisos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role) => (
            <TableRow key={role}>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {role}
                </Badge>
              </TableCell>
              <TableCell>{roleDescriptions[role]}</TableCell>
              <TableCell>
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="text-sm text-primary hover:underline cursor-pointer">
                      Ver permisos
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {role}
                        </Badge>
                        <span>- Permisos del rol</span>
                      </DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                      <ul className="list-disc list-inside space-y-2">
                        {rolePermissions[role].map((permission, index) => (
                          <li key={index} className="text-sm text-muted-foreground">
                            {permission}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </DialogContent>
                </Dialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
