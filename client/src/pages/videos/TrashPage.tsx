import { useState, useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import { useVideos, ApiVideo } from "@/hooks/useVideos";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Loader2,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { getStatusBadgeColor, getStatusLabel } from "@/lib/status-labels";
import { Badge } from "@/components/ui/badge";
import { ThumbnailPreview } from "@/components/ui/thumbnail-preview";
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

export default function TrashPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const [trashVideos, setTrashVideos] = useState<ApiVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentProject, setCurrentProject] = useState<number>(1); // Valor por defecto, ajustar según sea necesario
  const { restoreVideo, emptyTrash, getTrashVideos } = useVideos();

  useEffect(() => {
    loadTrashVideos();
  }, []);

  const loadTrashVideos = async () => {
    setIsLoading(true);
    try {
      const videos = await getTrashVideos({ projectId: currentProject });
      setTrashVideos(videos);
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
    } catch (error) {
      console.error("Error al restaurar el video:", error);
      toast.error("Error al restaurar el video");
    }
  };

  const handleEmptyTrash = async () => {
    try {
      await emptyTrash({ projectId: currentProject });
      toast.success("Papelera vaciada correctamente");
      setTrashVideos([]); // Limpiar la lista local de videos
    } catch (error) {
      console.error("Error al vaciar la papelera:", error);
      toast.error("Error al vaciar la papelera");
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/videos">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-4 h-4" />
              <span className="sr-only">Volver</span>
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Papelera de Reciclaje</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={loadTrashVideos}
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>
          
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
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
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
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="">Miniatura</TableHead>
                    <TableHead className="">Serie</TableHead>
                    <TableHead className="">Título</TableHead>
                    <TableHead className="">Estado</TableHead>
                    <TableHead className="">Fecha de eliminación</TableHead>
                    <TableHead className="">Eliminado por</TableHead>
                    <TableHead className=" text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trashVideos?.map((video) => (
                    <TableRow key={video.id} className="group video-card" data-video-id={video.id}>
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
                        {video.deletedByName || (video.deletedBy ? `Usuario #${video.deletedBy}` : "-")}
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
            {trashVideos.map((video) => (
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
                        <span> por {video.deletedByName || `Usuario #${video.deletedBy}`}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="ml-3">
                  {/* Solo el creador o un administrador puede restaurar */}
                  {(user.role === "admin" || video.createdBy === user.id) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestoreVideo(video.id)}
                      className="h-8 gap-1 border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Restaurar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}