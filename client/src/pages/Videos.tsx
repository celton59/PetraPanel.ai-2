import { VideoCard } from "@/components/VideoCard";
import { useVideos } from "@/hooks/use-videos";
import { Button } from "@/components/ui/button";
import { Eye, Trash2, Loader2, Plus, Filter, Layout, Grid, List, Image as ImageIcon } from "lucide-react";
import { NewVideoDialog } from "@/components/video/NewVideoDialog";
import { useUser } from "@/hooks/use-user";
import { SearchInput } from "@/components/video/SearchInput";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { VideoStatus } from "@/db/schema";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VideoOptimizer } from "@/components/video/VideoOptimizer";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

// Estados visibles por rol
const VISIBLE_STATES = {
  optimizer: ['pending', 'in_progress', 'optimize_review', 'title_corrections', 'en_revision'],
  youtuber: ['video_disponible', 'asignado', 'youtube_ready', 'completed'],
  reviewer: ['optimize_review', 'title_corrections', 'upload_review', 'completed', 'en_revision'],
  admin: ['pending', 'in_progress', 'optimize_review', 'title_corrections', 'upload_review', 'media_corrections', 'review', 'youtube_ready', 'completed', 'en_revision']
} as const;

const Videos = () => {
  const { videos, isLoading, deleteVideo, updateVideo } = useVideos();
  const { user, isLoading: isUserLoading } = useUser();
  const [updatingVideoId, setUpdatingVideoId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  const [newVideoDialogOpen, setNewVideoDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'list'>('table');
  const [location] = useLocation();

  // Estados para filtros
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Check URL parameters and open dialog if needed
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    if (params.get('new') === 'true') {
      setNewVideoDialogOpen(true);
    }
  }, [location]);

  const canViewVideo = (video: any) => {
    const userRole = user?.role as keyof typeof VISIBLE_STATES || 'viewer';
    const effectiveStatus = getEffectiveStatus(video, userRole, user);
    if (userRole === 'admin') return true;
    return VISIBLE_STATES[userRole]?.includes(effectiveStatus as any);
  };

  const filteredVideos = videos?.filter((video: any) => {
    if (!canViewVideo(video)) return false;

    const matchesSearch =
      searchTerm === "" ||
      video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (video.seriesNumber && video.seriesNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

  const selectedVideo = videos?.find(v => v.id === selectedVideoId);

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-card rounded-lg border border-dashed">
      <div className="rounded-full bg-primary/10 p-3 mb-4">
        <ImageIcon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-lg font-medium">No hay videos disponibles</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
        {user?.role === 'optimizer'
          ? "Los videos aparecerán aquí cuando haya contenido para optimizar"
          : "Comienza agregando tu primer video usando el botón superior"}
      </p>
      {user?.role !== 'optimizer' && (
        <Button
          onClick={() => setNewVideoDialogOpen(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo Video
        </Button>
      )}
    </div>
  );

  const renderThumbnail = (video: any, className?: string) => (
    video.thumbnailUrl ? (
      <img
        src={video.thumbnailUrl}
        alt={video.title}
        className={cn("w-full h-full object-cover", className)}
      />
    ) : (
      <div className={cn("w-full h-full flex items-center justify-center bg-muted text-muted-foreground", className)}>
        <Layout className="h-4 w-4" />
      </div>
    )
  );

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

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const handleDelete = async (videoId: number) => {
    try {
      await deleteVideo(videoId);
      toast.success("Video eliminado correctamente");
    } catch (error) {
      console.error("Error deleting video:", error);
      toast.error("Error al eliminar el video");
    }
  };

  const handleVideoClick = async (video: any) => {
    const userRole = user?.role || 'viewer';

    if ((userRole === 'optimizer' || userRole === 'admin') && video.status === 'pending') {
      setUpdatingVideoId(video.id);
      try {
        await updateVideo({
          videoId: video.id,
          data: {
            status: 'in_progress',
            currentReviewerId: user?.id,
            metadata: {
              ...video.metadata,
              optimization: {
                ...video.metadata?.optimization,
                assignedTo: {
                  userId: user?.id,
                  username: user?.username || '',
                  assignedAt: new Date().toISOString()
                }
              }
            }
          },
          currentRole: userRole
        });
        setSelectedVideoId(video.id);
        setDialogOpen(true);
      } catch (error) {
        console.error('Error al actualizar el video:', error);
        toast.error("Error al actualizar el estado del video");
      } finally {
        setUpdatingVideoId(null);
      }
    } else {
      setSelectedVideoId(video.id);
      setDialogOpen(true);
    }
  };


  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredVideos?.map((video: any) => (
        <div key={video.id}
          className="group relative bg-card rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-border hover:border-primary/20"
          onClick={() => handleVideoClick(video)}
        >
          <div className="aspect-video bg-muted relative">
            {renderThumbnail(video)}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Eye className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="p-4">
            <div className="mb-2">
              <Badge variant="secondary" className={cn("text-xs", getStatusBadge(getEffectiveStatus(video, user?.role, user) as VideoStatus))}>
                {getStatusLabel(getEffectiveStatus(video, user?.role, user) as VideoStatus, user?.role)}
              </Badge>
            </div>
            <h3 className="font-medium text-sm mb-1 truncate">
              {video.optimizedTitle || video.title}
            </h3>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{video.seriesNumber || 'Sin serie'}</span>
              <span>{new Date(video.updatedAt || video.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      ))}
      {(!filteredVideos || filteredVideos.length === 0) && renderEmptyState()}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-4">
      {filteredVideos?.map((video: any) => (
        <div key={video.id}
          className="flex items-center gap-4 p-4 bg-card rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-border hover:border-primary/20 cursor-pointer"
          onClick={() => handleVideoClick(video)}
        >
          <div className="w-24 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
            {renderThumbnail(video)}
          </div>
          <div className="flex-grow min-w-0">
            <h3 className="font-medium mb-1 truncate">
              {video.optimizedTitle || video.title}
            </h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={cn("text-xs", getStatusBadge(getEffectiveStatus(video, user?.role, user) as VideoStatus))}>
                {getStatusLabel(getEffectiveStatus(video, user?.role, user) as VideoStatus, user?.role)}
              </Badge>
              <span className="text-sm text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">{video.seriesNumber || 'Sin serie'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {new Date(video.updatedAt || video.createdAt).toLocaleDateString()}
            </span>
            {user?.role === 'admin' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Se eliminará permanentemente el video
                      <span className="font-medium"> {video.title}</span>.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(video.id)}
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
      {(!filteredVideos || filteredVideos.length === 0) && renderEmptyState()}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-[1200px] px-4 py-8">
        <div className="flex flex-col gap-2 mb-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Videos
              </h1>
              <p className="text-muted-foreground text-lg mt-2">
                Gestiona y optimiza tus videos para YouTube
              </p>
            </div>
            {user?.role !== 'optimizer' && (
              <NewVideoDialog
                open={newVideoDialogOpen}
                onOpenChange={setNewVideoDialogOpen}
              />
            )}
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <SearchInput
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={showFilters ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className="h-9 w-9"
              >
                <Filter className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('table')}
                className="h-9 w-9"
              >
                <Layout className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
                className="h-9 w-9"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
                className="h-9 w-9"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {/* {showFilters && (
            <div className="mt-4 grid gap-4 p-4 border rounded-lg bg-card md:grid-cols-4">
              <StatusFilter status={status} onStatusChange={setStatus} />
              <AssigneeFilter
                assignedTo={assignedTo}
                onAssignedToChange={onAssignedToChange}
              />
              <ProjectFilter
                projectId={projectId}
                onProjectChange={onProjectChange}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "LLL dd, y", { locale: es })} -{" "}
                          {format(date.to, "LLL dd, y", { locale: es })}
                        </>
                      ) : (
                        format(date.from, "LLL dd, y", { locale: es })
                      )
                    ) : (
                      <span>Seleccionar fechas</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={onDateChange}
                    numberOfMonths={2}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )} */}
          <div className="rounded-lg">
            {viewMode === 'table' ? (
              <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="w-[100px]">Miniatura</TableHead>
                        <TableHead className="w-[100px]">Serie</TableHead>
                        <TableHead className="min-w-[300px]">Título</TableHead>
                        <TableHead className="w-[150px]">Estado</TableHead>
                        <TableHead className="w-[150px]">Asignado a</TableHead>
                        <TableHead className="w-[150px]">Actualización</TableHead>
                        <TableHead className="w-[100px] text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVideos?.map((video: any) => (
                        <TableRow key={video.id} className="group">
                          <TableCell>
                            <div className="w-16 h-12 bg-muted rounded overflow-hidden group-hover:ring-2 ring-primary/20 transition-all">
                              {renderThumbnail(video, "w-full h-full object-cover")}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {getEffectiveAssignment(video, user?.role, user)?.name === 'No disponible' ?
                              '(No disponible)' :
                              (video.seriesNumber || '-')}
                          </TableCell>
                          <TableCell className="font-medium max-w-[300px] truncate">
                            {getEffectiveAssignment(video, user?.role, user)?.name === 'No disponible' ?
                              '(No disponible)' :
                              (video.optimizedTitle || video.title)}
                          </TableCell>
                          <TableCell>
                            {getEffectiveAssignment(video, user?.role, user)?.name === 'No disponible' ?
                              <Badge variant="secondary" className="bg-gray-500/20 text-gray-600">No disponible</Badge> :
                              <Badge variant="secondary" className={cn(getStatusBadge(getEffectiveStatus(video, user?.role, user) as VideoStatus))}>
                                {getStatusLabel(getEffectiveStatus(video, user?.role, user) as VideoStatus, user?.role)}
                              </Badge>
                            }
                          </TableCell>
                          <TableCell>
                            {getEffectiveAssignment(video, user?.role, user)?.name || 'Sin asignar'}
                          </TableCell>
                          <TableCell>
                            {getEffectiveAssignment(video, user?.role, user)?.name === 'No disponible' ?
                              '-' :
                              new Date(video.updatedAt || video.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={updatingVideoId === video.id}
                                onClick={() => handleVideoClick(video)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                {updatingVideoId === video.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                              {user?.role === 'admin' && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Esta acción no se puede deshacer. Se eliminará permanentemente el video
                                        <span className="font-medium"> {video.title}</span>.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(video.id)}
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
                      {(!filteredVideos || filteredVideos.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={7}>
                            {renderEmptyState()}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              renderGridView()
            ) : (
              renderListView()
            )}
          </div>

          {selectedVideo && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] p-0">
                <DialogHeader className="p-6 pb-0">
                  <DialogTitle>Detalles del Video</DialogTitle>
                </DialogHeader>
                <div className="px-6 pb-6">
                  {(selectedVideo.status === 'in_progress' ||
                    selectedVideo.status === 'title_corrections' ||
                    selectedVideo.metadata?.customStatus === 'en_revision') &&
                    user?.role === 'optimizer' ? (
                    <VideoOptimizer
                      video={selectedVideo}
                      onUpdate={(videoId, data) => updateVideo({
                        videoId,
                        data,
                        currentRole: user?.role || 'viewer'
                      })}
                    />
                  ) : (
                    <VideoCard
                      video={selectedVideo}
                      userRole={user?.role || 'viewer'}
                      onUpdate={(videoId, data) => updateVideo({
                        videoId,
                        data,
                        currentRole: user?.role || 'viewer'
                      })}
                    />
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );
};

const getStatusBadge = (status: VideoStatus) => {
  const styles = {
    pending: "bg-yellow-500/20 text-yellow-600",
    in_progress: "bg-blue-500/20 text-blue-600",
    title_corrections: "bg-red-500/20 text-red-600",
    optimize_review: "bg-pink-500/20 text-pink-600",
    upload_review: "bg-purple-500/20 text-purple-600",
    youtube_ready: "bg-green-500/20 text-green-600",
    review: "bg-indigo-500/20 text-indigo-600",
    media_corrections: "bg-red-500/20 text-red-600",
    completed: "bg-emerald-500/20 text-emerald-600"
  };
  return styles[status] || "bg-gray-500/20 text-gray-600";
};

const getEffectiveStatus = (video: any, userRole?: string, currentUser?: any) => {
  if (video.metadata?.customStatus) {
    return video.metadata.customStatus;
  }

  switch (userRole) {
    case 'youtuber':
      if (video.status === 'upload_review') {
        if (video.currentReviewerId === currentUser?.id) {
          return 'asignado';
        }
        return 'video_disponible';
      }
      break;

    case 'reviewer':
      if (video.status === 'upload_review') {
        return 'video_disponible';
      }
      break;

    case 'optimizer':
      if (video.status === 'pending') {
        return 'disponible';
      }
      break;
  }

  return video.status;
};

const getEffectiveAssignment = (video: any, userRole?: string, currentUser?: any) => {
  if (userRole === 'reviewer' && video.status === 'upload_review') {
    return {
      name: 'Disponible',
      id: null
    };
  }

  if (userRole === 'youtuber' && video.status === 'upload_review') {
    if (video.currentReviewerId === currentUser?.id) {
      return {
        name: currentUser?.username || 'Tú',
        id: video.currentReviewerId
      };
    }
    if (video.currentReviewerId) {
      return {
        name: 'No disponible',
        id: video.currentReviewerId
      };
    }
    return {
      name: 'Disponible',
      id: null
    };
  }

  if (userRole === 'optimizer' &&
    video.metadata?.secondaryStatus?.type === 'title_approved' &&
    video.metadata?.optimization?.reviewedBy?.approved &&
    video.metadata?.optimization?.optimizedBy) {
    return {
      name: video.metadata.optimization.optimizedBy.username,
      id: video.metadata.optimization.optimizedBy.userId
    };
  }

  return {
    name: video.reviewerName || video.reviewerUsername,
    id: video.currentReviewerId
  };
};

const ALLOWED_TRANSITIONS = {
  optimizer: {
    pending: ['in_progress'],
    in_progress: ['optimize_review'],
    title_corrections: ['optimize_review'],
    en_revision: ['optimize_review']
  },
  youtuber: {
    youtube_ready: ['completed']
  },
  reviewer: {
    optimize_review: ['title_corrections', 'upload_review'],
    upload_review: ['optimize_review'],
    review: [],
    media_corrections: ["upload_review"],
    title_corrections: [],
    pending: [],
    in_progress: [],
    completed: [],
    en_revision: ['optimize_review', 'title_corrections', 'media_corrections']
  },
  admin: {
    pending: ['in_progress', 'optimize_review', 'title_corrections', 'upload_review', 'media_corrections', 'review', 'youtube_ready', 'completed', 'en_revision'],
    in_progress: ['optimize_review', 'title_corrections', 'upload_review', 'media_corrections', 'review', 'youtube_ready', 'completed', 'en_revision'],
    optimize_review: ['title_corrections', 'upload_review', 'media_corrections', 'review', 'youtube_ready', 'completed', 'en_revision'],
    title_corrections: ['optimize_review', 'upload_review', 'media_corrections', 'review', 'youtube_ready', 'completed', 'en_revision'],
    upload_review: ['media_corrections', 'review', 'youtube_ready', 'completed', 'en_revision'],
    media_corrections: ['upload_review', 'review', 'youtube_ready', 'completed', 'en_revision'],
    review: ['youtube_ready', 'title_corrections', 'media_corrections', 'completed', 'en_revision'],
    youtube_ready: ['completed'],
    completed: [],
    en_revision: ['optimize_review', 'title_corrections', 'media_corrections', 'review', 'youtube_ready', 'completed']
  }
} as const;

export default Videos;