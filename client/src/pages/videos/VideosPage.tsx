import { VideoDetailDialog } from "./VideoDetailDialog";
import { ApiVideo, useVideos } from "@/hooks/useVideos";
import { Button } from "@/components/ui/button";
import { UserBadges } from "@/components/video/UserBadges";
import { ImagePreview } from "@/components/ui/image-preview";
import { ThumbnailPreview } from "@/components/ui/thumbnail-preview";
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
  CheckSquare,
  Square,
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
import { Checkbox } from "@/components/ui/checkbox";
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
import { useState, useEffect, useRef, useCallback } from "react";
import { VideoFilters } from "./VideoFilters";
import type { DateRange } from "react-day-picker";
import { getStatusBadgeColor, getStatusLabel } from "@/lib/status-labels";
import { cn, formatDate } from "@/lib/utils";
import { User, VideoStatus } from "@db/schema";
import { VISIBLE_STATES, DETAILS_PERMISSION, canUserSeeVideo, canUserSeeVideoDetails } from "@/lib/role-permissions";
import { SelectionRectangle, useDragSelection } from './DragSelection';

function VideosPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const { videos, isLoading, deleteVideo, updateVideo, bulkDeleteVideos } = useVideos();
  
  // Estados para la vista y selección
  const [updatingVideoId, setUpdatingVideoId] = useState<number | undefined>(undefined);
  const [newVideoDialogOpen, setNewVideoDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<ApiVideo | undefined>(undefined);
  const [viewMode, setViewMode] = useState<"table" | "grid" | "list">("table");
  const [selectedVideos, setSelectedVideos] = useState<number[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [status, setStatus] = useState("all");
  const [assignedTo, setAssignedTo] = useState("all");
  const [projectId, setProjectId] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  
  // Referencias
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Efectos
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("new") === "true") {
      setNewVideoDialogOpen(true);
      window.history.replaceState({}, "", "/videos");
    }
  }, []);

  // Definir la función de callback para manejar los cambios en la selección por arrastre
  const handleSelectionChange = useCallback((selectedIds: number[], isDeselecting: boolean) => {
    setSelectedVideos(prev => {
      if (isDeselecting) {
        // Deseleccionar videos (quitar los IDs)
        return prev.filter(id => !selectedIds.includes(id));
      } else {
        // Seleccionar videos (añadir los IDs que no estén ya en el array)
        const newSelection = [...prev];
        selectedIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      }
    });
  }, []);

  // Hook personalizado para la selección por arrastre
  const {
    isDragging,
    selectionRectStyle,
    handleDragStart,
    handleDragMove,
    handleDragEnd
  } = useDragSelection({
    selectMode,
    onSelectionChange: handleSelectionChange,
    scrollThreshold: 60,
    baseScrollSpeed: 10
  });

  // UI de carga inicial
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

  if (!user) return null;

  // UI de carga de videos
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

  function canSeeVideoDetails(video: ApiVideo): boolean {
    if (!user) return false;
    return canUserSeeVideoDetails(user.role, video.status);
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

  // Toggle video selection
  const toggleSelectVideo = (videoId: number) => {
    setSelectedVideos(prev => {
      if (prev.includes(videoId)) {
        return prev.filter(id => id !== videoId);
      } else {
        return [...prev, videoId];
      }
    });
  };

  // Toggle selection mode
  const toggleSelectionMode = () => {
    if (selectMode) {
      // If turning off selection mode, clear selections
      setSelectedVideos([]);
    }
    setSelectMode(!selectMode);
  };

  // Toggle select all videos
  const toggleSelectAll = () => {
    if (selectedVideos.length === filteredVideos.length) {
      setSelectedVideos([]);
    } else {
      setSelectedVideos(filteredVideos.map(video => video.id));
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedVideos.length === 0) return;
    
    const projectIdToUse = videos.find(v => selectedVideos.includes(v.id))?.projectId;
    if (!projectIdToUse) return;

    try {
      await bulkDeleteVideos({
        projectId: projectIdToUse,
        videoIds: selectedVideos
      });
      setSelectedVideos([]);
      setSelectMode(false);
    } catch (error) {
      console.error("Error deleting videos in bulk:", error);
    }
  };
  
  // Función para verificar si dos rectángulos se intersectan
  const rectanglesIntersect = (rect1: DOMRect, rect2: DOMRect) => {
    return !(
      rect1.right < rect2.left ||
      rect1.left > rect2.right ||
      rect1.bottom < rect2.top ||
      rect1.top > rect2.bottom
    );
  };
  
  // Filtrar videos según los criterios seleccionados
  const filteredVideos = videos.filter((video) => {
    // Primero filtrar por estados visibles para el rol actual según permisos
    if (!canUserSeeVideo(user!.role, video.status)) {
      return false;
    }

    // Luego aplicar filtros de búsqueda
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

    // Aplicar filtro por estado si está seleccionado
    if (status !== "all") {
      return video.status === status;
    }

    // Aplicar filtro por asignación
    if (assignedTo !== "all") {
      const assignedToUserId = parseInt(assignedTo);
      return (
        video.optimizedBy === assignedToUserId ||
        video.contentReviewedBy === assignedToUserId ||
        video.mediaReviewedBy === assignedToUserId ||
        video.contentUploadedBy === assignedToUserId
      );
    }

    // Aplicar filtro por proyecto
    if (projectId !== "all") {
      return video.projectId === parseInt(projectId);
    }

    // Aplicar filtro por fecha
    if (dateRange && dateRange.from && dateRange.to) {
      // Asegurarnos de que video.createdAt no sea null antes de crear la fecha
      if (video.createdAt) {
        const videoDate = new Date(video.createdAt);
        const fromDate = new Date(dateRange.from);
        const toDate = new Date(dateRange.to);
        
        // Ajustar la fecha final para incluir todo el día
        toDate.setHours(23, 59, 59, 999);
        
        return videoDate >= fromDate && videoDate <= toDate;
      }
      return false;
    }

    return true;
  });
  
  // Efecto para atajos de teclado
  useEffect(() => {
    if (!selectMode) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Evitar que los atajos se activen cuando se está escribiendo en un input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // Esc - Salir del modo selección
      if (e.key === 'Escape') {
        toggleSelectionMode();
        e.preventDefault();
      }
      
      // Ctrl/Cmd + A - Seleccionar todos
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        toggleSelectAll();
        e.preventDefault();
      }
      
      // Delete - Eliminar videos seleccionados (solo si hay alguno seleccionado)
      if (e.key === 'Delete' && selectedVideos.length > 0) {
        handleBulkDelete();
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectMode, selectedVideos]);

  function getTableView() {
    return (
      <div className="w-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {selectMode && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedVideos.length === filteredVideos.length && filteredVideos.length > 0}
                    indeterminate={selectedVideos.length > 0 && selectedVideos.length < filteredVideos.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label={selectedVideos.length > 0 ? "Deseleccionar todos" : "Seleccionar todos"}
                  />
                </TableHead>
              )}
              <TableHead>Título</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Proyecto</TableHead>
              <TableHead>Creado</TableHead>
              <TableHead>Actualizado</TableHead>
              <TableHead>Asignado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVideos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={selectMode ? 8 : 7} className="h-48 text-center">
                  {renderEmptyState()}
                </TableCell>
              </TableRow>
            ) : (
              filteredVideos.map((video) => (
                <TableRow 
                  key={video.id}
                  className={cn(
                    "group video-card",
                    selectedVideos.includes(video.id) && "bg-muted"
                  )}
                  data-video-id={video.id}
                >
                  {selectMode && (
                    <TableCell>
                      <Checkbox
                        checked={selectedVideos.includes(video.id)}
                        onCheckedChange={() => toggleSelectVideo(video.id)}
                        aria-label="Seleccionar video"
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-start gap-2">
                      <div className="relative flex-shrink-0 w-14 h-8 rounded-md overflow-hidden">
                        <ThumbnailPreview 
                          src={video.thumbnailUrl || ""} 
                          alt={video.title} 
                        />
                      </div>
                      <div>
                        <p className="font-medium break-words">{video.optimizedTitle || video.title}</p>
                        {video.seriesNumber && (
                          <span className="text-xs text-muted-foreground">
                            Ep. {video.seriesNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(video.status as VideoStatus)}>
                      {getStatusLabel(user.role, video)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {video.projectName || "Sin proyecto"}
                  </TableCell>
                  <TableCell>
                    {video.createdAt ? formatDate(new Date(video.createdAt), true) : "—"}
                  </TableCell>
                  <TableCell>
                    {video.updatedAt ? formatDate(new Date(video.updatedAt), true) : "—"}
                  </TableCell>
                  <TableCell>
                    <UserBadges 
                      optimizedBy={video.optimizerName} 
                      contentReviewedBy={video.contentReviewerName}
                      mediaReviewedBy={video.mediaReviewerName}
                    />
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {canSeeVideoDetails(video) ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleVideoClick(video)}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Ver</span>
                      </Button>
                    ) : (
                      <Button size="icon" variant="ghost" disabled>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">No disponible</span>
                      </Button>
                    )}
                    
                    {user?.role === "admin" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:opacity-90"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción moverá "{video.title}" a la papelera. Puedes restaurarlo más tarde.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                deleteVideo(video.id, video.projectId)
                                  .then(() => {
                                    toast.success(`Video movido a la papelera`);
                                  })
                                  .catch((error) => {
                                    console.error("Error al eliminar el video:", error);
                                    toast.error("Error al mover el video a la papelera");
                                  });
                              }}
                            >
                              Mover a papelera
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    );
  }

  function getGridView() {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {filteredVideos.length === 0 ? (
          <div className="col-span-full">
            {renderEmptyState()}
          </div>
        ) : (
          filteredVideos.map((video) => (
            <div
              key={video.id}
              className={cn(
                "video-card bg-card rounded-lg border overflow-hidden hover:shadow-sm transition-shadow",
                canSeeVideoDetails(video) ? "cursor-pointer" : "cursor-default",
                selectedVideos.includes(video.id) && "ring-2 ring-primary"
              )}
              data-video-id={video.id}
              onClick={(e) => {
                // Si estamos en modo selección, seleccionar/deseleccionar el video
                if (selectMode) {
                  e.preventDefault();
                  toggleSelectVideo(video.id);
                  return;
                }
                
                // De lo contrario, abrir detalles si tenemos permisos
                if (canSeeVideoDetails(video)) {
                  handleVideoClick(video);
                }
              }}
            >
              <div className="relative aspect-video">
                {selectMode && (
                  <div className="absolute top-2 left-2 z-10">
                    <Checkbox
                      checked={selectedVideos.includes(video.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectVideo(video.id);
                      }}
                      aria-label="Seleccionar video"
                      className="h-5 w-5 bg-background/80 backdrop-blur"
                    />
                  </div>
                )}
                <ThumbnailPreview
                  src={video.thumbnailUrl || ""}
                  alt={video.title}
                  className="h-full w-full object-cover"
                />
                <Badge
                  className={cn(
                    "absolute bottom-2 right-2",
                    getStatusBadgeColor(video.status as VideoStatus)
                  )}
                >
                  {getStatusLabel(user.role, video)}
                </Badge>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex gap-1">
                  {video.projectPrefix && (
                    <Badge variant="outline" className="px-1.5 py-0 h-5 text-xs">
                      {video.projectPrefix}
                    </Badge>
                  )}
                  {video.seriesNumber && (
                    <Badge variant="outline" className="px-1.5 py-0 h-5 text-xs">
                      Ep. {video.seriesNumber}
                    </Badge>
                  )}
                </div>
                <h3 className="font-medium text-sm line-clamp-2">
                  {video.optimizedTitle || video.title}
                </h3>
                <div className="flex justify-between items-center pt-1">
                  <UserBadges
                    optimizedBy={video.optimizerName}
                    contentReviewedBy={video.contentReviewerName}
                    mediaReviewedBy={video.mediaReviewerName}
                    size="sm"
                  />
                  
                  {user?.role === "admin" && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:opacity-90 h-8 w-8"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción moverá "{video.title}" a la papelera. Puedes restaurarlo más tarde.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              deleteVideo(video.id, video.projectId)
                                .then(() => {
                                  toast.success(`Video movido a la papelera`);
                                })
                                .catch((error) => {
                                  console.error("Error al eliminar el video:", error);
                                  toast.error("Error al mover el video a la papelera");
                                });
                            }}
                          >
                            Mover a papelera
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  function getListView() {
    return (
      <div className="space-y-4">
        {filteredVideos.length === 0 ? (
          renderEmptyState()
        ) : (
          filteredVideos.map((video) => (
            <div
              key={video.id}
              className={cn(
                "video-card flex bg-card border rounded-lg overflow-hidden hover:shadow-sm transition-shadow",
                canSeeVideoDetails(video) ? "cursor-pointer" : "cursor-default",
                selectedVideos.includes(video.id) && "ring-2 ring-primary"
              )}
              data-video-id={video.id}
              onClick={(e) => {
                // Si estamos en modo selección, seleccionar/deseleccionar el video
                if (selectMode) {
                  e.preventDefault();
                  toggleSelectVideo(video.id);
                  return;
                }
                
                // De lo contrario, abrir detalles si tenemos permisos
                if (canSeeVideoDetails(video)) {
                  handleVideoClick(video);
                }
              }}
            >
              <div className="relative w-40 flex-shrink-0">
                {selectMode && (
                  <div className="absolute top-2 left-2 z-10">
                    <Checkbox
                      checked={selectedVideos.includes(video.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectVideo(video.id);
                      }}
                      aria-label="Seleccionar video"
                      className="h-5 w-5 bg-background/80 backdrop-blur"
                    />
                  </div>
                )}
                <ThumbnailPreview
                  src={video.thumbnailUrl || ""}
                  alt={video.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap gap-2 mb-1">
                    <Badge className={getStatusBadgeColor(video.status as VideoStatus)}>
                      {getStatusLabel(user.role, video)}
                    </Badge>
                    {video.projectPrefix && (
                      <Badge variant="outline">
                        {video.projectPrefix}
                      </Badge>
                    )}
                    {video.seriesNumber && (
                      <Badge variant="outline">
                        Ep. {video.seriesNumber}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-medium mb-1">
                    {video.optimizedTitle || video.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {video.optimizedDescription || video.description || "Sin descripción"}
                  </p>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center gap-4">
                    <div className="text-xs text-muted-foreground">
                      Creado: {video.createdAt ? formatDate(new Date(video.createdAt)) : "—"}
                    </div>
                    <UserBadges
                      optimizedBy={video.optimizerName}
                      contentReviewedBy={video.contentReviewerName}
                      mediaReviewedBy={video.mediaReviewerName}
                    />
                  </div>
                  
                  <div className="flex gap-1">
                    {canSeeVideoDetails(video) ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVideoClick(video);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Detalles
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" disabled>
                        <Eye className="h-4 w-4 mr-1" />
                        No disponible
                      </Button>
                    )}
                    
                    {user?.role === "admin" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:opacity-90"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Eliminar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción moverá "{video.title}" a la papelera. Puedes restaurarlo más tarde.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                deleteVideo(video.id, video.projectId)
                                  .then(() => {
                                    toast.success(`Video movido a la papelera`);
                                  })
                                  .catch((error) => {
                                    console.error("Error al eliminar el video:", error);
                                    toast.error("Error al mover el video a la papelera");
                                  });
                              }}
                            >
                              Mover a papelera
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  function getVideoDialog() {
    if (!selectedVideo) return null;
    
    return (
      <Dialog
        open={!!selectedVideo}
        onOpenChange={(open) => {
          if (!open) setSelectedVideo(undefined);
        }}
      >
        <VideoDetailDialog
          video={selectedVideo}
          onUpdate={async (data, keepDialog = false) => {
            if (selectedVideo) {
              try {
                setUpdatingVideoId(selectedVideo.id);
                await updateVideo(selectedVideo.id, selectedVideo.projectId, data);
                
                // Solo cerrar el diálogo si no se pide mantenerlo abierto
                if (!keepDialog) {
                  setSelectedVideo(undefined);
                }
                
                toast.success("Video actualizado");
              } catch (error) {
                console.error("Error actualizando el video:", error);
                toast.error("Error al actualizar el video");
              } finally {
                setUpdatingVideoId(undefined);
              }
            }
          }}
        />
      </Dialog>
    );
  }

  return (
    <div
      className="container py-6 space-y-6"
      ref={containerRef}
      onMouseDown={handleDragStart}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Videos</h1>
          <p className="text-muted-foreground">
            Gestiona tus videos y contenido multimedia
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
          <div className="flex gap-1 bg-muted/30 p-0.5 rounded-md">
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="h-8"
            >
              <Layout className="h-4 w-4" />
              <span className="sr-only md:not-sr-only md:ml-2">Tabla</span>
            </Button>
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-8"
            >
              <Grid className="h-4 w-4" />
              <span className="sr-only md:not-sr-only md:ml-2">Cuadrícula</span>
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8"
            >
              <List className="h-4 w-4" />
              <span className="sr-only md:not-sr-only md:ml-2">Lista</span>
            </Button>
          </div>
          <Button
            variant={selectMode ? "secondary" : "outline"}
            size="sm"
            onClick={toggleSelectionMode}
          >
            {selectMode ? (
              <>
                <CheckSquare className="h-4 w-4 mr-2" />
                Finalizar selección
              </>
            ) : (
              <>
                <Square className="h-4 w-4 mr-2" />
                Modo selección
              </>
            )}
          </Button>
          <div className="flex gap-2">
            <Button
              variant={showFilters ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            {user?.role === "admin" && (
              <Button
                onClick={() => setNewVideoDialogOpen(true)}
                size="sm"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Nuevo Video
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Filtros */}
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
        visibleStates={VISIBLE_STATES[user!.role]}
      />

      {/* Barra de acciones cuando hay videos seleccionados */}
      {selectMode && selectedVideos.length > 0 && (
        <div className="flex items-center justify-between bg-muted/60 px-4 py-2 rounded-lg">
          <div className="text-sm font-medium">
            {selectedVideos.length} video{selectedVideos.length > 1 ? "s" : ""} seleccionado{selectedVideos.length > 1 ? "s" : ""}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedVideos([])}
            >
              Deseleccionar todos
            </Button>
            {user?.role === "admin" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Mover a papelera
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción moverá {selectedVideos.length} videos a la papelera. Puedes restaurarlos más tarde.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBulkDelete}>
                      Mover a papelera
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      )}

      {/* Lista de videos */}
      <div>
        {viewMode === "table" && getTableView()}
        {viewMode === "grid" && getGridView()}
        {viewMode === "list" && getListView()}
      </div>

      {/* Rectángulo de selección */}
      {isDragging && <SelectionRectangle style={selectionRectStyle} />}

      {/* Diálogos */}
      {getVideoDialog()}
      <NewVideoDialog
        open={newVideoDialogOpen}
        onOpenChange={setNewVideoDialogOpen}
      />
    </div>
  );
}

export default VideosPage;