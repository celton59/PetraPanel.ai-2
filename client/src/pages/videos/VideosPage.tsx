import { VideoCard } from "./VideoCard";
import { useVideos } from "@/hooks/useVideos";
import { Button } from "@/components/ui/button";
import { Eye, Trash2, Loader2, Plus, Filter, Layout, Grid, List, Image as ImageIcon } from "lucide-react";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { VideoFilters } from "./VideoFilters";
import type { DateRange } from "react-day-picker";
import { getStatusLabel, getStatusLabelNew } from '@/lib/status-labels';
import { cn } from "@/lib/utils";
import type { User, VideoStatus, Video } from "@db/schema";

// Estados visibles por rol
const VISIBLE_STATES = {
  optimizer: ['pending', 'in_progress', 'optimize_review', 'title_corrections', 'en_revision'],
  youtuber: ['video_disponible', 'asignado', 'youtube_ready', 'completed'],
  reviewer: ['optimize_review', 'title_corrections', 'upload_review', 'completed', 'en_revision'],
  admin: ['pending', 'in_progress', 'optimize_review', 'title_corrections', 'upload_review', 'media_corrections', 'review', 'youtube_ready', 'completed', 'en_revision']
} as const;

export default function VideosPage () {
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
  const [updatingVideoId, setUpdatingVideoId] = useState<number | undefined>(undefined);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  const [newVideoDialogOpen, setNewVideoDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'list'>('table');

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('new') === 'true') {
      setNewVideoDialogOpen(true);
      window.history.replaceState({}, '', '/videos');
    }
  }, []);

  // Estados para filtros
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("all");
  const [assignedTo, setAssignedTo] = useState("all");
  const [projectId, setProjectId] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);


  

  if (!user) return null;

  async function handleDeleteVideo (videoId: number, projectId: number) {
    try {
      await deleteVideo({ videoId, projectId });
      toast.success("Video eliminado correctamente");
    } catch (error) {
      console.error("Error deleting video:", error);
      toast.error("Error al eliminar el video");
    }
  }

  async function handleVideoClick (video: Video) {

    setSelectedVideoId(video.id);
    setVideoDialogOpen(true);

    // if ((userRole === 'optimizer' || userRole === 'admin') && video.status === 'pending') {
    //   setUpdatingVideoId(video.id);
    //   try {
    //     await updateVideo({
    //       videoId: video.id,
    //       projectId: video.projectId,
    //       updateRequest: {
    //         status: 'in_progress',
    //       }
    //     });
    //     setSelectedVideoId(video.id);
    //     setDialogOpen(true);
    //   } catch (error) {
    //     console.error('Error al actualizar el video:', error);
    //     toast.error("Error al actualizar el estado del video");
    //   } finally {
    //     setUpdatingVideoId(undefined);
    //   }
    // } else {
    //   setSelectedVideoId(video.id);
    //   setDialogOpen(true);
    // }
  };

  const selectedVideo = videos?.find(v => v.id === selectedVideoId);

  function renderEmptyState () { 
    return <div className="flex flex-col items-center justify-center p-8 text-center bg-card rounded-lg border border-dashed">
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

  function getTableView () {
    return <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="">Miniatura</TableHead>
              <TableHead className="">Serie</TableHead>
              <TableHead className="">Título</TableHead>
              <TableHead className="">Estado</TableHead>
              <TableHead className="">Creador</TableHead>
              <TableHead className="">Optimizador</TableHead>
              <TableHead className="">Revisor</TableHead>
              <TableHead className="">Actualización</TableHead>
              <TableHead className=" text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {videos?.map( video => (
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
                  { video.seriesNumber ?? '-'}
                </TableCell>
                <TableCell className="font-medium max-w-[300px] truncate">
                  { video.optimizedTitle ?? video.title }
                </TableCell>
                <TableCell>
                  {getEffectiveAssignment(video, user?.role, user)?.name === 'No disponible' ? 
                    <Badge variant="secondary" className="bg-gray-500/20 text-gray-600">No disponible</Badge> :
                    <Badge variant="secondary" className={cn(getStatusBadge(getEffectiveStatus(video, user?.role, user) as VideoStatus))}>
                      {getStatusLabelNew(user!.role, video)}
                    </Badge>
                  }
                </TableCell>
                <TableCell>
                  { video.creatorName ? `${video.creatorName} (${video.creatorUsername})` : video.creatorUsername }
                </TableCell>
                <TableCell>
                  { video.optimizerName ? `${video.optimizerName} (${video.optimizerUsername})` : video.optimizerUsername }
                </TableCell>
                <TableCell>
                  { video.reviewerName ? `${video.reviewerName} (${video.reviewerUsername})` : video.reviewerUsername }
                </TableCell>
                <TableCell>
                  { video.updatedAt ? new Date(video.updatedAt).toLocaleDateString() : '' }
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
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
                    {user?.role === 'admin' && (
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
                              Esta acción no se puede deshacer. Se eliminará permanentemente el video
                              <span className="font-medium"> {video.title}</span>.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteVideo(video.id, video.projectId)}
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
            {(!videos || videos.length === 0) && 
              <TableRow>
                <TableCell colSpan={7}>
                  {renderEmptyState()}
                </TableCell>
              </TableRow>
            }
          </TableBody>
        </Table>
      </div>
    </div>
  }

  function getGridView () {
    return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {videos?.map((video: any) => (
        <div key={video.id} 
          className="group relative bg-card rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-border hover:border-primary/20"
          onClick={() => handleVideoClick(video)}
        >
          <div className="aspect-video bg-muted relative">
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
      {(!videos || videos.length === 0) && renderEmptyState()}
    </div>
  }

  function getListView () {
    return <div className="space-y-4">
      {videos?.map((video: any) => (
        <div key={video.id} 
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
                      onClick={() => handleDeleteVideo(video.id, video.projectId)}
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
  }

  function getVideoDialog () {
      return <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <VideoCard
          video={selectedVideo!}
          onUpdate={ async (videoId, data) => {

            setUpdatingVideoId(videoId);
            try {
              await updateVideo({ videoId, projectId: selectedVideo!.projectId, updateRequest: data })
            }
            catch(err) {
              console.log(err)
              toast.error('Error al actualizar el video')
            }
            finally {
              setUpdatingVideoId(undefined);
            } 
          }}
        />
    </Dialog>
  }

  return <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-[1200px] px-4 py-8">
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
            {user?.role !== 'optimizer' && (
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
              visibleStates={VISIBLE_STATES[user?.role as keyof typeof VISIBLE_STATES] || []}
            />
            <div className="flex items-center gap-2 ml-auto">
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
        </div>

        <div className="rounded-lg">
          {viewMode === 'table' ? ( getTableView() ) 
            : viewMode === 'grid' ? ( getGridView() ) 
            : ( getListView() )
          }
        </div>

        {selectedVideo && getVideoDialog()}
      </div>
    </div>
};

function getStatusBadge (status: VideoStatus)  {
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

function getEffectiveStatus (video: any, userRole?: string, currentUser?: any) {
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

function getEffectiveAssignment (video: any, userRole?: User['role'], currentUser?: any) {
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