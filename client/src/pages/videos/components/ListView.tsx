import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getStatusBadgeColor, getStatusLabel } from "@/lib/status-labels";
import { ThumbnailPreview } from "@/components/common/ThumbnailPreview";
import { ApiVideo } from "@/types/api";
import { User } from "@/types/user";

interface ListViewProps {
  videos: ApiVideo[];
  filteredVideos: ApiVideo[];
  selectedVideos: number[];
  selectMode: boolean;
  toggleSelectVideo: (videoId: number) => void;
  handleVideoClick: (video: ApiVideo) => void;
  canSeeVideoDetails: (video: ApiVideo) => boolean;
  deleteVideo: (params: { videoId: number; projectId: number }) => void;
  user: User;
  renderEmptyState: () => React.ReactNode;
}

export function ListView({
  videos,
  filteredVideos,
  selectedVideos,
  selectMode,
  toggleSelectVideo,
  handleVideoClick,
  canSeeVideoDetails,
  deleteVideo,
  user,
  renderEmptyState
}: ListViewProps) {
  if (filteredVideos.length === 0) {
    return (
      <div className="flex justify-center mt-10">
        {renderEmptyState()}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredVideos.map((video) => (
        <div
          key={video.id}
          className={cn(
            "video-card flex border rounded-lg overflow-hidden bg-card",
            canSeeVideoDetails(video) && "cursor-pointer hover:bg-muted/50",
            selectedVideos.includes(video.id) && "ring-2 ring-primary"
          )}
          data-video-id={video.id}
          onClick={() => !selectMode && canSeeVideoDetails(video) && handleVideoClick(video)}
        >
          {/* Selection checkbox */}
          {user?.role === "admin" && selectMode && (
            <div className="p-3 flex items-center">
              <Checkbox
                checked={selectedVideos.includes(video.id)}
                onCheckedChange={() => toggleSelectVideo(video.id)}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Seleccionar video ${video.title}`}
              />
            </div>
          )}
          
          {/* Thumbnail */}
          <div className="w-32 sm:w-48">
            <ThumbnailPreview
              src={video.thumbnailUrl}
              alt={video.title}
              aspectRatio="video"
              enableZoom={false}
              showPlaceholder={true}
              title={video.optimizedTitle || video.title}
              duration={video.seriesNumber ? `S${video.seriesNumber}` : undefined}
              className="w-full h-full"
            />
          </div>
          
          {/* Content */}
          <div className="p-3 flex-1 flex flex-col">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-medium text-sm sm:text-base line-clamp-1">
                  {video.optimizedTitle || video.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {video.description || "Sin descripción"}
                </p>
              </div>
              
              {user?.role === 'admin' && !selectMode && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteVideo({ videoId: video.id, projectId: video.projectId });
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className="mt-auto pt-2 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs capitalize",
                    getStatusBadgeColor(video.status)
                  )}
                >
                  {getStatusLabel(user!.role, video)}
                </Badge>
                {video.projectName && (
                  <span className="text-xs text-muted-foreground">
                    {video.projectName}
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDate(video.updatedAt)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}