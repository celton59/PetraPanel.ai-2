import { Profile } from "@/types/profile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, Info, CircleDot } from "lucide-react";

interface UserDetailsProps {
  user: Profile | null;
  isOpen: boolean;
  onClose: () => void;
  isOnline: boolean;
}

export const UserDetails = ({ user, isOpen, onClose, isOnline }: UserDetailsProps) => {
  const getRoleBadgeColor = (role: string | undefined) => {
    switch (role) {
      case "admin":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "uploader":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "youtuber":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Detalles del Usuario</DialogTitle>
          <DialogDescription>
            Información detallada del usuario seleccionado
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16 border">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {user.full_name?.[0] || user.username?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
              {isOnline && (
                <div className="absolute -bottom-1 -right-1">
                  <CircleDot className="h-5 w-5 text-green-500 fill-green-500" />
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                {user.full_name || user.username || "Usuario sin nombre"}
              </h3>
              <Badge variant="outline" className={`${getRoleBadgeColor(user.role)} capitalize mt-1`}>
                {user.role || "Sin rol"}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{user.email || "No disponible"}</span>
            </div>
            {user.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{user.phone}</span>
              </div>
            )}
            {user.bio && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Info className="h-4 w-4" />
                    <span>Biografía</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{user.bio}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
