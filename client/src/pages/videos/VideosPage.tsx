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
import { useState, useEffect, useRef } from "react";
import { VideoFilters } from "./VideoFilters";
import type { DateRange } from "react-day-picker";
import { getStatusBadgeColor, getStatusLabel } from "@/lib/status-labels";
import { cn, formatDate } from "@/lib/utils";
import { User, VideoStatus } from "@db/schema";
import { VISIBLE_STATES, DETAILS_PERMISSION, canUserSeeVideo, canUserSeeVideoDetails } from "@/lib/role-permissions";

function VideosPage() {
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

  const { videos, isLoading, deleteVideo, updateVideo, bulkDeleteVideos } = useVideos();
  const [updatingVideoId, setUpdatingVideoId] = useState<number | undefined>(
    undefined,
  );
  const [newVideoDialogOpen, setNewVideoDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<ApiVideo | undefined>(
    undefined,
  );
  const [viewMode, setViewMode] = useState<"table" | "grid" | "list">("table");
  const [selectedVideos, setSelectedVideos] = useState<number[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  
  // Estados para selección por arrastre
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPosition, setDragStartPosition] = useState<{x: number, y: number} | null>(null);
  const [dragCurrentPosition, setDragCurrentPosition] = useState<{x: number, y: number} | null>(null);
  const dragSelectionRef = useRef<HTMLDivElement>(null);

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
  
  // Función auxiliar para comprobar si un rectángulo de selección contiene un elemento
  const rectangleContainsElement = (
    selectionRect: { left: number; right: number; top: number; bottom: number },
    elementRect: DOMRect
  ) => {
    // Un elemento está dentro del rectángulo si hay intersección
    return !(
      selectionRect.left > elementRect.right ||
      selectionRect.right < elementRect.left ||
      selectionRect.top > elementRect.bottom ||
      selectionRect.bottom < elementRect.top
    );
  };

  const handleDragMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !selectMode) return;
    
    // Actualizar la posición actual del cursor
    setDragCurrentPosition({ x: e.clientX, y: e.clientY });
    
    // Verificamos si existen las posiciones para crear el rectángulo de selección
    if (!dragStartPosition) return;
    
    // Obtener coordenadas del viewport para el rectángulo de selección
    const selectionRect = {
      left: Math.min(dragStartPosition.x, e.clientX),
      right: Math.max(dragStartPosition.x, e.clientX),
      top: Math.min(dragStartPosition.y, e.clientY),
      bottom: Math.max(dragStartPosition.y, e.clientY),
      width: Math.abs(e.clientX - dragStartPosition.x),
      height: Math.abs(e.clientY - dragStartPosition.y),
    };
    
    // Si el rectángulo es muy pequeño (menos de 4x4 píxeles), considerarlo como un clic y no como arrastre
    if (selectionRect.width < 4 && selectionRect.height < 4) {
      return;
    }
    
    // Obtener todos los elementos de video en la vista actual
    const videoElements = document.querySelectorAll('.video-card');
    
    // Guardar los IDs de los videos que están siendo seleccionados en este momento
    const currentlySelectedIds: number[] = [];
    const currentlyDeselectedIds: number[] = [];
    
    // Si se presiona la tecla Alt, deseleccionaremos en lugar de seleccionar
    const isAltKeyPressed = e.altKey;
    
    videoElements.forEach((element) => {
      const videoRect = element.getBoundingClientRect();
      const videoIdAttr = element.getAttribute('data-video-id');
      
      if (!videoIdAttr) return;
      
      const videoId = Number(videoIdAttr);
      
      if (!videoId) return;
      
      // Verificar si el elemento está dentro del rectángulo de selección
      const isContained = rectangleContainsElement(selectionRect, videoRect);
      
      if (isContained) {
        if (isAltKeyPressed) {
          // Con Alt presionado, deseleccionamos
          currentlyDeselectedIds.push(videoId);
        } else {
          // Sin Alt, seleccionamos normalmente
          currentlySelectedIds.push(videoId);
        }
      }
    });
    
    // Actualizar la selección
    setSelectedVideos(prev => {
      if (isAltKeyPressed) {
        // Filtrar los IDs a deseleccionar
        return prev.filter(id => !currentlyDeselectedIds.includes(id));
      } else {
        // Añadir sólo los IDs que no estén ya en el array (selección normal)
        const combinedArray = [...prev];
        
        currentlySelectedIds.forEach(id => {
          if (!combinedArray.includes(id)) {
            combinedArray.push(id);
          }
        });
        
        return combinedArray;
      }
    });
    
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
    
    // Calcular la posición relativa al viewport
    const left = Math.min(dragStartPosition.x, dragCurrentPosition.x);
    const top = Math.min(dragStartPosition.y, dragCurrentPosition.y);
    const width = Math.abs(dragCurrentPosition.x - dragStartPosition.x);
    const height = Math.abs(dragCurrentPosition.y - dragStartPosition.y);
    
    // Ajustar la posición considerando el scroll y los márgenes
    const containerRect = document.documentElement.getBoundingClientRect();
    const scrollLeft = window.scrollX;
    const scrollTop = window.scrollY;
    
    return {
      position: 'fixed' as const, // Usar fixed para posicionamiento relativo a la ventana
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
    };
  };
  
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
                {(!videos || videos.length === 0) && renderEmptyState()}
              </TableBody>
            </Table>
          </div>
        </div>
        {(!videos || videos.length === 0) && renderEmptyState()}
      </div>
    );
  }

  function getGridView() {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredVideos?.map((video) => (
          <div
            key={video.id}
            className="group video-card relative rounded-lg border shadow-sm overflow-hidden transition-all hover:shadow-md bg-card"
            data-video-id={video.id}
            onClick={() => !selectMode && handleVideoClick(video)}
          >
            {/* Selection checkbox overlay */}
            {selectMode && (
              <div className="absolute top-2 right-2 z-10 transition-all duration-200 scale-0 animate-in zoom-in-50 data-[state=visible]:scale-100"
                data-state={selectMode ? "visible" : "hidden"}>
                <div className={cn(
                  "p-1.5 rounded-md transition-colors", 
                  selectedVideos.includes(video.id) ? "bg-primary/30 backdrop-blur-sm" : "bg-background/80 backdrop-blur-sm hover:bg-background/90"
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
            <div className="aspect-video w-full overflow-hidden relative">
              <ThumbnailPreview
                src={video.thumbnailUrl}
                alt={video.title}
                aspectRatio="video"
                enableZoom={true}
                showPlaceholder={true}
                title={video.optimizedTitle || video.title}
                duration={video.seriesNumber ? `S${video.seriesNumber}` : undefined}
                className="w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            </div>
            
            {/* Content */}
            <div className="p-3">
              <h3 className="font-medium text-sm line-clamp-2 mb-1">
                {video.optimizedTitle || video.title}
              </h3>
              
              <div className="flex justify-between items-center mt-2">
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs capitalize",
                    getStatusBadgeColor(video.status)
                  )}
                >
                  {getStatusLabel(user!.role, video)}
                </Badge>
                <div className="text-xs text-muted-foreground">
                  {video.updatedAt ? formatDate(video.updatedAt) : ""}
                </div>
              </div>
              
              <UserBadges video={video} compact={true} />
            </div>
          </div>
        ))}
        {(!videos || videos.length === 0) && renderEmptyState()}
      </div>
    );
  }

  function getListView() {
    return (
      <div className="space-y-3">
        {filteredVideos?.map((video) => (
          <div
            key={video.id}
            className="group video-card relative flex items-center border rounded-lg p-3 bg-card shadow-sm hover:shadow-md transition-all"
            data-video-id={video.id}
            onClick={() => !selectMode && handleVideoClick(video)}
          >
            {/* Selection checkbox overlay */}
            {selectMode && (
              <div className="absolute top-2 right-2 z-10 transition-all duration-200 scale-0 animate-in zoom-in-50 data-[state=visible]:scale-100"
                data-state={selectMode ? "visible" : "hidden"}>
                <div className={cn(
                  "p-1.5 rounded-md transition-colors", 
                  selectedVideos.includes(video.id) ? "bg-primary/30 backdrop-blur-sm" : "bg-background/80 backdrop-blur-sm hover:bg-background/90"
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
            <div className="h-16 w-28 rounded overflow-hidden mr-3 flex-shrink-0">
              <ThumbnailPreview
                src={video.thumbnailUrl}
                alt={video.title}
                aspectRatio="video"
                enableZoom={true}
                showPlaceholder={true}
                title={video.optimizedTitle || video.title}
                showHoverActions={false}
              />
            </div>
            
            {/* Content */}
            <div className="flex-grow min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm line-clamp-1">
                  {video.seriesNumber && <span className="mr-1 text-muted-foreground">S{video.seriesNumber}</span>}
                  {video.optimizedTitle || video.title}
                </h3>
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs capitalize ml-2 flex-shrink-0",
                    getStatusBadgeColor(video.status)
                  )}
                >
                  {getStatusLabel(user!.role, video)}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center mt-1">
                <UserBadges video={video} compact={true} />
                <div className="text-xs text-muted-foreground flex-shrink-0">
                  {video.updatedAt ? formatDate(video.updatedAt) : ""}
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="ml-3 flex items-center space-x-1">
              {canSeeVideoDetails(video) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVideoClick(video);
                  }}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
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
                      onClick={(e) => e.stopPropagation()}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
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
          </div>
        ))}
        {(!videos || videos.length === 0) && renderEmptyState()}
      </div>
    );
  }

  function getVideoDialog() {
    return (
      <Dialog
        open={!!selectedVideo}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedVideo(undefined);
          }
        }}
      >
        {selectedVideo && (
          <VideoDetailDialog
            video={selectedVideo}
            onUpdate={async (updateRequest, keepDialog = false) => {
              if (!selectedVideo) return;

              setUpdatingVideoId(selectedVideo.id);
              try {
                await updateVideo({
                  videoId: selectedVideo.id,
                  projectId: selectedVideo.projectId,
                  updateRequest,
                });

                toast.success("Video actualizado correctamente");

                if (!keepDialog) {
                  setSelectedVideo(undefined);
                }
              } catch (error) {
                console.error("Error updating video:", error);
                toast.error(
                  "Error al actualizar el video. Por favor, intenta de nuevo.",
                );
              } finally {
                setUpdatingVideoId(undefined);
              }
            }}
          />
        )}
      </Dialog>
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
        visibleStates={VISIBLE_STATES[user.role] || VISIBLE_STATES["admin"]}
      />

      {/* Selected videos actions */}
      {selectMode && selectedVideos.length > 0 && (
        <div className="flex items-center gap-2 pl-2 rounded-md bg-muted py-2">
          <span className="text-sm font-medium">
            {selectedVideos.length} videos seleccionados
          </span>
          <div className="ml-auto flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1"
                  data-delete-selected
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar ({selectedVideos.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminarán permanentemente los {selectedVideos.length} videos seleccionados.
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
          </div>
        </div>
      )}

      {/* Contenedor principal con eventos para drag selection */}
      <div 
        className="relative min-h-[75vh]"
        style={{ touchAction: 'none' }} // Prevenir comportamiento táctil predeterminado
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        {/* Rectángulo de selección */}
        {isDragging && dragSelectionRef && (
          <div
            ref={dragSelectionRef}
            className="absolute bg-primary/20 border-2 border-primary/50 rounded-sm z-50 pointer-events-none shadow-md backdrop-blur-[1px]"
            style={getSelectionRectStyle()}
          >
            <div className="absolute top-1 left-1 text-xs font-medium text-primary/80 mix-blend-difference">
              {selectedVideos.length} seleccionados
            </div>
          </div>
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

export default VideosPage;