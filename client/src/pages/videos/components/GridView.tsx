import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { getStatusBadgeColor, getStatusLabel } from "@/lib/status-labels";
import { ThumbnailPreview } from "@/components/common/ThumbnailPreview";
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
  if (filteredVideos.length === 0) {
    return (
      <div className="flex justify-center mt-10">
        {renderEmptyState()}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {filteredVideos.map((video) => (
        <Card
          key={video.id}
          className={cn(
            "video-card overflow-hidden transition-all duration-200",
            canSeeVideoDetails(video) && "cursor-pointer hover:shadow-md",
            selectedVideos.includes(video.id) && "ring-2 ring-primary"
          )}
          data-video-id={video.id}
          onClick={() => !selectMode && canSeeVideoDetails(video) && handleVideoClick(video)}
        >
          {/* Selection checkbox */}
          {user?.role === "admin" && selectMode && (
            <div className="absolute top-2 left-2 z-10">
              <Checkbox
                checked={selectedVideos.includes(video.id)}
                onCheckedChange={() => toggleSelectVideo(video.id)}
                onClick={(e) => e.stopPropagation()}
                className="bg-background/80 backdrop-blur-sm border-muted"
                aria-label={`Seleccionar video ${video.title}`}
              />
            </div>
          )}
          
          {/* Thumbnail */}
          <div className="relative aspect-video">
            <ThumbnailPreview
              src={video.thumbnailUrl}
              alt={video.title}
              aspectRatio="video"
              enableZoom={false}
              showPlaceholder={true}
              title={video.optimizedTitle || video.title}
              duration={video.seriesNumber ? `S${video.seriesNumber}` : undefined}
              className="w-full h-full object-cover"
            />
          </div>
          
          <CardContent className="p-3">
            <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">
              {video.optimizedTitle || video.title}
            </h3>
            <div className="flex items-center gap-1 mt-2">
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
                <span className="text-xs text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap max-w-[100px]">
                  {video.projectName}
                </span>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="py-2 px-3 border-t flex justify-between items-center text-xs text-muted-foreground">
            {video.assignedToName ? (
              <span className="overflow-hidden text-ellipsis whitespace-nowrap max-w-[100px]" title={video.assignedToName}>
                {video.assignedToName}
              </span>
            ) : (
              <span>No asignado</span>
            )}
            <span>{formatDate(video.updatedAt)}</span>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}