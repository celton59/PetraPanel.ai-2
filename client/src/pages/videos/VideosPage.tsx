import { VideoDetailDialog } from "./VideoDetailDialog";
import { ApiVideo, useVideos } from "@/hooks/useVideos";
import { Button } from "@/components/ui/button";
import { UserBadges } from "@/components/video/UserBadges";
import { ImagePreview } from "@/components/ui/image-preview";
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
import { cn, formatDate } from "@/lib/utils";
import { User, VideoStatus } from "@db/schema";

// Estados visibles por rol
const VISIBLE_STATES = {
  optimizer: [
    "pending",
    "in_progress",
    "optimize_review",
    "title_corrections",
    "en_revision",
  ],
  youtuber: ["video_disponible", "asignado", "youtube_ready", "completed"],
  reviewer: [
    "optimize_review",
    "title_corrections",
    "upload_review",
    "completed",
    "en_revision",
  ],
  admin: [
    "pending",
    "in_progress",
    "optimize_review",
    "title_corrections",
    "upload_review",
    "media_corrections",
    "review",
    "youtube_ready",
    "completed",
    "en_revision",
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
      <div>
        {/* Vista de tabla para escritorio */}
        <div className="hidden md:block rounded-lg border bg-card shadow-sm overflow-hidden relative">
          {/* Accent gradient para la tabla de videos */}
          <div className="h-1 w-full bg-gradient-to-r from-indigo-600 via-primary to-violet-500 absolute top-0 left-0"></div>
          <div className="overflow-x-auto pt-1">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
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
                <TableRow key={video.id} className="group">
                  {/* Miniatura */}
                  <TableCell>
                    <div className="w-16 h-12 bg-muted rounded overflow-hidden group-hover:ring-2 ring-primary/20 transition-all">
                      {video.thumbnailUrl ? (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.optimizedTitle ?? video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                          <Layout className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {video.seriesNumber ?? "-"}
                  </TableCell>
                  <TableCell className="font-medium max-w-[300px] truncate">
                    {video.optimizedTitle ?? video.title}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn(getStatusBadgeColor(video.status))}
                    >
                      {getStatusLabel(user!.role, video)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <UserBadges video={video} compact />
                  </TableCell>
                  <TableCell>
                    {video.updatedAt
                      ? new Date(video.updatedAt).toLocaleDateString()
                      : ""}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {canSeeVideoDetails(video) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={updatingVideoId === video.id}
                          onClick={() => handleVideoClick(video)}
                          className="transition-colors"
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
                              className="text-destructive transition-colors"
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

      {/* Vista móvil optimizada: tarjetas con deslizamiento */}
      <div className="md:hidden space-y-4">
        {filteredVideos?.map((video) => (
          <div
            key={video.id}
            className="bg-card rounded-lg border shadow-sm overflow-hidden"
            onClick={() => handleVideoClick(video)}
          >
            <div className="flex items-start relative">
              {/* Barra lateral de color según estado */}
              <div className={cn(
                "absolute left-0 top-0 bottom-0 w-1.5",
                video.status === "available" ? "bg-indigo-500" :
                video.status === "content_corrections" ? "bg-orange-500" :
                video.status === "content_review" ? "bg-sky-500" :
                video.status === "upload_media" ? "bg-amber-500" :
                video.status === "media_corrections" ? "bg-pink-500" :
                video.status === "media_review" ? "bg-violet-500" :
                video.status === "final_review" ? "bg-teal-500" :
                video.status === "completed" ? "bg-emerald-500" : "bg-gray-500"
              )} />
              
              {/* Información principal */}
              <div className="flex-1 p-3 pl-4">
                {/* Encabezado con miniatura y estado */}
                <div className="flex justify-between items-start gap-3 mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm line-clamp-2">
                      {video.optimizedTitle || video.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                        {video.seriesNumber || "Sin serie"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {video.updatedAt ? new Date(video.updatedAt).toLocaleDateString() : (video.createdAt ? new Date(video.createdAt).toLocaleDateString() : '')}
                      </span>
                    </div>
                  </div>
                  <div className="h-14 w-20 flex-shrink-0 bg-muted rounded overflow-hidden">
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover object-center"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Layout className="h-4 w-4 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Pie con estado y colaboradores */}
                <div className="flex flex-wrap justify-between items-center mt-2">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs capitalize mb-1",
                      getStatusBadgeColor(video.status)
                    )}
                  >
                    {getStatusLabel(user!.role, video)}
                  </Badge>
                  <div className="mt-1">
                    <UserBadges video={video} compact />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Acciones con botones más grandes para móvil */}
            <div className="flex border-t px-3 py-2 bg-muted/20">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground flex-1 h-8"
                onClick={(e) => {
                  e.stopPropagation();
                  handleVideoClick(video);
                }}
              >
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                Ver
              </Button>
              {user?.role === "admin" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive flex-1 h-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Eliminar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        ¿Eliminar este video?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer.
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
      </div>
    );
  }

  function getGridView() {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos?.map((video) => (
          <div
            key={video.id}
            className="group relative bg-card rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-border hover:border-primary/20"
          >
            {/* Gradient accent en tarjetas grid */}
            <div className="h-1 w-full bg-gradient-to-r from-indigo-600 via-primary to-violet-500 absolute top-0 left-0 z-10"></div>
            <div 
              className="relative" 
              onClick={() => handleVideoClick(video)}
            >
              <ImagePreview
                src={video.thumbnailUrl}
                alt={video.title}
                aspectRatio="video"
                enableZoom={false}
                showPlaceholder={true}
                className="cursor-pointer"
              />
              <div
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              >
                <Eye className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="p-4">
              <div className="mb-2 flex justify-between items-center">
                <Badge
                  variant="secondary"
                  className={cn("text-xs", getStatusBadgeColor(video.status))}
                >
                  {getStatusLabel(user!.role, video)}
                </Badge>
                {user?.role === "admin" && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive transition-colors"
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
              <h3 className="font-medium text-sm mb-1 truncate">
                {video.optimizedTitle || video.title}
              </h3>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{video.seriesNumber || "Sin serie"}</span>
                <span>
                  {video.updatedAt &&
                    new Date(video.updatedAt).toLocaleDateString()}
                  {!video.updatedAt &&
                    video.createdAt &&
                    new Date(video.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="mt-2">
                <UserBadges video={video} compact />
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
            className="flex items-center gap-4 p-4 bg-card rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-border hover:border-primary/20 cursor-pointer relative overflow-hidden"
            onClick={() => handleVideoClick(video)}
          >
            {/* Gradient accent en tarjetas list */}
            <div className="h-full w-1 bg-gradient-to-b from-indigo-600 via-primary to-violet-500 absolute top-0 left-0"></div>
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
              <div className="mt-2">
                <UserBadges video={video} />
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
      <div className="flex flex-col gap-2 mb-12">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Videos
              </span>
            </h1>
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
