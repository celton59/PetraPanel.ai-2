import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getInitials } from "@/lib/utils";
import { User, UserCheck, UserCog, Upload, Eye } from "lucide-react";

interface UserBadgesProps {
  optimizedBy?: string | null;
  contentReviewedBy?: string | null;
  mediaReviewedBy?: string | null;
  uploaderName?: string | null;
  creatorName?: string | null;
  optimizerUsername?: string | null;
  contentReviewerUsername?: string | null;
  mediaReviewerUsername?: string | null;
  uploaderUsername?: string | null;
  creatorUsername?: string | null;
  size?: "sm" | "md" | "lg";
}

export function UserBadges({ 
  optimizedBy,
  contentReviewedBy,
  mediaReviewedBy,
  uploaderName,
  creatorName,
  optimizerUsername,
  contentReviewerUsername,
  mediaReviewerUsername,
  uploaderUsername,
  creatorUsername,
  size = "md"
}: UserBadgesProps) {
  const compact = size === "sm";
  
  const roles = [
    {
      name: "Creador",
      icon: User,
      fullName: creatorName,
      username: creatorUsername,
      color: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
      iconColor: "text-blue-500"
    },
    {
      name: "Optimizador",
      icon: UserCog,
      fullName: optimizedBy,
      username: optimizerUsername,
      color: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400",
      iconColor: "text-purple-500"
    },
    {
      name: "Revisor Cont.",
      icon: Eye,
      fullName: contentReviewedBy,
      username: contentReviewerUsername,
      color: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
      iconColor: "text-amber-500"
    },
    {
      name: "Uploader",
      icon: Upload,
      fullName: uploaderName,
      username: uploaderUsername,
      color: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400",
      iconColor: "text-green-500"
    },
    {
      name: "Revisor Media",
      icon: UserCheck,
      fullName: mediaReviewedBy,
      username: mediaReviewerUsername,
      color: "bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400",
      iconColor: "text-pink-500"
    }
  ];

  // Filtrar roles sin asignar si es compacto
  const filteredRoles = compact 
    ? roles.filter(role => role.fullName || role.username)
    : roles;

  return (
    <div className="flex flex-wrap gap-1.5">
      <TooltipProvider>
        {filteredRoles.map((role, idx) => (
          <Tooltip key={idx}>
            <TooltipTrigger asChild>
              <div 
                className={`flex items-center ${compact ? "p-1.5" : "px-2 py-1.5"} rounded-full ${role.color} cursor-help transition-all duration-150 hover:ring-2 hover:ring-primary/20`}
              >
                {compact ? (
                  <div className="flex items-center space-x-1">
                    <role.icon className={`w-3.5 h-3.5 ${role.iconColor}`} />
                    <span className="text-xs font-medium">
                      {getInitials(role.fullName)}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <role.icon className={`w-3.5 h-3.5 ${role.iconColor}`} />
                    <span className="text-xs font-medium">
                      {role.name}
                    </span>
                  </div>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="center" className="p-2 max-w-xs text-xs">
              <div className="font-medium">{role.name}</div>
              {role.fullName || role.username ? (
                <div className="text-muted-foreground">
                  {role.fullName ? `${role.fullName} (${role.username})` : role.username}
                </div>
              ) : (
                <div className="text-muted-foreground">No asignado</div>
              )}
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
}