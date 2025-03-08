import { useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { getStatusBadgeColor, getStatusLabel } from "@/lib/status-labels";
import { ThumbnailPreview } from "@/components/common/ThumbnailPreview";
import { UserBadges } from "@/components/video/UserBadges";
import { ApiVideo } from "@/types/api";
import { User } from "@/types/user";

interface GridViewProps {
  videos: ApiVideo[];
  filteredVideos: ApiVideo[];
  selectedVideos: number[];
  selectMode: boolean;
  toggleSelectVideo: (videoId: number) => void;
  handleVideoClick: (video: ApiVideo) => void;
  canSeeVideoDetails: (video: ApiVideo) => boolean;
  user: User;
  renderEmptyState: () => React.ReactNode;
}

export function GridView({
  videos,
  filteredVideos,
  selectedVideos,
  selectMode,
  toggleSelectVideo,
  handleVideoClick,
  canSeeVideoDetails,
  user,
  renderEmptyState
}: GridViewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {filteredVideos?.map((video) => (
        <div
          key={video.id}
          className={cn(
            "group video-card relative rounded-lg border shadow-sm overflow-hidden transition-all hover:shadow-md bg-card",
            selectedVideos.includes(video.id) && "ring-2 ring-primary"
          )}
          data-video-id={video.id}
          onClick={() => !selectMode && canSeeVideoDetails(video) && handleVideoClick(video)}
        >
          {/* Selection checkbox overlay */}
          {user?.role === "admin" && (
            <div 
              className={cn(
                "absolute top-2 left-2 z-10 transition-all duration-200",
                selectMode 
                  ? "opacity-100 scale-100" 
                  : "opacity-0 scale-75 pointer-events-none group-hover:opacity-100 group-hover:scale-100",
                selectedVideos.includes(video.id) && "!opacity-100 !scale-100"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-md transition-colors shadow-sm", 
                selectedVideos.includes(video.id) 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-background/90 backdrop-blur-sm hover:bg-background"
              )}>
                <Checkbox
                  checked={selectedVideos.includes(video.id)}
                  onCheckedChange={(e) => {
                    toggleSelectVideo(video.id);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    "h-4 w-4 border-2 transition-all duration-200",
                    selectedVideos.includes(video.id) && "border-primary-foreground"
                  )}
                  aria-label={`Seleccionar video ${video.title}`}
                />
              </div>
            </div>
          )}
          
          {/* Thumbnail */}
          <div className="aspect-video w-full overflow-hidden relative">
            <ThumbnailPreview
              src={video.thumbnailUrl}
              alt={video.title}
              aspectRatio="video"
              enableZoom={true}
              showPlaceholder={true}
              title={video.optimizedTitle || video.title}
              duration={video.seriesNumber ? `S${video.seriesNumber}` : undefined}
              className="w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          </div>
          
          {/* Content */}
          <div className="p-3">
            <h3 className="font-medium text-sm line-clamp-2 mb-1">
              {video.optimizedTitle || video.title}
            </h3>
            
            <div className="flex justify-between items-center mt-2">
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs capitalize",
                  getStatusBadgeColor(video.status)
                )}
              >
                {getStatusLabel(user!.role, video)}
              </Badge>
              <div className="text-xs text-muted-foreground">
                {video.updatedAt ? formatDate(video.updatedAt) : ""}
              </div>
            </div>
            
            <UserBadges video={video} compact={true} />
          </div>
        </div>
      ))}
      {/* Mostrar estado vacío solo si no hay videos */}
      {(!videos || videos.length === 0) && (
        <div className="col-span-full">
          {renderEmptyState()}
        </div>
      )}
    </div>
  );
}