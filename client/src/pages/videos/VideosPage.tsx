import { VideoDetailDialog } from "./VideoDetailDialog";
import { ApiVideo, useVideos } from "@/hooks/useVideos";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Trash2,
  Loader2,
  Plus,
  Filter,
  Layout,
  Grid,
  List,
  Image as ImageIcon,
} from "lucide-react";
import { NewVideoDialog } from "./NewVideoDialog";
import { useUser } from "@/hooks/use-user";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { VideoFilters } from "./VideoFilters";
import type { DateRange } from "react-day-picker";
import { getStatusBadgeColor, getStatusLabel } from "@/lib/status-labels";
import { cn } from "@/lib/utils";
import { User, VideoStatus } from "@db/schema";

// Estados visibles por rol
const VISIBLE_STATES = {
  optimizer: [
    "available",
    "content_corrections", 
  ],
  youtuber: ["upload_media", "media_corrections", "completed"],
  reviewer: [
    "content_review",
    "media_review",
    "final_review",
    "completed",
  ],
  content_reviewer: [
    "content_review", 
    "completed"
  ],
  media_reviewer: [
    "media_review",
    "completed",
  ],
  admin: [
    "available",
    "content_corrections",
    "content_review",
    "upload_media",
    "media_corrections",
    "media_review",
    "final_review",
    "completed",
  ],
} as const;

const DETAILS_PERMISSION: Record<User["role"], VideoStatus[]> = {
  admin: [],
  optimizer: ["available", "content_corrections"],
  reviewer: ["content_review", "media_review"],
  content_reviewer: ['content_review'],
  media_reviewer: ['media_review'],
  youtuber: ["upload_media", "media_corrections"],
};

