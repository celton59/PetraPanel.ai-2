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
  Recycle,
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
import React from 'react';
import { Link } from "wouter";

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
  const [lastSelectionUpdate, setLastSelectionUpdate] = useState<number>(0);

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
            : "Comienza agregando tu primer video usando el botón"}
        </p>
        {/* Botón "Nuevo Video" eliminado */}
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
    
    // Si estamos en un control que no debe iniciar el drag, ignoramos
    if (
      e.target instanceof HTMLButtonElement || 
      e.target instanceof HTMLInputElement || 
      e.target instanceof HTMLAnchorElement || 
      (e.target as Element).closest('button') ||
      (e.target as Element).closest('a') ||
      (e.target as Element).closest('input')
    ) {
      return;
    }
    
    // Vaciar selección previa si no se está presionando la tecla Shift
    if (!e.shiftKey) {
      setSelectedVideos([]);
    }
    
    setIsDragging(true);
    setDragStartPosition({ x: e.clientX, y: e.clientY });
    setDragCurrentPosition({ x: e.clientX, y: e.clientY });
    
    // Prevenir comportamiento de arrastre del navegador
    e.preventDefault();
  };
  
  const handleDragMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !selectMode) return;
    
    setDragCurrentPosition({ x: e.clientX, y: e.clientY });
    
    // Solo actualizamos la selección cada cierto tiempo para mejorar el rendimiento
    const now = Date.now();
    if (now - lastSelectionUpdate < 50) return; // Limitar a 20 actualizaciones por segundo
    
    // Detectar elementos en el rectángulo de selección
    const selectionRect = {
      left: Math.min(dragStartPosition!.x, e.clientX),
      top: Math.min(dragStartPosition!.y, e.clientY),
      right: Math.max(dragStartPosition!.x, e.clientX),
      bottom: Math.max(dragStartPosition!.y, e.clientY),
      width: Math.abs(e.clientX - dragStartPosition!.x),
      height: Math.abs(e.clientY - dragStartPosition!.y)
    } as DOMRect;
    
    // Obtener todos los elementos de video en la vista actual
    const videoElements = document.querySelectorAll('.video-card');
    const newSelectedVideos = [...selectedVideos]; // Copia para modificar
    
    videoElements.forEach((element) => {
      const videoRect = element.getBoundingClientRect();
      const videoId = Number(element.getAttribute('data-video-id'));
      
      if (!videoId) return;
      
      // Verificar si el elemento está dentro del rectángulo de selección
      if (rectanglesIntersect(selectionRect, videoRect)) {
        // Añadir a la selección si no está ya
        if (!newSelectedVideos.includes(videoId)) {
          newSelectedVideos.push(videoId);
        }
      }
    });
    
    setSelectedVideos(newSelectedVideos);
    setLastSelectionUpdate(now);
    
    e.preventDefault();
  };
  
  const handleDragEnd = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !selectMode) return;
    
    // Una última actualización de la selección
    if (dragStartPosition && dragCurrentPosition) {
      const selectionRect = {
        left: Math.min(dragStartPosition.x, dragCurrentPosition.x),
        top: Math.min(dragStartPosition.y, dragCurrentPosition.y),
        right: Math.max(dragStartPosition.x, dragCurrentPosition.x),
        bottom: Math.max(dragStartPosition.y, dragCurrentPosition.y),
        width: Math.abs(dragCurrentPosition.x - dragStartPosition.x),
        height: Math.abs(dragCurrentPosition.y - dragStartPosition.y)
      } as DOMRect;
      
      // Si el rectángulo es muy pequeño, probablemente sea un clic accidental
      // así que ignoramos la selección en ese caso
      if (selectionRect.width < 5 && selectionRect.height < 5) {
        // No hacemos nada, probablemente fue un clic accidental
      }
    }
    
    setIsDragging(false);
    setDragStartPosition(null);
    setDragCurrentPosition(null);
    
    e.preventDefault();
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
    
    // Calcular coordenadas relativas al viewport
    const left = Math.min(dragStartPosition.x, dragCurrentPosition.x);
    const top = Math.min(dragStartPosition.y, dragCurrentPosition.y);
    const width = Math.abs(dragCurrentPosition.x - dragStartPosition.x);
    const height = Math.abs(dragCurrentPosition.y - dragStartPosition.y);
    
    // Calcular coordenadas relativas al contenedor (fixed para el viewport)
    return {
      position: 'fixed', // Posición fija respecto al viewport
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
    };
  };
  
  const filteredVideos = videos.filter((video) => {
    // Primero verificamos el término de búsqueda
    if (searchTerm && !(
      video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.optimizedTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (video.seriesNumber && video.seriesNumber.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
      (video.description && video.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (video.creatorName && video.creatorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (video.optimizerName && video.optimizerName.toLowerCase().includes(searchTerm.toLowerCase()))
    )) {
      return false;
    }

    // Verificar filtro de estado
    if (status !== "all" && video.status !== status) {
      return false;
    }

    // Verificar filtro de asignación
    if (assignedTo !== "all" && video.assignedToId?.toString() !== assignedTo) {
      return false;
    }

    // Verificar filtro de proyecto
    if (projectId !== "all" && video.projectId?.toString() !== projectId) {
      return false;
    }

    // Verificar filtro de fecha
    if (dateRange && dateRange.from && dateRange.to) {
      const videoDate = new Date(video.createdAt);
      const fromDate = new Date(dateRange.from);
      const toDate = new Date(dateRange.to);
      
      // Ajustar la fecha final para incluir todo el día
      toDate.setHours(23, 59, 59, 999);
      
      if (videoDate < fromDate || videoDate > toDate) {
        return false;
      }
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
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Eliminar video</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. El video se enviará a la papelera.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteVideo(video.id, video.projectId)} 
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

        {/* Vista móvil - Personalizada para mejor experiencia en dispositivos pequeños */}
        <div className="md:hidden space-y-4">
          {filteredVideos.map((video) => (
            <div 
              key={video.id} 
              className="video-card border rounded-lg p-3 bg-card relative overflow-hidden"
              data-video-id={video.id}
            >
              {/* Selection checkbox para modo selección */}
              {user?.role === "admin" && selectMode && (
                <div className="absolute top-2 left-2 z-10">
                  <div className={cn(
                    "p-1.5 rounded-md bg-background/80 backdrop-blur-sm transition-colors", 
                    selectedVideos.includes(video.id) ? "bg-primary/20" : ""
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
              
              <div className="flex gap-3">
                {/* Miniatura */}
                <div className="w-20 h-14 flex-shrink-0 rounded overflow-hidden">
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
                
                {/* Contenido */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-start justify-between">
                    {/* Título */}
                    <h3 
                      className={cn(
                        "font-medium line-clamp-2", 
                        canSeeVideoDetails(video) ? "cursor-pointer hover:text-primary" : ""
                      )}
                      onClick={() => canSeeVideoDetails(video) && handleVideoClick(video)}
                    >
                      {video.optimizedTitle || video.title}
                    </h3>
                    
                    {/* Status badge */}
                    <Badge
                      variant="secondary"
                      className={cn(
                        "capitalize text-xs whitespace-nowrap ml-2 mt-0.5",
                        getStatusBadgeColor(video.status)
                      )}
                    >
                      {getStatusLabel(user!.role, video)}
                    </Badge>
                  </div>
                  
                  {/* Metadatos */}
                  <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      {video.seriesNumber && (
                        <span className="text-foreground font-medium">
                          #{video.seriesNumber}
                        </span>
                      )}
                      <span>{formatDate(video.updatedAt, false)}</span>
                    </div>
                    
                    {/* Acciones */}
                    <div className="flex items-center">
                      {canSeeVideoDetails(video) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleVideoClick(video)}
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
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Eliminar video</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. El video se enviará a la papelera.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteVideo(video.id, video.projectId)} 
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
            </div>
          ))}
        </div>
      </div>
    );
  }

  function getGridView() {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredVideos.map((video) => (
          <div
            key={video.id}
            className="video-card relative group rounded-lg border bg-card overflow-hidden"
            data-video-id={video.id}
          >
            {user?.role === "admin" && selectMode && (
              <div className="absolute top-2 right-2 z-10">
                <div className={cn(
                  "p-1.5 rounded-md bg-background/80 backdrop-blur-sm", 
                  selectedVideos.includes(video.id) ? "bg-primary/20" : ""
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
            <div className="aspect-video w-full overflow-hidden bg-muted">
              <ThumbnailPreview
                src={video.thumbnailUrl}
                alt={video.optimizedTitle ?? video.title}
                aspectRatio="video"
                enableZoom={true}
                showPlaceholder={true}
                className="h-full w-full object-cover transition-all group-hover:scale-105"
                title={video.optimizedTitle ?? video.title}
                showHoverActions
              />
            </div>
            
            <div className="p-4">
              {/* Título */}
              <h3 
                className={cn(
                  "font-medium line-clamp-2 mb-2", 
                  canSeeVideoDetails(video) ? "cursor-pointer hover:text-primary" : ""
                )}
                onClick={() => canSeeVideoDetails(video) && handleVideoClick(video)}
              >
                {video.optimizedTitle || video.title}
              </h3>
              
              <div className="flex items-center justify-between">
                {/* Status Badge */}
                <Badge
                  variant="secondary"
                  className={cn(
                    "capitalize text-xs",
                    getStatusBadgeColor(video.status)
                  )}
                >
                  {getStatusLabel(user!.role, video)}
                </Badge>
                
                {/* Updated time */}
                <span className="text-xs text-muted-foreground">
                  {formatDate(video.updatedAt, false)}
                </span>
              </div>
              
              {/* Colaboradores */}
              <div className="mt-4">
                <UserBadges video={video} compact={false} />
              </div>
              
              {/* Actions */}
              <div className="flex items-center justify-end gap-2 mt-4">
                {canSeeVideoDetails(video) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVideoClick(video)}
                    className="gap-1"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Detalles
                  </Button>
                )}
                {user?.role === "admin" && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 text-destructive border-destructive/50 hover:bg-destructive/90 hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Eliminar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. El video se enviará a la papelera.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => deleteVideo(video.id, video.projectId)} 
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
      </div>
    );
  }

  function getListView() {
    return (
      <div className="space-y-2">
        {filteredVideos.map((video) => (
          <div
            key={video.id}
            className="video-card flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            data-video-id={video.id}
          >
            {/* Selection checkbox */}
            {user?.role === "admin" && selectMode && (
              <div className="ml-1">
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
            <div className="w-16 h-12 rounded overflow-hidden flex-shrink-0">
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
            
            {/* Title and other info */}
            <div className="flex-grow min-w-0">
              <div 
                className={cn(
                  "font-medium line-clamp-1", 
                  canSeeVideoDetails(video) ? "cursor-pointer hover:text-primary" : ""
                )}
                onClick={() => canSeeVideoDetails(video) && handleVideoClick(video)}
              >
                {video.optimizedTitle || video.title}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                <Badge
                  variant="secondary"
                  className={cn(
                    "capitalize text-xs",
                    getStatusBadgeColor(video.status)
                  )}
                >
                  {getStatusLabel(user!.role, video)}
                </Badge>
                <span>
                  {formatDate(video.updatedAt, false)}
                </span>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2">
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
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Eliminar video</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. El video se enviará a la papelera.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => deleteVideo(video.id, video.projectId)} 
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
      <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(undefined)}>
        <VideoDetailDialog
          video={selectedVideo}
          onUpdate={async (data, keepDialog) => {
            setUpdatingVideoId(selectedVideo.id);
            try {
              await updateVideo(selectedVideo.id, selectedVideo.projectId, data);
              if (!keepDialog) {
                setSelectedVideo(undefined);
              }
              toast.success("Video actualizado");
            } catch (error) {
              console.error("Error updating video", error);
              toast.error("Error al actualizar el video");
            } finally {
              setUpdatingVideoId(undefined);
            }
          }}
        />
      </Dialog>
    );
  }

  // Si no hay videos, mostramos un mensaje
  if (videos.length === 0) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Videos</h1>
          {user?.role === "admin" && (
            <div className="flex gap-2">
              <Link href="/videos/trash">
                <Button 
                  variant="outline" 
                  className="gap-2"
                >
                  <Recycle className="w-4 h-4" />
                  Papelera
                </Button>
              </Link>
            </div>
          )}
        </div>
        {renderEmptyState()}
        
        <NewVideoDialog
          open={newVideoDialogOpen}
          onOpenChange={setNewVideoDialogOpen}
        />
      </div>
    );
  }

  // Si hay videos, mostramos la interfaz completa con filtros y resultados
  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold">Videos</h1>
        
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          {/* View mode selector */}
          <div className="border rounded-md p-1 flex">
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("table")}
              className="h-8 w-8 rounded-sm"
              title="Vista de tabla"
            >
              <Layout className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className="h-8 w-8 rounded-sm"
              title="Vista de cuadrícula"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
              className="h-8 w-8 rounded-sm"
              title="Vista de lista"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Select mode toggle */}
          {user?.role === "admin" && (
            <Button
              variant={selectMode ? "default" : "outline"}
              size="sm"
              onClick={toggleSelectionMode}
              className="gap-2"
            >
              {selectMode ? (
                <>
                  <CheckSquare className="h-4 w-4" />
                  Modo selección
                </>
              ) : (
                <>
                  <Square className="h-4 w-4" />
                  Seleccionar
                </>
              )}
            </Button>
          )}
          
          {/* Filters toggle */}
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
          
          {user?.role === "admin" && (
            <div className="flex gap-2">
              <Link href="/videos/trash">
                <Button 
                  variant="outline" 
                  className="gap-2"
                >
                  <Recycle className="w-4 h-4" />
                  Papelera
                </Button>
              </Link>
            </div>
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
        visibleStates={VISIBLE_STATES[user.role]}
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
        className="relative"
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        {/* Rectángulo de selección */}
        {isDragging && selectMode && (
          <div
            ref={dragSelectionRef}
            className="fixed bg-primary/10 border border-primary/30 rounded-sm z-50 pointer-events-none"
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

// Aplicamos React.memo para evitar renderizaciones innecesarias
export default React.memo(VideosPage);