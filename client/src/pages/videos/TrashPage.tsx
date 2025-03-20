import { useState, useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import { useVideos, ApiVideo } from "@/hooks/useVideos";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { MascotLoader } from "@/components/ui/mascot-loader";
import {
  ArrowLeft,
  Loader2,
  Trash2,
  RefreshCw,
  Search,
  CheckSquare,
  Square,
  Filter,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { getStatusBadgeColor, getStatusLabel } from "@/lib/status-labels";
import { Badge } from "@/components/ui/badge";
import { ThumbnailPreview } from "@/components/ui/thumbnail-preview";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Link } from "wouter";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SortingState {
  id: string;
  desc: boolean;
}

export default function TrashPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const [trashVideos, setTrashVideos] = useState<ApiVideo[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<ApiVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentProject, setCurrentProject] = useState<number>(1); // Valor por defecto, ajustar según sea necesario
  const { restoreVideo, emptyTrash, getTrashVideos, deleteVideo } = useVideos();

  // Estados para selección múltiple
  const [selectedVideos, setSelectedVideos] = useState<number[]>([]);
  const [selectMode, setSelectMode] = useState(false);

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [retentionTime, setRetentionTime] = useState<"all" | "expiring">("all");
  const [sorting, setSorting] = useState<SortingState[]>([{ id: 'deletedAt', desc: true }]);


  useEffect(() => {
    loadTrashVideos();
  }, []);

  // Efecto para filtrar videos
  useEffect(() => {
    filterVideos();
  }, [trashVideos, searchTerm, statusFilter, retentionTime, sorting]);

  // Función de ordenamiento mejorada
  const filterVideos = () => {
    let filtered = Array.isArray(trashVideos) ? [...trashVideos] : [];

    // Filtros existentes
    if (searchTerm) {
      filtered = filtered.filter(video =>
        video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (video.optimizedTitle && video.optimizedTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (video.description && video.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(video => video.status === statusFilter);
    }

    if (retentionTime === "expiring") {
      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
      filtered = filtered.filter(video => {
        if (!video.deletedAt) return false;
        const deletedDate = new Date(video.deletedAt);
        return deletedDate <= fifteenDaysAgo;
      });
    }

    // Ordenamiento mejorado
    if (sorting.length > 0) {
      const { id: sortField, desc } = sorting[0];

      filtered.sort((a, b) => {
        let aValue = a[sortField as keyof typeof a];
        let bValue = b[sortField as keyof typeof b];

        // Manejar diferentes tipos de datos
        if (sortField === 'deletedAt' || sortField === 'createdAt' || sortField === 'updatedAt') {
          aValue = aValue ? new Date(aValue).getTime() : 0;
          bValue = bValue ? new Date(bValue).getTime() : 0;
        } else if (sortField === 'seriesNumber') {
          aValue = Number(aValue) || 0;
          bValue = Number(bValue) || 0;
        } else {
          aValue = String(aValue || '').toLowerCase();
          bValue = String(bValue || '').toLowerCase();
        }

        if (desc) {
          return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
        }
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      });
    }

    setFilteredVideos(filtered);
  };

  const loadTrashVideos = async () => {
    setIsLoading(true);
    try {
      const videos = await getTrashVideos({ projectId: currentProject });
      setTrashVideos(videos);
      setFilteredVideos(videos);
    } catch (error) {
      console.error("Error al cargar los videos de la papelera:", error);
      toast.error("Error al cargar los videos de la papelera");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreVideo = async (videoId: number) => {
    try {
      await restoreVideo({ videoId, projectId: currentProject });
      toast.success("Video restaurado correctamente");
      loadTrashVideos(); // Recargar la lista después de restaurar

      // Si estaba seleccionado, quitar de la selección
      if (selectedVideos.includes(videoId)) {
        setSelectedVideos(prev => prev.filter(id => id !== videoId));
      }
    } catch (error) {
      console.error("Error al restaurar el video:", error);
      toast.error("Error al restaurar el video");
    }
  };

  const handleBulkRestore = async () => {
    if (selectedVideos.length === 0) return;

    setIsLoading(true);
    let successCount = 0;
    let errorCount = 0;

    // Restaurar videos secuencialmente para evitar problemas
    for (const videoId of selectedVideos) {
      try {
        await restoreVideo({ videoId, projectId: currentProject });
        successCount++;
      } catch (error) {
        console.error(`Error al restaurar el video ${videoId}:`, error);
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} videos restaurados correctamente`);
    }

    if (errorCount > 0) {
      toast.error(`No se pudieron restaurar ${errorCount} videos`);
    }

    setSelectedVideos([]);
    loadTrashVideos();
  };

  const handleEmptyTrash = async () => {
    try {
      await emptyTrash({ projectId: currentProject });
      toast.success("Papelera vaciada correctamente");
      setTrashVideos([]); // Limpiar la lista local de videos
      setFilteredVideos([]);
      setSelectedVideos([]);
    } catch (error) {
      console.error("Error al vaciar la papelera:", error);
      toast.error("Error al vaciar la papelera");
    }
  };

  const handleDeletePermanently = async (videoId: number) => {
    try {
      await deleteVideo({
        videoId,
        projectId: currentProject,
        permanent: true
      });
      toast.success("Video eliminado permanentemente");
      loadTrashVideos(); // Recargar la lista
    } catch (error) {
      console.error("Error al eliminar permanentemente el video:", error);
      toast.error("Error al eliminar permanentemente el video");
    }
  };

  const handleBulkDeletePermanently = async () => {
    if (selectedVideos.length === 0) return;

    setIsLoading(true);
    let successCount = 0;
    let errorCount = 0;

    // Eliminar videos secuencialmente para evitar problemas
    for (const videoId of selectedVideos) {
      try {
        await deleteVideo({
          videoId,
          projectId: currentProject,
          permanent: true
        });
        successCount++;
      } catch (error) {
        console.error(`Error al eliminar permanentemente el video ${videoId}:`, error);
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} videos eliminados permanentemente`);
    }

    if (errorCount > 0) {
      toast.error(`No se pudieron eliminar ${errorCount} videos`);
    }

    setSelectedVideos([]);
    loadTrashVideos();
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
      // Si desactivamos el modo selección, limpiamos la lista
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

  // Función para manejar el ordenamiento
  const handleSort = (columnId: string) => {
    setSorting(old => {
      if (old[0]?.id === columnId) {
        return [{ id: columnId, desc: !old[0].desc }];
      }
      return [{ id: columnId, desc: true }];
    });
  };

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <MascotLoader animation="thinking" size="lg" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link href="/videos">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-4 h-4" />
                <span className="sr-only">Volver</span>
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Papelera de Reciclaje</h1>
            <Badge variant="outline" className="ml-2">
              {filteredVideos.length} videos
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Modo Selección */}
            {user.role === "admin" && filteredVideos.length > 0 && (
              <>
                {selectMode ? (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={toggleSelectionMode}
                      className="gap-1.5"
                    >
                      <Square className="h-4 w-4" />
                      Salir del modo selección
                    </Button>

                    {selectedVideos.length > 0 && (
                      <>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="default"
                              className="gap-1.5 bg-green-600 hover:bg-green-700"
                            >
                              <RefreshCw className="h-4 w-4" />
                              Restaurar seleccionados ({selectedVideos.length})
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar restauración</AlertDialogTitle>
                              <AlertDialogDescription>
                                ¿Deseas restaurar {selectedVideos.length} videos seleccionados de la papelera?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="gap-2">
                              <AlertDialogCancel className="mt-0">Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleBulkRestore}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                Restaurar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-1.5"
                            >
                              <Trash2 className="h-4 w-4" />
                              Eliminar seleccionados ({selectedVideos.length})
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminarán permanentemente {selectedVideos.length} videos seleccionados.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="gap-2">
                              <AlertDialogCancel className="mt-0">Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleBulkDeletePermanently}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Eliminar permanentemente
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectionMode}
                    className="gap-1.5"
                  >
                    <CheckSquare className="h-4 w-4" />
                    Modo selección
                  </Button>
                )}
              </>
            )}

            {/* Botón búsqueda/filtros */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn("gap-1.5", (searchTerm || statusFilter !== "all" || retentionTime !== "all") && "bg-muted")}
                >
                  <Filter className="h-4 w-4" />
                  Filtros {(searchTerm || statusFilter !== "all" || retentionTime !== "all") &&
                    <Badge className="ml-1 bg-primary text-white" variant="default">
                      {[
                        searchTerm ? 1 : 0,
                        statusFilter !== "all" ? 1 : 0,
                        retentionTime !== "all" ? 1 : 0
                      ].reduce((a, b) => a + b, 0)}
                    </Badge>
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Filtros de búsqueda</h4>

                  <div className="space-y-2">
                    <label className="text-xs font-medium">Buscar por título o descripción</label>
                    <div className="flex items-center border rounded-md pl-2 overflow-hidden focus-within:ring-1 focus-within:ring-primary">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Título o descripción..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium">Estado</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los estados" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los estados</SelectItem>
                        <SelectItem value="available">Disponible</SelectItem>
                        <SelectItem value="content_corrections">Correcciones de contenido</SelectItem>
                        <SelectItem value="content_review">Revisión de contenido</SelectItem>
                        <SelectItem value="upload_media">Subida de medios</SelectItem>
                        <SelectItem value="media_corrections">Correcciones de medios</SelectItem>
                        <SelectItem value="media_review">Revisión de medios</SelectItem>
                        <SelectItem value="final_review">Revisión final</SelectItem>
                        <SelectItem value="completed">Completado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium">Tiempo de retención</label>
                    <Select value={retentionTime} onValueChange={(value) => setRetentionTime(value as "all" | "expiring")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los videos</SelectItem>
                        <SelectItem value="expiring">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-amber-500" />
                            <span>Por eliminar pronto</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-between pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter("all");
                        setRetentionTime("all");
                      }}
                    >
                      Limpiar filtros
                    </Button>
                    <Button size="sm">Aplicar</Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Botón actualizar */}
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={loadTrashVideos}
            >
              <RefreshCw className="w-4 w-4" />
              Actualizar
            </Button>

            {/* Botón vaciar papelera */}
            {user.role === "admin" && trashVideos.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-1 bg-red-600 hover:bg-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                          Vaciar papelera
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminarán permanentemente todos los videos en la papelera.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleEmptyTrash} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Vaciar papelera
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Elimina permanentemente todos los videos en la papelera</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Banner de información sobre tiempo de retención */}
          <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-400">Información sobre la papelera</CardTitle>
                <CardDescription className="text-xs text-amber-700 dark:text-amber-300">
                  Los videos en la papelera se eliminarán permanentemente después de 30 días.
                  Para recuperar un video, utiliza el botón de restaurar correspondiente.
                  Los videos eliminados permanentemente no se pueden recuperar.
                </CardDescription>
              </div>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <MascotLoader animation="jump" size="lg" />
          </div>
        ) : trashVideos.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-card rounded-lg border border-dashed h-64">
            <div className="rounded-full bg-muted p-3 mb-4">
              <Trash2 className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">Papelera vacía</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
              No hay videos en la papelera. Los videos eliminados aparecerán aquí.
            </p>
            <Button variant="outline" asChild>
              <Link href="/videos">
                Volver a Gestión de Videos
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Vista de tabla para escritorio */}
            <div className="rounded-lg border bg-card shadow-sm overflow-hidden relative">
              {/* Accent gradient para la tabla de videos */}
              <div className="h-1 w-full bg-gradient-to-r from-red-600 via-red-500 to-pink-500 absolute top-0 left-0"></div>
              <div className="overflow-x-auto pt-1">
                <Table>
                  {/* Updated TableHeader */}
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      {selectMode && (
                        <TableHead className="w-[40px]">
                          <div className={cn(
                            "p-1.5 rounded-md transition-colors",
                            selectedVideos.length === filteredVideos.length && filteredVideos.length > 0
                              ? "bg-primary/20"
                              : "bg-card hover:bg-muted"
                          )}>
                            <Checkbox
                              checked={selectedVideos.length === filteredVideos.length && filteredVideos.length > 0}
                              onCheckedChange={toggleSelectAll}
                              className="h-4 w-4"
                              aria-label="Seleccionar todos"
                            />
                          </div>
                        </TableHead>
                      )}
                      <TableHead>Miniatura</TableHead>
                      <TableHead
                        onClick={() => handleSort('seriesNumber')}
                        className="cursor-pointer hover:bg-muted/60"
                      >
                        <div className="flex items-center gap-1">
                          Serie
                          {sorting[0]?.id === 'seriesNumber' && (
                            <span className="text-primary">
                              {sorting[0].desc ? ' ↓' : ' ↑'}
                            </span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead
                        onClick={() => handleSort('title')}
                        className="cursor-pointer hover:bg-muted/60"
                      >
                        <div className="flex items-center gap-1">
                          Título
                          {sorting[0]?.id === 'title' && (
                            <span className="text-primary">
                              {sorting[0].desc ? ' ↓' : ' ↑'}
                            </span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead
                        onClick={() => handleSort('status')}
                        className="cursor-pointer hover:bg-muted/60"
                      >
                        <div className="flex items-center gap-1">
                          Estado
                          {sorting[0]?.id === 'status' && (
                            <span className="text-primary">
                              {sorting[0].desc ? ' ↓' : ' ↑'}
                            </span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead
                        onClick={() => handleSort('deletedAt')}
                        className="cursor-pointer hover:bg-muted/60"
                      >
                        <div className="flex items-center gap-1">
                          Fecha de eliminación
                          {sorting[0]?.id === 'deletedAt' && (
                            <span className="text-primary">
                              {sorting[0].desc ? ' ↓' : ' ↑'}
                            </span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead
                        onClick={() => handleSort('deletedBy')}
                        className="cursor-pointer hover:bg-muted/60"
                      >
                        <div className="flex items-center gap-1">
                          Eliminado por
                          {sorting[0]?.id === 'deletedBy' && (
                            <span className="text-primary">
                              {sorting[0].desc ? ' ↓' : ' ↑'}
                            </span>
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVideos.map((video) => (
                      <TableRow
                        key={video.id}
                        className="group video-card"
                        data-video-id={video.id}
                        onClick={() => {
                          if (selectMode) toggleSelectVideo(video.id);
                        }}
                      >
                        {/* Checkbox de selección */}
                        {selectMode && (
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
                              showHoverActions={true}
                            />
                          </div>
                        </TableCell>
                        {/* Serie */}
                        <TableCell className="font-medium text-center">
                          {video.seriesNumber || "-"}
                        </TableCell>
                        {/* Título */}
                        <TableCell className="font-medium max-w-md">
                          <div className="space-y-1">
                            <span className="text-base line-clamp-1">{video.optimizedTitle || video.title}</span>
                            {video.description && (
                              <span className="text-xs text-muted-foreground line-clamp-1">{video.description}</span>
                            )}
                          </div>
                        </TableCell>
                        {/* Estado */}
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs capitalize",
                              getStatusBadgeColor(video.status)
                            )}
                          >
                            {getStatusLabel(user.role, video)}
                          </Badge>
                        </TableCell>
                        {/* Fecha de eliminación */}
                        <TableCell className="text-sm">
                          {video.deletedAt ? formatDate(video.deletedAt, true) : "Desconocido"}
                        </TableCell>
                        {/* Eliminado por */}
                        <TableCell className="text-sm">
                          {video.deletedByName || (video.deletedByUsername ? video.deletedByUsername : video.deletedBy ? `Usuario #${video.deletedBy}` : "-")}
                        </TableCell>
                        {/* Acciones */}
                        <TableCell className="text-right">
                          {(user.role === "admin" || video.createdBy === user.id) && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRestoreVideo(video.id)}
                                    className="h-8 gap-1 border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700"
                                  >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                    Restaurar
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Restaurar el video de la papelera</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Vista de lista para móviles */}
            <div className="block md:hidden space-y-3">
              {filteredVideos.map((video) => (
                <div
                  key={video.id}
                  className="group video-card relative flex items-center border-l-4 border-red-500 border rounded-lg p-3 bg-card shadow-sm hover:shadow-md transition-all"
                >
                  {/* Thumbnail */}
                  <div className="h-16 w-28 rounded overflow-hidden mr-3 flex-shrink-0">
                    <ThumbnailPreview
                      src={video.thumbnailUrl}
                      alt={video.title}
                      aspectRatio="video"
                      enableZoom={true}
                      showPlaceholder={true}
                      title={video.optimizedTitle || video.title}
                      showHoverActions={true}
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
                        {getStatusLabel(user.role, video)}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center mt-1">
                      <div className="text-xs text-muted-foreground">
                        <span>Eliminado: {video.deletedAt ? formatDate(video.deletedAt, true) : "Desconocido"}</span>
                        {video.deletedBy && (
                          <span> por {video.deletedByName || video.deletedByUsername || `Usuario #${video.deletedBy}`}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="ml-3">
                    {/* Solo el creador o un administrador puede restaurar */}
                    {(user.role === "admin" || video.createdBy === user.id) && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRestoreVideo(video.id)}
                              className="h-8 gap-1 border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              Restaurar
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Restaurar el video de la papelera</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}