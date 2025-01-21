
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { User, Upload, Video } from "lucide-react";

interface RoleFilterProps {
  selectedRole: string;
  onRoleChange: (role: string) => void;
}

export function RoleFilter({ selectedRole, onRoleChange }: RoleFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={selectedRole === "all" ? "default" : "outline"}
        size="sm"
        onClick={() => onRoleChange("all")}
        className={cn(
          "transition-all duration-200 bg-zinc-900",
          selectedRole === "all" ? "bg-zinc-900 text-white" : "bg-transparent"
        )}
      >
        <User className="mr-2 h-4 w-4" />
        Todos
      </Button>
      <Button
        variant={selectedRole === "admin" ? "default" : "outline"}
        size="sm"
        onClick={() => onRoleChange("admin")}
        className={cn("transition-all duration-200")}
      >
        <User className="mr-2 h-4 w-4 text-blue-500" />
        Admin
      </Button>
      <Button
        variant={selectedRole === "uploader" ? "default" : "outline"}
        size="sm"
        onClick={() => onRoleChange("uploader")}
      >
        <Upload className="mr-2 h-4 w-4 text-green-500" />
        Uploader
      </Button>
      <Button
        variant={selectedRole === "youtuber" ? "default" : "outline"}
        size="sm"
        onClick={() => onRoleChange("youtuber")}
      >
        <Video className="mr-2 h-4 w-4 text-red-500" />
        Youtuber
      </Button>
      <Button
        variant={selectedRole === "optimizer" ? "default" : "outline"}
        size="sm"
        onClick={() => onRoleChange("optimizer")}
      >
        <Upload className="mr-2 h-4 w-4 text-purple-500" />
        Optimizador
      </Button>
      <Button
        variant={selectedRole === "reviewer" ? "default" : "outline"}
        size="sm"
        onClick={() => onRoleChange("reviewer")}
      >
        <User className="mr-2 h-4 w-4 text-yellow-500" />
        Revisor
      </Button>
    </div>
  );
}
