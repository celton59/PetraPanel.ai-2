import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "../../lib/utils";
import { getInitials } from "../../lib/utils";

interface Video {
  creatorId?: number;
  optimizerId?: number;
  assignedToId?: number;
  creatorName?: string;
  optimizerName?: string;
  assignedToName?: string;
}

interface UserBadgesProps {
  video: Video;
  compact?: boolean;
  className?: string;
}

export function UserBadges({ video, compact = false, className }: UserBadgesProps) {
  return (
    <div className={cn("flex gap-1 mt-2", className)}>
      {/* Creator */}
      {video.creatorId && video.creatorName && (
        <div 
          className={cn(
            "flex items-center gap-1 text-xs rounded-full overflow-hidden",
            compact ? "pr-1" : "bg-muted px-2 py-0.5"
          )}
          title={`Creador: ${video.creatorName}`}
        >
          <Avatar className="h-4 w-4">
            <AvatarImage src={`/api/users/${video.creatorId}/avatar`} alt={video.creatorName} />
            <AvatarFallback className="text-[8px]">{getInitials(video.creatorName)}</AvatarFallback>
          </Avatar>
          {!compact && <span className="truncate max-w-[80px]">{video.creatorName}</span>}
        </div>
      )}
      
      {/* Optimizer */}
      {video.optimizerId && video.optimizerName && (
        <div 
          className={cn(
            "flex items-center gap-1 text-xs rounded-full overflow-hidden",
            compact ? "pr-1" : "bg-muted px-2 py-0.5"
          )}
          title={`Optimizador: ${video.optimizerName}`}
        >
          <Avatar className="h-4 w-4">
            <AvatarImage src={`/api/users/${video.optimizerId}/avatar`} alt={video.optimizerName} />
            <AvatarFallback className="text-[8px]">{getInitials(video.optimizerName)}</AvatarFallback>
          </Avatar>
          {!compact && <span className="truncate max-w-[80px]">{video.optimizerName}</span>}
        </div>
      )}
      
      {/* Assigned To (if different from creator and optimizer) */}
      {video.assignedToId && 
       video.assignedToName && 
       video.assignedToId !== video.creatorId && 
       video.assignedToId !== video.optimizerId && (
        <div 
          className={cn(
            "flex items-center gap-1 text-xs rounded-full overflow-hidden",
            compact ? "pr-1" : "bg-muted px-2 py-0.5"
          )}
          title={`Asignado a: ${video.assignedToName}`}
        >
          <Avatar className="h-4 w-4">
            <AvatarImage src={`/api/users/${video.assignedToId}/avatar`} alt={video.assignedToName} />
            <AvatarFallback className="text-[8px]">{getInitials(video.assignedToName)}</AvatarFallback>
          </Avatar>
          {!compact && <span className="truncate max-w-[80px]">{video.assignedToName}</span>}
        </div>
      )}
    </div>
  );
}