export default function VideosPage() {
  const { user, isLoading: isUserLoading } = useUser();

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center bg-background w-full">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  const { videos, isLoading, deleteVideo, updateVideo } = useVideos();
  const [updatingVideoId, setUpdatingVideoId] = useState<number | undefined>(
    undefined,
  );
  const [newVideoDialogOpen, setNewVideoDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<ApiVideo | undefined>(
    undefined,
  );
  const [viewMode, setViewMode] = useState<"table" | "grid" | "list">("table");

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("new") === "true") {
      setNewVideoDialogOpen(true);
      window.history.replaceState({}, "", "/videos");
    }
  }, []);

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [status, setStatus] = useState("all");
  const [assignedTo, setAssignedTo] = useState("all");
  const [projectId, setProjectId] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  if (!user) return null;

  function canSeeVideoDetails(video: ApiVideo): boolean {
    if (user?.role === "admin") return true;

    return DETAILS_PERMISSION[user!.role].includes(video.status);
  }

  async function handleVideoClick(video: ApiVideo) {
    setSelectedVideo(video);
  }

  function renderEmptyState() {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-card rounded-lg border border-dashed">
        <div className="rounded-full bg-primary/10 p-3 mb-4">
          <ImageIcon className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-lg font-medium">No hay videos disponibles</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
          {user?.role === "optimizer"
            ? "Los videos aparecerán aquí cuando haya contenido para optimizar"
            : "Comienza agregando tu primer video usando el botón superior"}
        </p>
        {user?.role === "admin" && (
          <Button onClick={() => setNewVideoDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Video
          </Button>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Cargando videos...</p>
        </div>
      </div>
    );
  }

  const filteredVideos = videos.filter((video) => {
    if (searchTerm) {
      return (
        video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.optimizedTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (video.seriesNumber && video.seriesNumber.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
        (video.description && video.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (video.creatorName && video.creatorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (video.optimizerName && video.optimizerName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // if (status !== "all") {
    //   return video.status === status;
    // }

    // if (assignedTo !== "all") {
    //   return video.assigned_to === assignedTo;
    // }

    // if (projectId !== "all") {
    //   return video.project_id === projectId;
    // }

    // if (dateRange) {
    //   return (
    //     video.created_at >= dateRange.startDate &&
    //     video.created_at <= dateRange.endDate
    //   );
    // }

    return true;
  })

  function getTableView() {
    return (
      <div className="rounded-xl border border-muted/60 bg-gradient-to-br from-background to-primary/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-muted/30">
                <TableHead className="text-foreground/70 font-medium">Miniatura</TableHead>
                <TableHead className="text-foreground/70 font-medium">Serie</TableHead>
                <TableHead className="text-foreground/70 font-medium">Título</TableHead>
                <TableHead className="text-foreground/70 font-medium">Estado</TableHead>
                <TableHead className="text-foreground/70 font-medium">Creador</TableHead>
                <TableHead className="text-foreground/70 font-medium">Optimizador</TableHead>
                <TableHead className="text-foreground/70 font-medium">Revisor Cont.</TableHead>
                <TableHead className="text-foreground/70 font-medium">Uploader</TableHead>
                <TableHead className="text-foreground/70 font-medium">Revisor Media</TableHead>
                <TableHead className="text-foreground/70 font-medium">Actualización</TableHead>
                <TableHead className="text-foreground/70 font-medium text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVideos?.map((video) => (
                <TableRow 
                  key={video.id} 
                  className="group hover:bg-primary/5 cursor-pointer transition-colors"
                  onClick={() => canSeeVideoDetails(video) && handleVideoClick(video)}
                >
                  {/* Miniatura */}
                  <TableCell>
                    <div className="w-16 h-12 rounded-md overflow-hidden group-hover:shadow-md transition-all border border-muted/40 group-hover:border-primary/40">
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.optimizedTitle ?? video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted/30 text-muted-foreground">
                          <Layout className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {video.seriesNumber ? (
                      <span className="px-2 py-1 bg-primary/10 text-primary text-sm font-medium rounded-md">
                        {video.seriesNumber}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium max-w-[300px]">
                    <div className="truncate">
                      {video.optimizedTitle ?? video.title}
                    </div>
                    {video.description && (
                      <div className="text-xs text-muted-foreground truncate mt-1">
                        {video.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn("transition-all", getStatusBadgeColor(video.status))}
                    >
                      {getStatusLabel(user!.role, video)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {video.creatorName ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{video.creatorName}</span>
                        <span className="text-xs text-muted-foreground">{video.creatorUsername}</span>
                      </div>
                    ) : (
                      video.creatorUsername
                    )}
                  </TableCell>
                  <TableCell>
                    {video.optimizerName ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{video.optimizerName}</span>
                        <span className="text-xs text-muted-foreground">{video.optimizerUsername}</span>
                      </div>
                    ) : (
                      video.optimizerUsername
                    )}
                  </TableCell>
                  <TableCell>
                    {video.contentReviewerName ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{video.contentReviewerName}</span>
                        <span className="text-xs text-muted-foreground">{video.contentReviewerUsername}</span>
                      </div>
                    ) : (
                      video.contentReviewerUsername
                    )}
                  </TableCell>
                  <TableCell>
                    {video.uploaderName ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{video.uploaderName}</span>
                        <span className="text-xs text-muted-foreground">{video.uploaderUsername}</span>
                      </div>
                    ) : (
                      video.uploaderUsername
                    )}
                  </TableCell>
                  <TableCell>
                    {video.mediaReviewerName ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{video.mediaReviewerName}</span>
                        <span className="text-xs text-muted-foreground">{video.mediaReviewerUsername}</span>
                      </div>
                    ) : (
                      video.mediaReviewerUsername
                    )}
                  </TableCell>
                  <TableCell>
                    {video.updatedAt && (
                      <div className="flex flex-col">
                        <span className="text-sm">{new Date(video.updatedAt).toLocaleDateString()}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(video.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                      {canSeeVideoDetails(video) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={updatingVideoId === video.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVideoClick(video);
                          }}
                          className="transition-colors hover:bg-primary/10 hover:text-primary"
                        >
                          {updatingVideoId === video.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      {user?.role === "admin" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive transition-colors hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                ¿Estás seguro?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará
                                permanentemente el video
                                <span className="font-medium">
                                  {" "}
                                  {video.title}
                                </span>
                                .
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  deleteVideo({
                                    videoId: video.id,
                                    projectId: video.projectId,
                                  })
                                }
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
                  <TableCell colSpan={12}>{renderEmptyState()}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  function getGridView() {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos?.map((video) => (
          <div
            key={video.id}
            className="group relative rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-muted/60 bg-gradient-to-br from-background to-primary/5 hover:border-primary/30"
            onClick={() => canSeeVideoDetails(video) && handleVideoClick(video)}
          >
            <div className="aspect-video relative">
              {video.thumbnailUrl ? (
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted/30 text-muted-foreground">
                  <Layout className="h-12 w-12 opacity-50" />
                </div>
              )}
              {canSeeVideoDetails(video) && (
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                >
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <Badge
                      variant="secondary"
                      className={cn("text-xs backdrop-blur-sm bg-black/40 border border-white/20", getStatusBadgeColor(video.status))}
                    >
                      {getStatusLabel(user!.role, video)}
                    </Badge>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-8 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVideoClick(video);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" /> Ver detalles
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Series number badge */}
              {video.seriesNumber && (
                <div className="absolute top-3 left-3">
                  <div className="px-2 py-1 rounded-md text-xs font-medium bg-primary/90 text-primary-foreground backdrop-blur-sm">
                    Serie #{video.seriesNumber}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Badge
                  variant="secondary"
                  className={cn("text-xs", getStatusBadgeColor(video.status))}
                >
                  {getStatusLabel(user!.role, video)}
                </Badge>
                
                <div className="flex items-center space-x-1">
                  {video.updatedAt && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(video.updatedAt).toLocaleDateString()}
                    </span>
                  )}
                  
                  {user?.role === "admin" && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive transition-colors hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará
                            permanentemente el video
                            <span className="font-medium"> {video.title}</span>.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              deleteVideo({
                                videoId: video.id,
                                projectId: video.projectId,
                              })
                            }
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
              
              <h3 className="font-medium text-base mb-2 line-clamp-2">
                {video.optimizedTitle || video.title}
              </h3>
              
              {video.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {video.description}
                </p>
              )}
              
              <div className="grid grid-cols-2 gap-3 text-xs mt-3 pt-3 border-t border-muted/40">
                <div className="space-y-1">
                  <p className="text-muted-foreground font-medium">Creador</p>
                  <p className="font-medium">{video.creatorName || video.creatorUsername}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-muted-foreground font-medium">Optimizador</p>
                  <p className="font-medium">{video.optimizerName || video.optimizerUsername}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-muted-foreground font-medium">Rev. Contenido</p>
                  <p className="font-medium">{video.contentReviewerName || video.contentReviewerUsername}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-muted-foreground font-medium">Rev. Media</p>
                  <p className="font-medium">{video.mediaReviewerName || video.mediaReviewerUsername}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
        {(!videos || videos.length === 0) && renderEmptyState()}
      </div>
    );
  }

  function getListView() {
    return (
      <div className="space-y-4">
        {videos?.map((video: any) => (
          <div
            key={video.id}
            className="flex items-center gap-4 p-4 bg-card rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-border hover:border-primary/20 cursor-pointer"
            onClick={() => handleVideoClick(video)}
          >
            <div className="w-24 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
              {video.thumbnailUrl ? (
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                  <Layout className="h-4 w-4" />
                </div>
              )}
            </div>
            <div className="flex-grow min-w-0">
              <h3 className="font-medium mb-1 truncate">
                {video.optimizedTitle || video.title}
              </h3>
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={cn("text-xs", getStatusBadgeColor(video.status))}
                >
                  {getStatusLabel(user!.role, video)}
                </Badge>
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">
                  {video.seriesNumber || "Sin serie"}
                </span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                <strong>Creador: </strong>
                {video.creatorName
                  ? `${video.creatorName} (${video.creatorUsername})`
                  : video.creatorUsername}
              </div>
              <div className="text-sm text-muted-foreground">
                <strong>Optimizador: </strong>
                {video.optimizerName
                  ? `${video.optimizerName} (${video.optimizerUsername})`
                  : video.optimizerUsername}
              </div>
              <div className="text-sm text-muted-foreground">
                <strong>Revisor Cont.: </strong>
                {video.contentReviewerName
                  ? `${video.contentReviewerName} (${video.contentReviewerUsername})`
                  : video.contentReviewerUsername}
              </div>
              <div className="text-sm text-muted-foreground">
                <strong>Revisor Media: </strong>
                {video.mediaReviewerName
                  ? `${video.mediaReviewerName} (${video.mediaReviewerUsername})`
                  : video.mediaReviewerUsername}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {new Date(
                  video.updatedAt || video.createdAt,
                ).toLocaleDateString()}
              </span>
              {user?.role === "admin" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará
                        permanentemente el video
                        <span className="font-medium"> {video.title}</span>.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() =>
                          deleteVideo({
                            videoId: video.id,
                            projectId: video.projectId,
                          })
                        }
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
        ))}
        {(!videos || videos.length === 0) && renderEmptyState()}
      </div>
    );
  }

  function getVideoDialog() {
    return (
      <Dialog
        open={Boolean(selectedVideo)}
        onOpenChange={() => setSelectedVideo(undefined)}
      >
        <VideoDetailDialog
          video={selectedVideo!}
          onUpdate={async (data, keepDialog) => {
            setUpdatingVideoId(selectedVideo!.id);
            try {
              await updateVideo({
                videoId: selectedVideo!.id,
                projectId: selectedVideo!.projectId,
                updateRequest: data,
              });
              if (!keepDialog) {
                setUpdatingVideoId(undefined);
                setSelectedVideo(undefined);                
              }              
                            
            } catch (err) {
              console.log(err);
              toast.error("Error al actualizar el video");
            }
          }}
        />
      </Dialog>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col gap-2 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-gradient-to-br from-background to-primary/5 p-6 rounded-xl border border-muted/60 shadow-sm mb-6">
          <div className="space-y-3">
            <div className="relative">
              <h1 className="text-3xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  Videos
                </span>
              </h1>
              <div className="absolute -bottom-1 left-0 h-1 w-20 bg-gradient-to-r from-primary/50 to-transparent rounded-full"></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="h-8 w-1 bg-gradient-to-b from-blue-600 via-purple-600 to-pink-600 rounded-full" />
              <p className="text-lg text-muted-foreground font-medium tracking-tight">
                Gestiona y optimiza tus videos para YouTube
              </p>
            </div>
          </div>
          {user?.role === "admin" && (
            <NewVideoDialog
              open={newVideoDialogOpen}
              onOpenChange={setNewVideoDialogOpen}
            />
          )}
        </div>
      </div>

      <div className="mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <VideoFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            status={status}
            onStatusChange={setStatus}
            date={dateRange}
            onDateChange={setDateRange}
            assignedTo={assignedTo}
            onAssignedToChange={setAssignedTo}
            projectId={projectId}
            onProjectChange={setProjectId}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(!showFilters)}
            visibleStates={
              VISIBLE_STATES[user?.role as keyof typeof VISIBLE_STATES] || []
            }
          />
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant={showFilters ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className="h-9 w-9"
            >
              <Filter className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("table")}
              className="h-9 w-9"
            >
              <Layout className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className="h-9 w-9"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
              className="h-9 w-9"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg">
        {viewMode === "table"
          ? getTableView()
          : viewMode === "grid"
            ? getGridView()
            : getListView()}
      </div>

      {selectedVideo && getVideoDialog()}
    </div>
  );
}
