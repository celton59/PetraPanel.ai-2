import { VideoDetailDialog } from "./VideoDetailDialog";
import { ApiVideo, useVideos } from "@/hooks/useVideos";
import { Button } from "@/components/ui/button";
import { UserBadges } from "@/components/video/UserBadgesSimple";
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

  // Ya no abrimos automáticamente el diálogo por URL para evitar duplicación
  // Esto evita tener dos formas de abrir el mismo diálogo

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
                        className={cn(
                          getStatusBadgeColor(video.status as VideoStatus),
                          "text-xs font-medium py-1.5"
                        )}
                      >
                        {getStatusLabel(user?.role || "user", video)}
                      </Badge>
                    </TableCell>
                    {/* Colaboradores */}
                    <TableCell>
                      <UserBadges
                        creator={video.creatorName}
                        optimizer={video.optimizerName}
                      />
                    </TableCell>
                    {/* Fecha */}
                    <TableCell className="text-muted-foreground">
                      {formatDate(new Date(video.updatedAt || video.createdAt), true)}
                    </TableCell>
                    {/* Acciones */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canSeeVideoDetails(video) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleVideoClick(video)}
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
                                className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Eliminar video</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar este video?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. El video se moverá a la papelera.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteVideo(video.id)}
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
              </TableBody>
            </Table>
          </div>
        </div>
        
        {/* Vista móvil de la tabla como tarjetas */}
        <div className="md:hidden space-y-4">
          {filteredVideos?.map((video) => (
            <Card key={video.id} className="overflow-hidden video-card" data-video-id={video.id}>
              <CardContent className="p-3 flex items-start gap-4">
                <div className="w-20 rounded overflow-hidden flex-shrink-0">
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
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <Badge
                      className={cn(
                        getStatusBadgeColor(video.status as VideoStatus),
                        "text-xs py-0.5"
                      )}
                    >
                      {getStatusLabel(user?.role || "user", video)}
                    </Badge>
                    
                    <span className="text-xs text-muted-foreground">
                      {formatDate(new Date(video.updatedAt || video.createdAt))}
                    </span>
                  </div>
                  
                  <h3 
                    className={cn(
                      "font-medium text-base line-clamp-2 mb-1",
                      canSeeVideoDetails(video) ? "cursor-pointer hover:text-primary" : ""
                    )}
                    onClick={() => canSeeVideoDetails(video) && handleVideoClick(video)}
                  >
                    {video.optimizedTitle || video.title}
                  </h3>
                  
                  <div className="flex items-center justify-between">
                    <UserBadges
                      creator={video.creatorName}
                      optimizer={video.optimizerName}
                      size="xs"
                    />
                    
                    <div className="flex items-center space-x-1">
                      {canSeeVideoDetails(video) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleVideoClick(video)}
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
                              className="h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Eliminar video</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar video?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. El video se moverá a la papelera.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteVideo(video.id)}
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
        </div>
      </div>
    );
  }

  function getGridView() {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-6">
        {filteredVideos?.map((video) => (
          <div 
            key={video.id} 
            className={cn(
              "group video-card relative rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden hover:shadow-md transition-all duration-200",
              selectMode && "ring-1 ring-primary/20 hover:ring-primary/40",
              selectedVideos.includes(video.id) && "ring-2 ring-primary"
            )}
            data-video-id={video.id}
          >
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
            
            {/* Thumbnail */}
            <div className="aspect-video w-full overflow-hidden" onClick={() => canSeeVideoDetails(video) && handleVideoClick(video)}>
              <ThumbnailPreview
                src={video.thumbnailUrl}
                alt={video.optimizedTitle ?? video.title}
                aspectRatio="video"
                enableZoom={true}
                showPlaceholder={true}
                className="h-full w-full object-cover transition-all duration-300 group-hover:scale-105"
                title={video.optimizedTitle ?? video.title}
                showHoverActions={true}
              />
            </div>
            
            {/* Content */}
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Badge
                  className={cn(
                    getStatusBadgeColor(video.status as VideoStatus),
                    "text-xs py-0.5"
                  )}
                >
                  {getStatusLabel(user?.role || "user", video)}
                </Badge>
                
                <span className="text-xs text-muted-foreground">
                  {formatDate(new Date(video.updatedAt || video.createdAt))}
                </span>
              </div>
              
              <h3 
                className={cn(
                  "font-medium text-base line-clamp-2",
                  canSeeVideoDetails(video) ? "cursor-pointer hover:text-primary" : ""
                )}
                onClick={() => canSeeVideoDetails(video) && handleVideoClick(video)}
              >
                {video.optimizedTitle || video.title}
              </h3>
              
              <div className="pt-1">
                <UserBadges
                  creator={video.creatorName}
                  optimizer={video.optimizerName}
                  size="xs"
                />
              </div>
            </div>
            
            {/* Actions overlay - visible on hover */}
            <div className="absolute bottom-0 right-0 p-2 flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-tl from-background/80 via-background/60 to-transparent backdrop-blur-[2px]">
              {canSeeVideoDetails(video) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 bg-background/80 hover:bg-background/90"
                  onClick={() => handleVideoClick(video)}
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
                      className="h-7 w-7 bg-background/80 hover:bg-background/90"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="sr-only">Eliminar video</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar este video?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. El video se moverá a la papelera.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteVideo(video.id)}
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
      </div>
    );
  }

  function getListView() {
    return (
      <div className="space-y-3">
        {filteredVideos?.map((video) => (
          <div
            key={video.id}
            className={cn(
              "group video-card flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors",
              selectMode && "ring-1 ring-primary/20 hover:ring-primary/40",
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
            <div className="h-16 w-28 rounded overflow-hidden flex-shrink-0">
              <ThumbnailPreview
                src={video.thumbnailUrl}
                alt={video.optimizedTitle ?? video.title}
                aspectRatio="video"
                enableZoom={true}
                showPlaceholder={true}
                className="h-full w-full object-cover"
                title={video.optimizedTitle ?? video.title}
                showHoverActions={false}
              />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge
                  className={cn(
                    getStatusBadgeColor(video.status as VideoStatus),
                    "text-xs py-0.5"
                  )}
                >
                  {getStatusLabel(user?.role || "user", video)}
                </Badge>
                
                <span className="text-xs text-muted-foreground ml-auto sm:ml-0">
                  {formatDate(new Date(video.updatedAt || video.createdAt))}
                </span>
              </div>
              
              <h3 
                className={cn(
                  "font-medium text-base line-clamp-1 mb-1",
                  canSeeVideoDetails(video) ? "cursor-pointer hover:text-primary" : ""
                )}
                onClick={() => canSeeVideoDetails(video) && handleVideoClick(video)}
              >
                {video.optimizedTitle || video.title}
              </h3>
              
              <UserBadges
                creator={video.creatorName}
                optimizer={video.optimizerName}
                size="xs"
              />
            </div>
            
            {/* Actions */}
            <div className="flex-shrink-0 flex items-center ml-auto space-x-1">
              {canSeeVideoDetails(video) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleVideoClick(video)}
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
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Eliminar video</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar este video?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. El video se moverá a la papelera.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteVideo(video.id)}
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
      </div>
    );
  }

  function getVideoDialog() {
    if (!selectedVideo) return null;
    
    return (
      <VideoDetailDialog
        video={selectedVideo}
        onUpdate={async (data, keepDialog) => {
          // This method is called after a successful update
          // We'll just clear the selected video to close the dialog
          if (!keepDialog) {
            setSelectedVideo(null);
          }
        }}
      />
    );
  }

  // Loading and empty states
  if (isError) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">Error al cargar videos</h3>
          <p className="text-muted-foreground">
            Ha ocurrido un error al cargar la información. Intenta recargar la página.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="container py-6 max-w-7xl"
      onMouseDown={handleDragStart}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
    >
      {/* Header */}
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Videos</h1>
          
          <div className="flex items-center gap-3">
            {/* Admin Controls - Toggle selection mode */}
            {user?.role === "admin" && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={toggleSelectionMode}
                aria-pressed={selectMode}
              >
                {selectMode ? (
                  <>
                    <CheckSquare className="h-4 w-4" />
                    <span className="hidden sm:inline">Modo selección</span>
                    <span className="inline sm:hidden">Selección</span>
                  </>
                ) : (
                  <>
                    <Square className="h-4 w-4" />
                    <span className="hidden sm:inline">Modo selección</span>
                    <span className="inline sm:hidden">Selección</span>
                  </>
                )}
              </Button>
            )}
            
            {/* Bulk delete button - visible only in select mode */}
            {selectMode && selectedVideos.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-2"
                    data-delete-selected
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>{selectedVideos.length}</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      ¿Eliminar {selectedVideos.length} videos?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. Los videos se moverán a la papelera.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleBulkDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Eliminar {selectedVideos.length} videos
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            
            {/* View mode switcher */}
            <div className="border rounded-md flex">
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="icon"
                className="h-9 w-9 rounded-none rounded-l-md"
                onClick={() => setViewMode("table")}
                aria-label="Vista de tabla"
                title="Vista de tabla"
              >
                <Layout className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" />
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                className="h-9 w-9 rounded-none"
                onClick={() => setViewMode("grid")}
                aria-label="Vista de rejilla"
                title="Vista de rejilla"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" />
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                className="h-9 w-9 rounded-none rounded-r-md"
                onClick={() => setViewMode("list")}
                aria-label="Vista de lista"
                title="Vista de lista"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
          
          {/* Botón flotante a la derecha */}
          <div className="flex gap-3 w-full sm:w-auto justify-end">
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
      </div>
      
      {/* Main content - Video list */}
      <div className="space-y-6">
        {filteredVideos.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {viewMode === "table" && getTableView()}
            {viewMode === "grid" && getGridView()}
            {viewMode === "list" && getListView()}
          </>
        )}
      </div>
      
      {/* Drag selection overlay */}
      {isDragging && selectMode && (
        <div
          ref={dragSelectionRef}
          className="fixed z-50 bg-primary/10 border border-primary/30 pointer-events-none"
          style={getSelectionRectStyle()}
        />
      )}
      
      {/* Modals and dialogs */}
      <NewVideoDialog
        open={newVideoDialogOpen}
        onOpenChange={setNewVideoDialogOpen}
      />

      {getVideoDialog()}
    </div>
  );
}