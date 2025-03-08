import { VideoDetailDialog } from "./VideoDetailDialog";
import { ApiVideo, useVideos } from "@/hooks/useVideos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  HelpCircle,
  RotateCcw,
  FileVideo,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  content_reviewer: [], // Agregado para evitar errores
  media_reviewer: [], // Agregado para evitar errores
} as const;

const DETAILS_PERMISSION: Record<User["role"], VideoStatus[]> = {
  admin: [],
  optimizer: ["available", "content_corrections"],
  reviewer: ["content_review", "media_review"],
  content_reviewer: ['content_review'],
  media_reviewer: ['media_review'],
  youtuber: ["upload_media", "media_corrections"],
};

// Extender la interfaz ApiVideo para incluir las propiedades de papelera
interface TrashVideo extends Omit<ApiVideo, 'deletedAt'> {
  deletedByUsername?: string;
  deletedAt: Date | null;
}

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

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [status, setStatus] = useState("all");
  const [assignedTo, setAssignedTo] = useState("all");
  const [projectId, setProjectId] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  
  const { 
    videos, 
    isLoading, 
    deleteVideo, 
    updateVideo, 
    bulkDeleteVideos, 
    restoreVideo, 
    emptyTrash, 
    getTrashVideos 
  } = useVideos();
  
  // Estado para la papelera
  const [trashVideos, setTrashVideos] = useState<TrashVideo[]>([]);
  const [isLoadingTrash, setIsLoadingTrash] = useState(false);
  const [activeTab, setActiveTab] = useState<"videos" | "trash">("videos");
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
  
  // Carga los videos en la papelera cuando se selecciona la pestaña
  useEffect(() => {
    if (activeTab === "trash" && user?.role === "admin") {
      const loadTrashVideos = async () => {
        setIsLoadingTrash(true);
        try {
          const projectIdToUse = projectId === "all" ? 1 : parseInt(projectId);
          const trashData = await getTrashVideos({ projectId: projectIdToUse });
          setTrashVideos(trashData as TrashVideo[]);
        } catch (error) {
          console.error("Error cargando videos en la papelera:", error);
          toast.error("Error", {
            description: "No se pudieron cargar los videos de la papelera",
          });
        } finally {
          setIsLoadingTrash(false);
        }
      };
      
      loadTrashVideos();
    }
  }, [activeTab, projectId, user?.role]);

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
      toast.success("Éxito", {
        description: `${selectedVideos.length} videos movidos a la papelera`,
      });
    } catch (error) {
      console.error("Error deleting videos in bulk:", error);
      toast.error("Error", {
        description: "No se pudieron mover los videos a la papelera",
      });
    }
  };
  
  // Restaurar un video de la papelera
  const handleRestoreVideo = async (videoId: number, projectId: number) => {
    try {
      await restoreVideo({ videoId, projectId });
      
      // Actualizar la lista de videos en la papelera
      setTrashVideos(prev => prev.filter(video => video.id !== videoId));
      
      toast.success("Éxito", {
        description: "Video restaurado correctamente",
      });
    } catch (error) {
      console.error("Error restaurando el video:", error);
      toast.error("Error", {
        description: "No se pudo restaurar el video",
      });
    }
  };
  
  // Vaciar la papelera
  const handleEmptyTrash = async () => {
    if (trashVideos.length === 0) return;
    
    const projectIdToUse = trashVideos[0]?.projectId;
    if (!projectIdToUse) return;
    
    try {
      await emptyTrash({ projectId: projectIdToUse });
      
      // Actualizar la lista de videos en la papelera
      setTrashVideos([]);
      
      toast.success("Éxito", {
        description: "Papelera vaciada correctamente",
      });
    } catch (error) {
      console.error("Error vaciando la papelera:", error);
      toast.error("Error", {
        description: "No se pudo vaciar la papelera",
      });
    }
  };
  
  // Funciones para selección por arrastre
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectMode) return;
    
    // Solo permitir arrastre con botón izquierdo
    if (e.button !== 0) return;
    
    // Verificamos si estamos haciendo clic dentro de un elemento seleccionable para evitar
    // iniciar arrastre cuando hacemos clic en controles u otros elementos
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('input')) {
      return;
    }
    
    // Guardamos cualquier selección existente que tengamos con la tecla shift presionada
    const existingSelection = e.shiftKey ? [...selectedVideos] : [];
    
    setIsDragging(true);
    setDragStartPosition({ x: e.clientX, y: e.clientY });
    setDragCurrentPosition({ x: e.clientX, y: e.clientY });
    
    // Si no estamos manteniendo shift, limpiamos cualquier selección previa
    if (!e.shiftKey) {
      setSelectedVideos([]);
    }
    
    // Prevenir comportamiento de arrastre del navegador
    e.preventDefault();
  };
  
  const handleDragMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !selectMode) return;
    
    // Actualizamos la posición actual
    setDragCurrentPosition({ x: e.clientX, y: e.clientY });
    
    // Solo actualizamos la selección si el rectángulo tiene un tamaño mínimo
    // para evitar selecciones accidentales con clics pequeños
    if (
      dragStartPosition && 
      (Math.abs(e.clientX - dragStartPosition.x) > 10 || 
       Math.abs(e.clientY - dragStartPosition.y) > 10)
    ) {
      // Crear un rectángulo de selección
      const selectionRect = {
        left: Math.min(dragStartPosition.x, e.clientX),
        right: Math.max(dragStartPosition.x, e.clientX),
        top: Math.min(dragStartPosition.y, e.clientY),
        bottom: Math.max(dragStartPosition.y, e.clientY),
        width: Math.abs(e.clientX - dragStartPosition.x),
        height: Math.abs(e.clientY - dragStartPosition.y)
      };
      
      // Convertir a DOMRect para usar con la función de intersección
      const selectionDOMRect = new DOMRect(
        selectionRect.left, 
        selectionRect.top, 
        selectionRect.width, 
        selectionRect.height
      );
      
      // Obtener todos los elementos de video en la vista actual
      const videoElements = document.querySelectorAll('.video-card');
      
      // Preparamos la nueva selección, manteniendo la selección existente si se usa shift
      const newSelectedVideos: number[] = e.shiftKey ? [...selectedVideos] : [];
      
      videoElements.forEach((element) => {
        const videoRect = element.getBoundingClientRect();
        const videoId = Number(element.getAttribute('data-video-id'));
        
        // Verificar si el elemento está dentro del rectángulo de selección
        if (videoId && rectanglesIntersect(selectionDOMRect, videoRect)) {
          // Si estamos usando shift, verificamos si ya está seleccionado
          if (e.shiftKey && newSelectedVideos.includes(videoId)) {
            // Ya está seleccionado, no hacemos nada
          } else if (!newSelectedVideos.includes(videoId)) {
            // No está seleccionado, lo añadimos
            newSelectedVideos.push(videoId);
          }
        }
      });
      
      // Actualizar los videos seleccionados
      setSelectedVideos(newSelectedVideos);
    }
    
    e.preventDefault();
  };
  
  const handleDragEnd = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !selectMode) return;
    
    // Si el rectángulo de arrastre es muy pequeño, consideramos que es un clic,
    // y si no estamos usando shift, deseleccionamos todo
    if (
      dragStartPosition && 
      dragCurrentPosition && 
      Math.abs(dragStartPosition.x - dragCurrentPosition.x) < 10 && 
      Math.abs(dragStartPosition.y - dragCurrentPosition.y) < 10 &&
      !e.shiftKey
    ) {
      setSelectedVideos([]);
    }
    
    // Finalizamos el arrastre
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
  const getSelectionRectStyle = (): React.CSSProperties => {
    if (!dragStartPosition || !dragCurrentPosition) return {};
    
    const left = Math.min(dragStartPosition.x, dragCurrentPosition.x);
    const top = Math.min(dragStartPosition.y, dragCurrentPosition.y);
    const width = Math.abs(dragCurrentPosition.x - dragStartPosition.x);
    const height = Math.abs(dragCurrentPosition.y - dragStartPosition.y);
    
    return {
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      width: `${Math.max(width, 2)}px`,
      height: `${Math.max(height, 2)}px`,
      pointerEvents: 'none',
      zIndex: 9999,
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      border: '2px solid rgba(99, 102, 241, 0.5)',
      borderRadius: '4px',
    } as React.CSSProperties;
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
    // Solo configuramos los listeners si estamos en modo selección
    if (selectMode) {
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
    }
    
    // Siempre devolvemos una función de limpieza, aunque sea vacía
    return () => {};
  }, [selectMode, selectedVideos, toggleSelectAll, user?.role, toggleSelectionMode]);

  // Función para renderizar el contenido de la papelera
  function getTrashContent() {
    if (isLoadingTrash) {
      return (
        <div className="flex h-64 items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Cargando elementos en papelera...</p>
          </div>
        </div>
      );
    }
    
    if (trashVideos.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-card rounded-lg border border-dashed">
          <div className="rounded-full bg-muted p-3 mb-4">
            <Trash2 className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">Papelera vacía</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
            No hay videos en la papelera actualmente
          </p>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        {user?.role === "admin" && trashVideos.length > 0 && (
          <div className="flex justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-1.5">
                  <Trash2 className="w-4 h-4" />
                  Vaciar papelera
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción eliminará permanentemente todos los videos en la papelera. 
                    Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleEmptyTrash}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Eliminar permanentemente
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
        
        <div className="hidden md:block rounded-lg border bg-card shadow-sm overflow-hidden relative">
          <div className="h-1 w-full bg-gradient-to-r from-red-500 via-primary to-red-500 absolute top-0 left-0"></div>
          <div className="overflow-x-auto pt-1">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="">Miniatura</TableHead>
                  <TableHead className="">Serie</TableHead>
                  <TableHead className="">Título</TableHead>
                  <TableHead className="">Estado</TableHead>
                  <TableHead className="">Eliminado por</TableHead>
                  <TableHead className="">Fecha de eliminación</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trashVideos.map((video) => (
                  <TableRow key={video.id} className="group">
                    {/* Miniatura */}
                    <TableCell>
                      <div className="w-16 h-12 rounded overflow-hidden brightness-75 group-hover:brightness-90 transition-all">
                        <ThumbnailPreview
                          src={video.thumbnailUrl}
                          alt={video.optimizedTitle ?? video.title}
                          aspectRatio="video"
                          showPlaceholder={true}
                          className="h-full"
                          title={video.optimizedTitle ?? video.title}
                          showHoverActions={false}
                        />
                      </div>
                    </TableCell>
                    {/* Serie */}
                    <TableCell className="font-medium text-center text-muted-foreground">
                      {video.seriesNumber || "-"}
                    </TableCell>
                    {/* Título */}
                    <TableCell className="font-medium max-w-md text-muted-foreground">
                      <div className="space-y-1">
                        <span className="text-base line-clamp-1">{video.optimizedTitle || video.title}</span>
                      </div>
                    </TableCell>
                    {/* Estado */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-xs text-muted-foreground bg-muted/50"
                      >
                        Eliminado
                      </Badge>
                    </TableCell>
                    {/* Eliminado por */}
                    <TableCell className="text-muted-foreground text-sm">
                      {video.deletedByUsername || "Desconocido"}
                    </TableCell>
                    {/* Fecha de eliminación */}
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(video.deletedAt, true)}
                    </TableCell>
                    {/* Acciones */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRestoreVideo(video.id, video.projectId)}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <RotateCcw className="h-4 w-4" />
                          <span className="sr-only">Restaurar</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        
        {/* Vista móvil */}
        <div className="md:hidden space-y-4">
          {trashVideos.map((video) => (
            <div key={video.id} className="border rounded-lg p-4 space-y-3 bg-card group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-9 rounded overflow-hidden brightness-75">
                    <ThumbnailPreview
                      src={video.thumbnailUrl}
                      alt={video.title}
                      aspectRatio="video"
                      showPlaceholder={true}
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm line-clamp-1 text-muted-foreground">{video.title}</h3>
                    <p className="text-xs text-muted-foreground">Serie: {video.seriesNumber || "-"}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs text-muted-foreground">Eliminado</Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                <p>Eliminado por: {video.deletedByUsername || "Desconocido"}</p>
                <p>Fecha: {formatDate(video.deletedAt, true)}</p>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRestoreVideo(video.id, video.projectId)}
                  className="h-8 px-2 text-xs"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Restaurar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        
        {/* Mobile list view for small screens */}
        <div className="md:hidden space-y-4">
          {filteredVideos?.map((video) => (
            <div 
              key={video.id} 
              className={cn(
                "border rounded-lg p-4 space-y-3 bg-card group",
                canSeeVideoDetails(video) ? "cursor-pointer hover:bg-muted" : "",
                selectMode && selectedVideos.includes(video.id) ? "bg-muted ring-1 ring-primary" : ""
              )}
              onClick={() => selectMode 
                ? toggleSelectVideo(video.id)
                : canSeeVideoDetails(video) && handleVideoClick(video)
              }
              data-video-id={video.id}
              data-testid={`video-card-${video.id}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-9 rounded overflow-hidden">
                    <ThumbnailPreview
                      src={video.thumbnailUrl}
                      alt={video.title}
                      aspectRatio="video"
                      showPlaceholder={true}
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm line-clamp-1">{video.optimizedTitle || video.title}</h3>
                    <p className="text-xs text-muted-foreground">Serie: {video.seriesNumber || "-"}</p>
                  </div>
                </div>
                <Badge variant="secondary" className={cn(
                  "capitalize text-xs",
                  getStatusBadgeColor(video.status)
                )}>
                  {getStatusLabel(user!.role, video)}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                <p>Actualizado: {formatDate(video.updatedAt, true)}</p>
                <p className="mt-1">{video.description?.substring(0, 80)}{video.description?.length! > 80 ? "..." : ""}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function getGridView() {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
        {filteredVideos?.map((video) => (
          <div 
            key={video.id} 
            className={cn(
              "relative rounded-lg border overflow-hidden group bg-card h-[300px] flex flex-col video-card",
              canSeeVideoDetails(video) ? "cursor-pointer hover:ring-2 ring-primary/20" : "",
              selectMode && selectedVideos.includes(video.id) ? "ring-2 ring-primary" : "ring-0"
            )}
            onClick={() => selectMode 
              ? toggleSelectVideo(video.id)
              : canSeeVideoDetails(video) && handleVideoClick(video)
            }
            data-video-id={video.id}
          >
            {/* Selection checkbox */}
            {user?.role === "admin" && selectMode && (
              <div className="absolute top-2 left-2 z-10">
                <div className={cn(
                  "p-1.5 rounded-md transition-colors bg-background/90", 
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
            <div className="h-[160px] relative">
              <ThumbnailPreview
                src={video.thumbnailUrl}
                alt={video.title}
                aspectRatio="video"
                showPlaceholder={true}
                className="object-cover h-full w-full"
              />
            </div>
            
            {/* Content */}
            <div className="p-4 flex flex-col flex-1">
              <Badge variant="secondary" className={cn(
                "capitalize text-xs self-start mb-2",
                getStatusBadgeColor(video.status)
              )}>
                {getStatusLabel(user!.role, video)}
              </Badge>
              
              <h3 className="font-medium text-sm line-clamp-2 mb-1">
                {video.optimizedTitle || video.title}
              </h3>
              
              {video.seriesNumber && (
                <p className="text-xs text-muted-foreground mb-1">
                  Serie: {video.seriesNumber}
                </p>
              )}
              
              <p className="text-xs text-muted-foreground line-clamp-2 mb-auto">
                {video.description || "No hay descripción disponible"}
              </p>
              
              <div className="flex justify-between items-center mt-4 text-xs text-muted-foreground">
                <span>{formatDate(video.updatedAt, false)}</span>
                <UserBadges video={video} compact={true} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  function getListView() {
    return (
      <div className="space-y-4">
        {filteredVideos?.map((video) => (
          <div 
            key={video.id} 
            className={cn(
              "border rounded-lg p-4 flex gap-6 bg-card group video-card",
              canSeeVideoDetails(video) ? "cursor-pointer hover:bg-muted/50" : "",
              selectMode && selectedVideos.includes(video.id) ? "bg-muted/50 ring-1 ring-primary" : ""
            )}
            onClick={() => selectMode 
              ? toggleSelectVideo(video.id)
              : canSeeVideoDetails(video) && handleVideoClick(video)
            }
            data-video-id={video.id}
          >
            {/* Selection checkbox */}
            {user?.role === "admin" && selectMode && (
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
            )}
            
            {/* Thumbnail */}
            <div className="w-[180px] h-[100px] rounded overflow-hidden flex-shrink-0 hidden sm:block">
              <ThumbnailPreview
                src={video.thumbnailUrl}
                alt={video.title}
                aspectRatio="video"
                showPlaceholder={true}
              />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <h3 className="font-medium line-clamp-1 text-base">
                  {video.optimizedTitle || video.title}
                </h3>
                
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={cn(
                    "capitalize text-xs shrink-0",
                    getStatusBadgeColor(video.status)
                  )}>
                    {getStatusLabel(user!.role, video)}
                  </Badge>
                  
                  {video.seriesNumber && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      Serie: {video.seriesNumber}
                    </span>
                  )}
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {video.description || "No hay descripción disponible"}
              </p>
              
              <div className="flex justify-between items-center mt-4 text-xs text-muted-foreground">
                <span>{formatDate(video.updatedAt, false)}</span>
                <UserBadges video={video} compact={true} />
              </div>
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
              await updateVideo({ 
                videoId: selectedVideo.id, 
                projectId: selectedVideo.projectId, 
                updateRequest: data 
              });
              
              if (!keepDialog) {
                setSelectedVideo(undefined);
              }
              
              toast.success("Video actualizado", {
                description: "Los cambios se han guardado correctamente",
              });
            } catch (error) {
              console.error("Error updating video:", error);
              toast.error("Error", {
                description: "No se pudo actualizar el video. Intente de nuevo.",
              });
            } finally {
              setUpdatingVideoId(undefined);
            }
          }}
        />
      </Dialog>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Videos</h1>
          <p className="text-muted-foreground">
            {activeTab === "videos" ? `${videos.length} videos disponibles` : `${trashVideos.length} videos en papelera`}
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          {/* Buscador en la parte superior junto a los botones principales */}
          <div className="flex-1 min-w-[250px]">
            <Input
              placeholder="Buscar por título, serie, descripción, creador u optimizador"
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="w-full pl-4 h-9 text-base"
            />
          </div>
              
          <Button
            variant={showFilters ? "default" : "outline"}
            className="flex items-center gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
            {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
          </Button>
          
          {user?.role === "admin" && activeTab === "videos" && (
            <Button onClick={() => setNewVideoDialogOpen(true)} className="gap-2 whitespace-nowrap">
              <Plus className="w-4 h-4" />
              Nuevo Video
            </Button>
          )}
        </div>
        
        {/* Controles de selección y vista, ahora debajo del buscador */}
        {activeTab === "videos" && (
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {user?.role === "admin" && (
              <Button
                variant="outline"
                className="flex items-center gap-2 relative"
                onClick={toggleSelectionMode}
              >
                {selectMode ? (
                  <>
                    <CheckSquare className="w-4 h-4" />
                    <span>Salir de selección</span>
                  </>
                  
                ) : (
                  <>
                    <Square className="w-4 h-4" />
                    Seleccionar videos
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
            {videos.length > 0 && (
              <p className="text-sm text-muted-foreground ml-2">
                Mostrando {filteredVideos.length} de {videos.length} videos
              </p>
            )}
          </div>
        )}
      </div>

      {/* Tabs para videos normales o papelera */}
      {user?.role === "admin" && (
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as "videos" | "trash")}
          className="w-full"
        >
          <TabsList className="w-full md:w-auto mb-4">
            <TabsTrigger value="videos" className="flex items-center gap-1.5">
              <FileVideo className="h-4 w-4" />
              <span>Videos</span>
              <Badge variant="secondary" className="ml-1.5 bg-primary/10">{videos.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="trash" className="flex items-center gap-1.5">
              <Trash2 className="h-4 w-4" />
              <span>Papelera</span>
              {trashVideos.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 bg-destructive/10">{trashVideos.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="videos" className="m-0 space-y-6">
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
            {selectMode && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
                {selectedVideos.length > 0 ? (
                  <>
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
                              Esta acción moverá {selectedVideos.length} videos seleccionados a la papelera. Podrás restaurarlos más tarde.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleBulkDelete}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Mover a la papelera
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <span className="bg-primary/10 p-1 rounded">
                        <HelpCircle className="w-3 h-3 text-primary" />
                      </span>
                      <span>Arrastra para seleccionar múltiples videos</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <kbd className="px-1.5 py-0.5 bg-muted-foreground/20 rounded text-[10px]">Shift</kbd>
                      <span>Añadir a selección</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <kbd className="px-1.5 py-0.5 bg-muted-foreground/20 rounded text-[10px]">Esc</kbd>
                      <span>Salir</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <kbd className="px-1.5 py-0.5 bg-muted-foreground/20 rounded text-[10px]">Ctrl+A</kbd>
                      <span>Seleccionar todo</span>
                    </div>
                  </div>
                )}
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
              {isDragging && (
                <div
                  ref={dragSelectionRef}
                  style={getSelectionRectStyle()}
                ></div>
              )}
              
              {filteredVideos.length === 0 ? renderEmptyState() : (
                <>
                  {viewMode === "table" && getTableView()}
                  {viewMode === "grid" && getGridView()}
                  {viewMode === "list" && getListView()}
                </>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="trash" className="m-0">
            {getTrashContent()}
          </TabsContent>
        </Tabs>
      )}
      
      {/* Si no es admin, muestra directamente el contenido de videos sin pestañas */}
      {user?.role !== "admin" && (
        <>
          {/* Añadimos los controles de vista para usuarios no admin */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
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
            {videos.length > 0 && (
              <p className="text-sm text-muted-foreground ml-2">
                Mostrando {filteredVideos.length} de {videos.length} videos
              </p>
            )}
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
          
          <div className="relative">
            {filteredVideos.length === 0 ? renderEmptyState() : (
              <>
                {viewMode === "table" && getTableView()}
                {viewMode === "grid" && getGridView()}
                {viewMode === "list" && getListView()}
              </>
            )}
          </div>
        </>
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