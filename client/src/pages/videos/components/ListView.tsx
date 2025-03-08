import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { getStatusBadgeColor, getStatusLabel } from "@/lib/status-labels";
import { ThumbnailPreview } from "@/components/common/ThumbnailPreview";
import { UserBadges } from "@/components/video/UserBadges";
import { ApiVideo } from "@/types/api";
import { User } from "@/types/user";
import { Eye, Trash2 } from "lucide-react";

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
  renderEmptyState,
}: ListViewProps) {
  return (
    <div className="space-y-3">
      {filteredVideos?.map((video) => (
        <div
          key={video.id}
          className={cn(
            "group video-card relative flex items-center border rounded-lg p-3 bg-card shadow-sm hover:shadow-md transition-all",
            selectedVideos.includes(video.id) && "ring-2 ring-primary"
          )}
          data-video-id={video.id}
          onClick={() => !selectMode && canSeeVideoDetails(video) && handleVideoClick(video)}
        >
          {/* Selection checkbox at left side */}
          {user?.role === "admin" && (
            <div 
              className={cn(
                "flex-shrink-0 mr-3 transition-all duration-200",
                selectMode 
                  ? "opacity-100" 
                  : "opacity-0 group-hover:opacity-100",
                selectedVideos.includes(video.id) && "!opacity-100"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-md transition-colors", 
                selectedVideos.includes(video.id) 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted/80 hover:bg-muted"
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
          <div className="flex-shrink-0 mr-4">
            <div className="w-20 h-12 rounded overflow-hidden">
              <ThumbnailPreview
                src={video.thumbnailUrl}
                alt={video.title}
                aspectRatio="video"
                enableZoom={true}
                showPlaceholder={true}
                className="h-full"
                showHoverActions={false}
              />
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-grow min-w-0">
            <div className="flex items-start justify-between">
              <div className="mr-4 min-w-0">
                <h3 className="font-medium line-clamp-1">
                  {video.optimizedTitle || video.title}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  {video.seriesNumber && (
                    <span className="text-xs font-medium bg-primary/10 text-primary rounded-md px-2 py-0.5">
                      S{video.seriesNumber}
                    </span>
                  )}
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs capitalize",
                      getStatusBadgeColor(video.status)
                    )}
                  >
                    {getStatusLabel(user!.role, video)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(video.updatedAt)}
                  </span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex-shrink-0 flex items-center space-x-1">
                <UserBadges video={video} compact={true} className="mr-2" />
                
                {canSeeVideoDetails(video) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVideoClick(video);
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                
                {user?.role === "admin" && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => e.stopPropagation()}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Se eliminará permanentemente el video y
                          todos sus archivos asociados.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="mt-0">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            deleteVideo({
                              videoId: video.id,
                              projectId: video.projectId,
                            });
                          }}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
      {/* Mostrar estado vacío solo si no hay videos */}
      {(!videos || videos.length === 0) && renderEmptyState()}
    </div>
  );
}