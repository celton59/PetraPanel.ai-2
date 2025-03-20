import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getInitials } from "@/lib/utils";
import { User, UserCheck, UserCog, Upload, Eye } from "lucide-react";
import { ApiVideo } from "@/hooks/useVideos";

interface UserBadgesProps {
  video: ApiVideo;
  compact?: boolean;
}

export function UserBadges({ video, compact = false }: UserBadgesProps) {
  const roles = [
    {
      name: "Creador",
      icon: User,
      fullName: video.creatorName,
      username: video.creatorUsername,
      color: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
      iconColor: "text-blue-500"
    },
    {
      name: "Optimizador",
      icon: UserCog,
      fullName: video.optimizerName,
      username: video.optimizerUsername,
      color: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400",
      iconColor: "text-purple-500"
    },
    {
      name: "Revisor Cont.",
      icon: Eye,
      fullName: video.contentReviewerName,
      username: video.contentReviewerUsername,
      color: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
      iconColor: "text-amber-500"
    },
    {
      name: "Uploader",
      icon: Upload,
      fullName: video.uploaderName,
      username: video.uploaderUsername,
      color: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400",
      iconColor: "text-green-500"
    },
    {
      name: "Revisor Media",
      icon: UserCheck,
      fullName: video.mediaReviewerName,
      username: video.mediaReviewerUsername,
      color: "bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400",
      iconColor: "text-pink-500"
    }
  ];

  // Filtrar roles sin asignar si es compacto
  const filteredRoles = compact 
    ? roles.filter(role => role.fullName || role.username)
    : roles;

  const getDisplayInitials = (fullName: string | null | undefined, username: string | null | undefined) => {
    if (fullName) return getInitials(fullName);
    if (username) return username.substring(0, 2).toUpperCase();
    return '-';
  };

  const getTooltipContent = (role: { name: string, fullName: string | null | undefined, username: string | null | undefined }) => {
    if (!role.fullName && !role.username) {
      return "No asignado";
    }
    if (role.fullName && role.username) {
      return `${role.fullName} (${role.username})`;
    }
    return role.username || role.fullName || "No asignado";
  };

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
                      {getDisplayInitials(role.fullName, role.username)}
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
              <div className="text-muted-foreground">
                {getTooltipContent(role)}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
}