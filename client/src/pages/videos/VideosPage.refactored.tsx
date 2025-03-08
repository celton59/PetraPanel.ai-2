import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { DateRange } from "react-day-picker";
import { useUser } from "@/hooks/use-user";
import { VIDEO_STATUSES } from "../../lib/constants";

// Tipo temporal mientras creamos el archivo de tipos
interface ApiVideo {
  id: number;
  title: string;
  optimizedTitle?: string;
  description?: string;
  status: string;
  projectId: number;
  creatorId?: number;
  optimizerId?: number;
  assignedToId?: number;
  createdAt: string;
  updatedAt: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  seriesNumber?: number;
  creatorName?: string;
  optimizerName?: string;
}

// Componentes extraídos
import { GridView } from "./components/GridView";
import { TableView } from "./components/TableView";
import { ListView } from "./components/ListView";
import { EmptyState } from "./components/EmptyState";
import { VideoToolbar } from "./components/VideoToolbar";
import { BulkDeleteAction } from "./components/BulkDeleteAction";
import { DragSelectionContainer } from "./components/DragSelectionContainer";
import { VideoDetailDialog } from "./VideoDetailDialog";
import { VideoFilters } from "./VideoFilters";
import { NewVideoDialog } from "./NewVideoDialog";

// Define los estados visibles para cada rol
const VISIBLE_STATES: Record<string, readonly string[]> = {
  admin: VIDEO_STATUSES,
  creator: ["content_corrections", "available", "upload_media", "media_corrections", "completed"],
  optimizer: ["content_review", "media_review", "final_review"],
};

export default function VideosPage() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  
  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [assignedTo, setAssignedTo] = useState("all");
  const [projectId, setProjectId] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados de UI
  const [viewMode, setViewMode] = useState<"table" | "grid" | "list">("grid");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<number[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<ApiVideo | null>(null);
  const [newVideoDialogOpen, setNewVideoDialogOpen] = useState(false);
  
  // Estados para selección por arrastre
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPosition, setDragStartPosition] = useState<{x: number, y: number} | null>(null);
  const [dragCurrentPosition, setDragCurrentPosition] = useState<{x: number, y: number} | null>(null);
  const [lastSelectionUpdate, setLastSelectionUpdate] = useState(0);
  
  // Consultas y mutaciones
  const { data: videos = [], isLoading, error } = useQuery<ApiVideo[]>({
    queryKey: ['/api/videos'],
    refetchOnWindowFocus: true,
  });
  
  const { mutateAsync: deleteVideo } = useMutation({
    mutationFn: async ({ videoId, projectId }: { videoId: number, projectId: number }) => {
      const response = await fetch(`/api/videos/${videoId}?projectId=${projectId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Error al eliminar el video');
      }
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
    },
  });
  
  const { mutateAsync: bulkDeleteVideos } = useMutation({
    mutationFn: async ({ videoIds, projectId }: { videoIds: number[], projectId: number }) => {
      const response = await fetch(`/api/videos/bulk-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoIds, projectId }),
      });
      
      if (!response.ok) {
        throw new Error('Error al eliminar videos en masa');
      }
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
    },
  });
  
  // Funciones auxiliares
  function canSeeVideoDetails(video: ApiVideo): boolean {
    // Los administradores pueden ver todos los videos
    if (user?.role === "admin") return true;
    
    // Los creadores solo pueden ver sus propios videos o videos asignados a ellos
    if (user?.role === "creator") {
      return video.creatorId === user.id || video.assignedToId === user.id;
    }
    
    // Los optimizadores solo pueden ver videos en estados específicos o asignados a ellos
    if (user?.role === "optimizer") {
      return (
        ["content_review", "media_review", "final_review"].includes(video.status) ||
        video.assignedToId === user.id
      );
    }
    
    return false;
  }
  
  async function handleVideoClick(video: ApiVideo) {
    setSelectedVideo(video);
  }
  
  function renderEmptyState() {
    return (
      <EmptyState user={user!} />
    );
  }
  
  // Función para verificar si dos rectángulos se intersectan
  const rectanglesIntersect = (rect1: DOMRect, rect2: DOMRect) => {
    return !(
      rect1.right < rect2.left ||
      rect1.left > rect2.right ||
      rect1.bottom < rect2.top ||
      rect1.top > rect2.bottom
    );
  };
  
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
    const handleKeyDown = (e: KeyboardEvent) => {
      // Si no estamos en modo selección, no hacemos nada
      if (!selectMode) return;
      
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
  
  return (
    <div className="pb-10 container mx-auto">
      {/* Barra de herramientas superior */}
      <VideoToolbar 
        user={user!}
        viewMode={viewMode}
        setViewMode={setViewMode}
        selectMode={selectMode}
        toggleSelectionMode={toggleSelectionMode}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        setNewVideoDialogOpen={setNewVideoDialogOpen}
      />

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

      {/* Selected videos actions */}
      {selectMode && selectedVideos.length > 0 && (
        <BulkDeleteAction 
          selectedVideos={selectedVideos}
          handleBulkDelete={handleBulkDelete}
        />
      )}

      {/* Contenedor principal con eventos para drag selection */}
      <DragSelectionContainer
        isDragging={isDragging}
        selectMode={selectMode}
        dragStartPosition={dragStartPosition}
        dragCurrentPosition={dragCurrentPosition}
        handleDragStart={handleDragStart}
        handleDragMove={handleDragMove}
        handleDragEnd={handleDragEnd}
      >
        {viewMode === "table" && (
          <TableView
            videos={videos}
            filteredVideos={filteredVideos}
            selectedVideos={selectedVideos}
            selectMode={selectMode}
            toggleSelectVideo={toggleSelectVideo}
            toggleSelectAll={toggleSelectAll}
            handleVideoClick={handleVideoClick}
            canSeeVideoDetails={canSeeVideoDetails}
            deleteVideo={deleteVideo}
            user={user!}
            renderEmptyState={renderEmptyState}
          />
        )}
        {viewMode === "grid" && (
          <GridView
            videos={videos}
            filteredVideos={filteredVideos}
            selectedVideos={selectedVideos}
            selectMode={selectMode}
            toggleSelectVideo={toggleSelectVideo}
            handleVideoClick={handleVideoClick}
            canSeeVideoDetails={canSeeVideoDetails}
            user={user!}
            renderEmptyState={renderEmptyState}
          />
        )}
        {viewMode === "list" && (
          <ListView
            videos={videos}
            filteredVideos={filteredVideos}
            selectedVideos={selectedVideos}
            selectMode={selectMode}
            toggleSelectVideo={toggleSelectVideo}
            handleVideoClick={handleVideoClick}
            canSeeVideoDetails={canSeeVideoDetails}
            deleteVideo={deleteVideo}
            user={user!}
            renderEmptyState={renderEmptyState}
          />
        )}
      </DragSelectionContainer>

      {/* Modals and dialogs */}
      <NewVideoDialog
        open={newVideoDialogOpen}
        onOpenChange={setNewVideoDialogOpen}
      />

      {selectedVideo && (
        <VideoDetailDialog
          video={selectedVideo}
          onUpdate={async (data, keepDialog) => {
            // Invalidar consulta para actualizar los datos
            await queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
            
            // Si no se especifica mantener el diálogo abierto, cerrarlo
            if (!keepDialog) {
              setSelectedVideo(null);
            }
          }}
        />
      )}
    </div>
  );
}