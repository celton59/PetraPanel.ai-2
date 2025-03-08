import { VideoDetailDialog } from "./VideoDetailDialog";
import { ApiVideo, useVideos } from "@/hooks/useVideos";
import { Button } from "@/components/ui/button";
import { UserBadges } from "@/components/video/UserBadges";
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
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { VideoFilters } from "./VideoFilters";
import { formatDate } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import { getStatusLabel, getStatusBadgeColor } from "@/lib/status-labels";
import { VideoStatus } from "@db/schema";
import { User } from "@/hooks/use-user";

export default function VideosPage() {
  const { user } = useUser();
  const { videos, isLoading, isError, deleteVideo, bulkDeleteVideos } = useVideos();
  const [selectedVideo, setSelectedVideo] = useState<ApiVideo | null>(null);
  const [selectedVideos, setSelectedVideos] = useState<number[]>([]);
  const [selectMode, setSelectMode] = useState<boolean>(false);
  
  // Estados para arrastrar selección
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStartPosition, setDragStartPosition] = useState<{x: number, y: number} | null>(null);
  const [dragCurrentPosition, setDragCurrentPosition] = useState<{x: number, y: number} | null>(null);
  const dragSelectionRef = useRef<HTMLDivElement>(null);
  
  // Estados para filtros y ordenación
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [assignedTo, setAssignedTo] = useState("all");
  const [projectId, setProjectId] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Estado para la vista
  const [viewMode, setViewMode] = useState<"table" | "grid" | "list">("table");
  
  // Estado para el modal de nuevo video
  const [newVideoDialogOpen, setNewVideoDialogOpen] = useState(false);

  // Abrir directamente el diálogo de nuevo video si la URL tiene ?new=true
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "true") {
      setNewVideoDialogOpen(true);
    }
  }, []);

  function canSeeVideoDetails(video: ApiVideo): boolean {
    if (!user) return false;
    
    // Admins pueden ver todos los detalles
    if (user.role === "admin") return true;
    
    // Los optimizadores solo pueden ver videos asignados a ellos
    // o que estén en estados específicos que les corresponden
    if (user.role === "optimizer") {
      // Si el video está asignado al usuario actual
      if (video.optimizerId === user.id) return true;
      
      // Si el video está en un estado que corresponde al rol del usuario
      const optimizerStates = ["pending", "in_progress", "optimize_review", "title_corrections", "en_revision"];
      return optimizerStates.includes(video.status);
    }
    
    return false;
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
  
  // Funciones para selección por arrastre
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectMode) return;
    
    // Solo permitir arrastre con botón izquierdo
    if (e.button !== 0) return;
    
    setIsDragging(true);
    setDragStartPosition({ x: e.clientX, y: e.clientY });
    setDragCurrentPosition({ x: e.clientX, y: e.clientY });
    
    // Prevenir comportamiento de arrastre del navegador
    e.preventDefault();
  };
  
  const handleDragMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !selectMode) return;
    
    setDragCurrentPosition({ x: e.clientX, y: e.clientY });
    
    // Detectar elementos en el rectángulo de selección
    if (dragSelectionRef.current) {
      const selectionRect = dragSelectionRef.current.getBoundingClientRect();
      
      // Obtener todos los elementos de video en la vista actual
      const videoElements = document.querySelectorAll('.video-card');
      
      videoElements.forEach((element) => {
        const videoRect = element.getBoundingClientRect();
        const videoId = Number(element.getAttribute('data-video-id'));
        
        // Verificar si el elemento está dentro del rectángulo de selección
        if (
          videoId &&
          rectanglesIntersect(selectionRect, videoRect)
        ) {
          // Verificar si ya está seleccionado
          if (!selectedVideos.includes(videoId)) {
            setSelectedVideos(prev => [...prev, videoId]);
          }
        }
      });
    }
    
    e.preventDefault();
  };
  
  const handleDragEnd = () => {
    if (!isDragging || !selectMode) return;
    
    setIsDragging(false);
    setDragStartPosition(null);
    setDragCurrentPosition(null);
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
  
  // Calcular las coordenadas del rectángulo de selección
  const getSelectionRectStyle = () => {
    if (!dragStartPosition || !dragCurrentPosition) return {};
    
    const left = Math.min(dragStartPosition.x, dragCurrentPosition.x);
    const top = Math.min(dragStartPosition.y, dragCurrentPosition.y);
    const width = Math.abs(dragCurrentPosition.x - dragStartPosition.x);
    const height = Math.abs(dragCurrentPosition.y - dragStartPosition.y);
    
    return {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
    };
  };
  
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
      if (e.key === 'Delete' && selectedVideos.length > 0 && user?.role === 'admin') {
        // Aquí no hacemos la eliminación directamente, solo mostramos el diálogo de confirmación
        // Esto asegura que el usuario confirme antes de eliminar
        // Simulamos un clic en el botón de eliminar
        const deleteButton = document.querySelector('[data-delete-selected]');
        if (deleteButton) {
          (deleteButton as HTMLButtonElement).click();
        }
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectMode, selectedVideos, toggleSelectAll, user?.role, toggleSelectionMode]);

  function getTableView() {
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
                          getStatusBadgeColor(video.status as VideoStatus)
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
                    <TableCell colSpan={7} className="h-24 text-center">
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

  function getGridView() {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredVideos.map((video) => (
          <Card
            key={video.id}
            className={cn(
              "overflow-hidden group video-card",
              selectedVideos.includes(video.id) && "ring-2 ring-primary"
            )}
            data-video-id={video.id}
          >
            <div className="relative">
              <div className={cn(
                "aspect-video w-full",
                canSeeVideoDetails(video) ? "cursor-pointer" : ""
              )}
                onClick={() => canSeeVideoDetails(video) && handleVideoClick(video)}
              >
                <ThumbnailPreview
                  src={video.thumbnailUrl}
                  alt={video.optimizedTitle ?? video.title}
                  aspectRatio="video"
                  enableZoom={false}
                  showPlaceholder={true}
                  className="object-cover w-full h-full"
                  title={video.optimizedTitle ?? video.title}
                  showHoverActions={false}
                />
              </div>
              
              {/* Admin selection overlay */}
              {user?.role === "admin" && selectMode && (
                <div className="absolute top-2 left-2">
                  <div className={cn(
                    "p-1.5 rounded-md transition-colors bg-background/70 backdrop-blur-sm", 
                    selectedVideos.includes(video.id) ? "bg-primary/50" : "hover:bg-primary/20"
                  )}>
                    <Checkbox 
                      checked={selectedVideos.includes(video.id)}
                      onCheckedChange={() => toggleSelectVideo(video.id)}
                      className="h-4 w-4 border-2 transition-all duration-200"
                      aria-label={`Seleccionar video ${video.title}`}
                    />
                  </div>
                </div>
              )}
              
              {/* Status badge */}
              <div className="absolute bottom-2 right-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "capitalize text-xs backdrop-blur-sm bg-background/80",
                    getStatusBadgeColor(video.status as VideoStatus)
                  )}
                >
                  {getStatusLabel(user!.role, video)}
                </Badge>
              </div>
            </div>
            
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className={cn(
                  "font-medium line-clamp-2 leading-tight",
                  canSeeVideoDetails(video) ? "cursor-pointer hover:text-primary" : ""
                )}
                  onClick={() => canSeeVideoDetails(video) && handleVideoClick(video)}
                >
                  {video.optimizedTitle || video.title}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {formatDate(video.updatedAt, false)}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    {canSeeVideoDetails(video) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleVideoClick(video)}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span className="sr-only">Ver detalles</span>
                      </Button>
                    )}
                    {user?.role === "admin" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {(!videos || videos.length === 0) && renderEmptyState()}
      </div>
    );
  }

  function getListView() {
    return (
      <div className="space-y-4">
        {filteredVideos.map((video) => (
          <div 
            key={video.id}
            className={cn(
              "border rounded-lg bg-card p-4 flex flex-col sm:flex-row gap-4 video-card",
              selectedVideos.includes(video.id) && "ring-2 ring-primary"
            )}
            data-video-id={video.id}
          >
            {/* Admin selection checkbox */}
            {user?.role === "admin" && selectMode && (
              <div className="absolute top-2 right-2 sm:static sm:mr-2">
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
              </div>
            )}
            
            {/* Thumbnail */}
            <div className="sm:w-48 relative">
              <div
                className={cn(
                  "aspect-video rounded-md overflow-hidden",
                  canSeeVideoDetails(video) ? "cursor-pointer" : ""
                )}
                onClick={() => canSeeVideoDetails(video) && handleVideoClick(video)}
              >
                <ThumbnailPreview
                  src={video.thumbnailUrl}
                  alt={video.optimizedTitle ?? video.title}
                  aspectRatio="video"
                  enableZoom={true}
                  showPlaceholder={true}
                  className="object-cover w-full h-full"
                  title={video.optimizedTitle ?? video.title}
                  showHoverActions={false}
                />
              </div>
              
              {/* Series number badge */}
              {video.seriesNumber && (
                <div className="absolute top-2 left-2">
                  <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
                    {video.seriesNumber}
                  </Badge>
                </div>
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 space-y-3">
              <div className="space-y-1">
                <h3
                  className={cn(
                    "text-lg font-medium line-clamp-2",
                    canSeeVideoDetails(video) ? "cursor-pointer hover:text-primary" : ""
                  )}
                  onClick={() => canSeeVideoDetails(video) && handleVideoClick(video)}
                >
                  {video.optimizedTitle || video.title}
                </h3>
                {video.description && (
                  <p className="text-muted-foreground text-sm line-clamp-2">{video.description}</p>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <Badge
                  variant="secondary"
                  className={cn(
                    "capitalize",
                    getStatusBadgeColor(video.status as VideoStatus)
                  )}
                >
                  {getStatusLabel(user!.role, video)}
                </Badge>
                
                <span className="text-muted-foreground">
                  Actualizado: {formatDate(video.updatedAt, false)}
                </span>
                
                <UserBadges video={video} />
              </div>
              
              <div className="flex justify-end gap-2 pt-2">
                {canSeeVideoDetails(video) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVideoClick(video)}
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Ver detalles
                  </Button>
                )}
                {user?.role === "admin" && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
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
        ))}
        
        {(!videos || videos.length === 0) && renderEmptyState()}
      </div>
    );
  }

  function getVideoDialog() {
    if (!selectedVideo) return null;
    
    const handleUpdate = async (data: any) => {
      console.log("Actualizando video:", data);
      // Aquí se implementaría la lógica de actualización del video
      setSelectedVideo(null);
    };
    
    return (
      <VideoDetailDialog
        video={selectedVideo}
        onUpdate={handleUpdate}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Videos</h1>
          <p className="text-muted-foreground">
            {videos.length} videos disponibles
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          {user?.role === "admin" && (
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={toggleSelectionMode}
            >
              {selectMode ? (
                <>
                  <CheckSquare className="w-4 h-4" />
                  Modo selección
                </>
              ) : (
                <>
                  <Square className="w-4 h-4" />
                  Seleccionar
                </>
              )}
            </Button>
          )}
          
          <div className="flex rounded-md overflow-hidden border">
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="icon"
              className={cn(
                "rounded-none border-0",
                viewMode === "table" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setViewMode("table")}
            >
              <Layout className="h-4 w-4" />
              <span className="sr-only">Vista tabla</span>
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              className={cn(
                "rounded-none border-0",
                viewMode === "grid" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
              <span className="sr-only">Vista cuadrícula</span>
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              className={cn(
                "rounded-none border-0",
                viewMode === "list" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
              <span className="sr-only">Vista lista</span>
            </Button>
          </div>
          
          <Button
            variant="outline"
            className="flex items-center gap-2 ml-auto sm:ml-0"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
          
          {user?.role === "admin" && (
            <Button onClick={() => setNewVideoDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Video
            </Button>
          )}
        </div>
      </div>

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
      />
      
      {/* Bulk action bar */}
      {selectMode && selectedVideos.length > 0 && user?.role === "admin" && (
        <div className="bg-card border rounded-lg p-3 flex justify-between items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="text-sm">
            <span className="font-medium">{selectedVideos.length}</span> {selectedVideos.length === 1 ? "video seleccionado" : "videos seleccionados"}
          </div>
          
          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" data-delete-selected className="gap-1.5">
                  <Trash2 className="h-3.5 w-3.5" />
                  Eliminar seleccionados
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Eliminar videos seleccionados</AlertDialogTitle>
                  <AlertDialogDescription>
                    ¿Estás seguro de que deseas eliminar {selectedVideos.length} {selectedVideos.length === 1 ? "video" : "videos"}? Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2">
                  <AlertDialogCancel className="mt-0">Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleBulkDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}

      {/* Contenedor principal con eventos para drag selection */}
      <div 
        className="relative"
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        {/* Rectángulo de selección */}
        {isDragging && dragSelectionRef && (
          <div
            ref={dragSelectionRef}
            className="absolute bg-primary/10 border border-primary/30 rounded-sm z-50 pointer-events-none"
            style={getSelectionRectStyle()}
          ></div>
        )}
        
        {viewMode === "table" && getTableView()}
        {viewMode === "grid" && getGridView()}
        {viewMode === "list" && getListView()}
      </div>

      {/* Modals and dialogs */}
      <NewVideoDialog
        open={newVideoDialogOpen}
        onOpenChange={setNewVideoDialogOpen}
      />

      {getVideoDialog()}
    </div>
  );
}