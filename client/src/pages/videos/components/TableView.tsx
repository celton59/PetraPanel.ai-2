import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

interface TableViewProps {
  videos: ApiVideo[];
  filteredVideos: ApiVideo[];
  selectedVideos: number[];
  selectMode: boolean;
  toggleSelectVideo: (videoId: number) => void;
  toggleSelectAll: () => void;
  handleVideoClick: (video: ApiVideo) => void;
  canSeeVideoDetails: (video: ApiVideo) => boolean;
  deleteVideo: (params: { videoId: number; projectId: number }) => void;
  user: User;
  renderEmptyState: () => React.ReactNode;
}

export function TableView({
  videos,
  filteredVideos,
  selectedVideos,
  selectMode,
  toggleSelectVideo,
  toggleSelectAll,
  handleVideoClick,
  canSeeVideoDetails,
  deleteVideo,
  user,
  renderEmptyState,
}: TableViewProps) {
  return (
    <div className="space-y-6">
      {/* Vista de tabla para escritorio */}
      <div className="hidden md:block rounded-lg border bg-card shadow-sm overflow-hidden relative">
        {/* Accent gradient para la tabla de videos */}
        <div className="h-1 w-full bg-gradient-to-r from-indigo-600 via-primary to-violet-500 absolute top-0 left-0"></div>
        <div className="overflow-x-auto pt-1">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                {user?.role === "admin" && selectMode && (
                  <TableHead className="w-[40px]">
                    <div className={cn(
                      "p-1.5 rounded-md transition-colors", 
                      selectedVideos.length === filteredVideos.length && filteredVideos.length > 0 ? "bg-primary/20" : "bg-card hover:bg-muted"
                    )}>
                      <Checkbox 
                        checked={selectedVideos.length === filteredVideos.length && filteredVideos.length > 0}
                        onCheckedChange={toggleSelectAll}
                        className="h-4 w-4 border-2 transition-all duration-200"
                        aria-label="Seleccionar todos"
                      />
                    </div>
                  </TableHead>
                )}
                <TableHead className="">Miniatura</TableHead>
                <TableHead className="">Serie</TableHead>
                <TableHead className="">Título</TableHead>
                <TableHead className="">Estado</TableHead>
                <TableHead className="">Colaboradores</TableHead>
                <TableHead className="">Actualización</TableHead>
                <TableHead className=" text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVideos?.map((video) => (
                <TableRow key={video.id} className="group video-card" data-video-id={video.id}>
                  {/* Selection checkbox */}
                  {user?.role === "admin" && selectMode && (
                    <TableCell className="w-[40px]">
                      <div className={cn(
                        "p-1.5 rounded-md transition-colors", 
                        selectedVideos.includes(video.id) ? "bg-primary/20" : "bg-card hover:bg-muted"
                      )}>
                        <Checkbox 
                          checked={selectedVideos.includes(video.id)}
                          onCheckedChange={() => toggleSelectVideo(video.id)}
                          className="h-4 w-4 border-2 transition-all duration-200"
                          aria-label={`Seleccionar video ${video.title}`}
                        />
                      </div>
                    </TableCell>
                  )}
                  {/* Miniatura */}
                  <TableCell>
                    <div className="w-16 h-12 rounded overflow-hidden group-hover:ring-2 ring-primary/20 transition-all">
                      <ThumbnailPreview
                        src={video.thumbnailUrl}
                        alt={video.optimizedTitle ?? video.title}
                        aspectRatio="video"
                        enableZoom={true}
                        showPlaceholder={true}
                        className="h-full"
                        title={video.optimizedTitle ?? video.title}
                        showHoverActions={false}
                      />
                    </div>
                  </TableCell>
                  {/* Serie */}
                  <TableCell className="font-medium text-center">
                    {video.seriesNumber || "-"}
                  </TableCell>
                  {/* Título */}
                  <TableCell
                    className={cn("font-medium max-w-md", canSeeVideoDetails(video) ? "cursor-pointer hover:text-primary" : "")}
                    onClick={() => canSeeVideoDetails(video) && handleVideoClick(video)}
                  >
                    <div className="space-y-1">
                      <span className="text-base line-clamp-1">{video.optimizedTitle || video.title}</span>
                    </div>
                  </TableCell>
                  {/* Estado */}
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "capitalize text-xs",
                        getStatusBadgeColor(video.status)
                      )}
                    >
                      {getStatusLabel(user!.role, video)}
                    </Badge>
                  </TableCell>
                  {/* Contributors */}
                  <TableCell>
                    <UserBadges video={video} compact={true} />
                  </TableCell>
                  {/* Updated */}
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(video.updatedAt, false)}
                  </TableCell>
                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {canSeeVideoDetails(video) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleVideoClick(video)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Ver detalles</span>
                        </Button>
                      )}
                      {user?.role === "admin" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Eliminar</span>
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
                  </TableCell>
                </TableRow>
              ))}
              {(!videos || videos.length === 0) && (
                <TableRow>
                  <TableCell colSpan={8} className="h-64">
                    {renderEmptyState()}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}