import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  Loader2, 
  Trash2, 
  Video, 
  RefreshCw, 
  BookText, 
  BarChart3,
  Youtube,
  Database,
  Settings,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Zap,
  Search
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { formatDistanceToNow, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { YoutubeChannel } from "@db/schema";
import { ImprovedTrainingExamplesDialog } from "../../../../titulin/components/ImprovedTrainingExamplesDialog";
import { TitleComparisonDialog } from "../../../../titulin/components/TitleComparisonDialog";


export default function TitulinTab () {
  const [isAddingChannel, setIsAddingChannel] = useState(false);
  const [newChannelUrl, setNewChannelUrl] = useState("");
  const [syncingChannelId, setSyncingChannelId] = useState<number | null>(null);
  const [deletingChannelId, setDeletingChannelId] = useState<number | null>(null);
  const [showTrainingExamples, setShowTrainingExamples] = useState(false);
  const [showTitleComparison, setShowTitleComparison] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isCleaningOrphanedVideos, setIsCleaningOrphanedVideos] = useState(false);
  const queryClient = useQueryClient();

  // Consulta para canales
  const { data: channels = [], isLoading: isLoadingChannels } = useQuery<YoutubeChannel[]>({
    queryKey: ["titulin-channels"],
    queryFn: async () => {
      try {
        const response = await axios.get("/api/titulin/channels");
        return Array.isArray(response.data) ? response.data : [];
      } catch (error) {
        console.error('Error fetching channels:', error);
        toast.error("Error al cargar los canales");
        return [];
      }
    },
  });
  
  // Consulta para estadísticas
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ["titulin-stats"],
    queryFn: async () => {
      try {
        const response = await axios.get("/api/stats/overall");
        return response.data;
      } catch (error) {
        console.error('Error fetching stats:', error);
        return {
          total_videos: 0,
          total_optimizations: 0,
          total_uploads: 0,
          titulin_analyzed: 0,
          titulin_evergreen: 0
        };
      }
    },
  });
  
  // Consulta para estadísticas de canales y videos analizados de Titulin
  const { data: titulinStats, isLoading: isLoadingTitulinStats } = useQuery({
    queryKey: ["titulin-videos-stats"],
    queryFn: async () => {
      try {
        const response = await axios.get("/api/titulin/videos/stats");
        return response.data;
      } catch (error) {
        console.error('Error fetching titulin stats:', error);
        return {
          totalVideos: 0,
          analyzedVideos: 0,
          evergreenVideos: 0,
          totalViews: 0,
          totalLikes: 0,
          channelsCount: 0
        };
      }
    },
  });

  function formatLastUpdate (dateString?: string) {
    if (!dateString) return "Nunca";
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return "Nunca";
      return `Hace ${formatDistanceToNow(date, { locale: es })}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Nunca";
    }
  };

  const addChannelMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await axios.post("/api/titulin/channels", { url });
      return response.data;
    },
    onSuccess: () => {
      // Invalidar todas las consultas relacionadas para una actualización completa
      queryClient.invalidateQueries({ queryKey: ["titulin-channels"] });
      queryClient.invalidateQueries({ queryKey: ["titulin-videos-stats"] });
      queryClient.invalidateQueries({ queryKey: ["titulin-stats"] });
      // Dar un tiempo para que se completen las revalidaciones
      setTimeout(() => {
        toast.success("Canal añadido correctamente");
      }, 100);
      setNewChannelUrl("");
      // Reforzar la invalidación para asegurar que los datos sean frescos
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["titulin-channels"] });
      }, 300);
    },
    onError: (error) => {
      console.error("Error adding channel:", error);
      toast.error("No se pudo añadir el canal");
    },
    onSettled: () => {
      setIsAddingChannel(false);
    },
  });

  const deleteChannelMutation = useMutation({
    mutationFn: async (id: number) => {
      // await axios.delete(`/api/titulin/channels/${id}`);
      await fetch(`/api/titulin/channels/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      // Invalidar múltiples consultas relacionadas para asegurar que todo se actualice
      queryClient.invalidateQueries({ queryKey: ["titulin-channels"] });
      queryClient.invalidateQueries({ queryKey: ["titulin-videos-stats"] });
      queryClient.invalidateQueries({ queryKey: ["titulin-stats"] });
      // Dar tiempo para que ocurra la revalidación
      setTimeout(() => {
        toast.success("Canal eliminado correctamente");
      }, 100);
      // Reforzar con una segunda invalidación después de un tiempo
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["titulin-channels"] });
      }, 500);
    },
    onError: (error) => {
      console.error("Error deleting channel:", error);
      toast.error("No se pudo eliminar el canal");
    },
    onSettled: () => {
      setDeletingChannelId(null);
    },
  });

  const syncChannelMutation = useMutation({
    mutationFn: async (channelId: string) => {
      const response = await axios.post(`/api/titulin/channels/${channelId}/sync`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidar múltiples consultas relacionadas para una actualización completa
      queryClient.invalidateQueries({ queryKey: ["titulin-channels"] });
      queryClient.invalidateQueries({ queryKey: ["titulin-videos-stats"] });
      queryClient.invalidateQueries({ queryKey: ["titulin-stats"] });
      // Dar tiempo para que se completen las revalidaciones
      setTimeout(() => {
        toast.success("Canal sincronizado correctamente");
      }, 100);
    },
    onError: (error) => {
      console.error("Error syncing channel:", error);
      toast.error("No se pudo sincronizar el canal");
    },
    onSettled: () => {
      setSyncingChannelId(null);
    },
  });
  
  // Mutación para limpiar videos huérfanos
  const cleanupOrphanedVideosMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post("/api/titulin/cleanup/orphaned-videos");
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidar consultas relacionadas para actualizar los datos
      queryClient.invalidateQueries({ queryKey: ["titulin-videos-stats"] });
      queryClient.invalidateQueries({ queryKey: ["titulin-stats"] });
      
      const message = data.videosDeleted > 0 
        ? `Se eliminaron ${data.videosDeleted} videos huérfanos correctamente` 
        : "No se encontraron videos huérfanos para eliminar";
      
      toast.success(message);
    },
    onError: (error) => {
      console.error("Error limpiando videos huérfanos:", error);
      toast.error("No se pudieron limpiar los videos huérfanos");
    },
    onSettled: () => {
      setIsCleaningOrphanedVideos(false);
    },
  });

  const handleAddChannel = async () => {
    if (!newChannelUrl.trim()) return;
    setIsAddingChannel(true);
    addChannelMutation.mutate(newChannelUrl);
  };

  const handleDeleteChannel = async (id: number) => {
    setDeletingChannelId(id);
    deleteChannelMutation.mutate(id);
  };

  const handleSyncChannel = async (id: number, channelId: string) => {
    setSyncingChannelId(id);
    syncChannelMutation.mutate(channelId);
  };
  
  const handleCompareChannel = (channelId: string) => {
    setSelectedChannelId(channelId);
    setShowTitleComparison(true);
  };
  
  const cleanupOrphanedVideos = () => {
    setIsCleaningOrphanedVideos(true);
    cleanupOrphanedVideosMutation.mutate();
  };

  const isLoading = isLoadingChannels || isLoadingStats || isLoadingTitulinStats;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  // Obtener estadísticas para mostrar en el dashboard
  const totalVideos = titulinStats?.totalVideos || 0;
  const analyzedVideos = titulinStats?.analyzedVideos || 0;
  const evergreenVideos = titulinStats?.evergreenVideos || 0;
  const totalViews = titulinStats?.totalViews || 0;
  const channelsCount = channels?.length || 0;
  const activeChannels = channels?.filter(c => c.active)?.length || 0;
  
  // Calcular la fecha de la última actualización
  const getLastSyncDate = () => {
    if (!channels || channels.length === 0) return null;
    
    const lastUpdateDates = channels
      .filter(channel => channel.lastVideoFetch)
      .map(channel => ({
        date: channel.lastVideoFetch,
        channelName: channel.name
      }))
      .filter(item => isValid(item.date))
      .sort((a, b) => {
        const dateA = a.date ? a.date.getTime() : 0;
        const dateB = b.date ? b.date.getTime() : 0;
        return dateB - dateA;
      });
      
    return lastUpdateDates.length > 0 ? lastUpdateDates[0] : null;
  };
  
  const lastSync = getLastSyncDate();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Titulin - Análisis de Contenido</h2>
          <p className="text-sm text-muted-foreground">
            Gestiona los canales y ejemplos de entrenamiento para análisis de títulos
          </p>
        </div>

      </div>

      {/* Panel de Resumen */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-card to-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <Youtube className="mr-2 h-5 w-5 text-primary" />
              Canales Monitorizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-3xl font-bold">{channelsCount}</p>
                <p className="text-sm text-muted-foreground">
                  {activeChannels} activos
                </p>
              </div>
              {lastSync?.date && (
                <div className="text-right">
                  <p className="text-sm font-medium">Última actualización</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(lastSync.date, { locale: es, addSuffix: true })}
                  </p>
                  <p className="text-xs text-muted-foreground/70">{lastSync?.channelName}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <BarChart3 className="mr-2 h-5 w-5 text-primary" />
              Análisis de Videos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-3xl font-bold">{totalVideos}</p>
                <div className="flex items-center gap-1">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-primary">{analyzedVideos}</span> analizados
                  </p>
                  <span className="text-muted-foreground/50">|</span>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-primary">{evergreenVideos}</span> evergreen
                  </p>
                </div>
              </div>
              {analyzedVideos > 0 && (
                <div className="text-right">
                  <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted">
                    {Math.round((evergreenVideos / analyzedVideos) * 100)}% tasa evergreen
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <Zap className="mr-2 h-5 w-5 text-primary" />
              Rendimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-3xl font-bold">{totalViews.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">
                  Visualizaciones totales
                </p>
              </div>
              <div className="text-right">
                {analyzedVideos > 0 && (
                  <div className="text-sm font-medium">
                    {Math.round(totalViews / totalVideos).toLocaleString()} vistas por video
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navegación por pestañas */}
      <Tabs defaultValue="dashboard" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center">
            <BarChart3 className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
            <span className="sm:hidden">Info</span>
          </TabsTrigger>
          <TabsTrigger value="channels" className="flex items-center">
            <Youtube className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Canales</span>
            <span className="sm:hidden">Canales</span>
          </TabsTrigger>
          <TabsTrigger value="training" className="flex items-center">
            <BookText className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Entrenamiento</span>
            <span className="sm:hidden">IA</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Configuración</span>
            <span className="sm:hidden">Config</span>
          </TabsTrigger>
        </TabsList>

        {/* Contenido de la pestaña Dashboard */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estado del Sistema</CardTitle>
                <CardDescription>Estado general del análisis de contenido</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Canales activos</p>
                  <div className="flex items-center">
                    <Badge variant={activeChannels > 0 ? "default" : "destructive"}>
                      {activeChannels > 0 ? activeChannels : "Ninguno"}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-medium">Última sincronización</p>
                  <div className="flex items-center">
                    <Badge variant={lastSync ? "default" : "secondary"}>
                      {lastSync?.date ? formatDistanceToNow(lastSync.date, { locale: es, addSuffix: true }) : "Nunca"}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-medium">Videos analizados</p>
                  <div className="flex items-center">
                    <Badge variant={analyzedVideos > 0 ? "default" : "secondary"}>
                      {analyzedVideos > 0 ? `${analyzedVideos} (${Math.round((analyzedVideos / totalVideos) * 100)}%)` : "Ninguno"}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-medium">Calidad de datos</p>
                  <div className="flex items-center">
                    <Badge variant={analyzedVideos > 100 ? "default" : analyzedVideos > 0 ? "outline" : "secondary"}>
                      {analyzedVideos > 100 ? "Óptima" : analyzedVideos > 0 ? "Mejorando" : "Insuficiente"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => setActiveTab("channels")}>
                  Gestionar Canales
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
                <CardDescription>Acciones comunes para gestionar el análisis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full flex items-center justify-between" onClick={() => setShowTrainingExamples(true)}>
                  <div className="flex items-center">
                    <BookText className="mr-2 h-4 w-4" />
                    Gestionar Ejemplos de Entrenamiento
                  </div>
                  <span>&rarr;</span>
                </Button>
                <Button variant="outline" className="w-full flex items-center justify-between" onClick={() => setActiveTab("channels")}>
                  <div className="flex items-center">
                    <Youtube className="mr-2 h-4 w-4" />
                    Añadir Nuevo Canal
                  </div>
                  <span>&rarr;</span>
                </Button>
                {channels.length > 0 && (
                  <Button variant="outline" className="w-full flex items-center justify-between" 
                    onClick={() => {
                      const activeChannel = channels.find(c => c.active);
                      if (activeChannel) handleSyncChannel(activeChannel.id, activeChannel.channelId);
                    }}
                    disabled={!channels.some(c => c.active)}
                  >
                    <div className="flex items-center">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sincronizar Canales
                    </div>
                    <span>&rarr;</span>
                  </Button>
                )}
                <Button variant="outline" className="w-full flex items-center justify-between" onClick={() => setActiveTab("settings")}>
                  <div className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Configuración de Análisis
                  </div>
                  <span>&rarr;</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Contenido de la pestaña Canales */}
        <TabsContent value="channels" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Añadir Nuevo Canal</CardTitle>
              <CardDescription>Agrega un canal de YouTube para monitorizar y analizar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <Input
                  placeholder="URL del canal de YouTube (ej: https://youtube.com/c/nombrecanal)"
                  value={newChannelUrl}
                  onChange={(e) => setNewChannelUrl(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleAddChannel}
                  disabled={isAddingChannel || !newChannelUrl}
                >
                  {isAddingChannel ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Añadir Canal
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Canales Monitorizados</CardTitle>
              <CardDescription>Lista de canales configurados para análisis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Thumbnail</TableHead>
                      <TableHead>Canal</TableHead>
                      <TableHead>Videos Analizados</TableHead>
                      <TableHead>Última Sincronización</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-[150px] text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {channels.length > 0 ? (
                      channels.map((channel) => (
                        <TableRow key={channel.id}>
                          <TableCell>
                            <div className="w-16 h-12 bg-muted rounded overflow-hidden">
                              {channel.thumbnailUrl ? (
                                <img
                                  src={channel.thumbnailUrl}
                                  alt={channel.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                  No img
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Video className="h-4 w-4 text-muted-foreground" />
                              {channel.name}
                            </div>
                          </TableCell>
                          <TableCell>{channel.videoCount || 0}</TableCell>
                          <TableCell>
                            { typeof channel.lastVideoFetch }
                            {/* {formatLastUpdate(channel.lastVideoFetch?.toDateString())} */}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={channel.active ? "default" : "secondary"}
                              className="capitalize"
                            >
                              {channel.active ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleSyncChannel(channel.id, channel.channelId )}
                                disabled={syncingChannelId === channel.id}
                              >
                                {syncingChannelId === channel.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCompareChannel(channel.id.toString())}
                                disabled={syncingChannelId === channel.id}
                                className="text-primary"
                              >
                                <Search className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Eliminar canal?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta acción no se puede deshacer. Se eliminará el canal y
                                      todo su historial de análisis.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteChannel(channel.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      disabled={deletingChannelId === channel.id}
                                    >
                                      {deletingChannelId === channel.id ? (
                                        <>
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          Eliminando...
                                        </>
                                      ) : (
                                        "Eliminar"
                                      )}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          <div className="text-muted-foreground">
                            No hay canales configurados
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contenido de la pestaña Entrenamiento */}
        <TabsContent value="training" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Entrenamiento de Titulin</CardTitle>
              <CardDescription>Gestiona los ejemplos que entrenan el sistema de análisis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg p-6 bg-muted/50 border text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <BookText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">Ejemplos de Entrenamiento</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Los ejemplos de entrenamiento son títulos de videos clasificados como "evergreen" o "no evergreen"
                  que se utilizan para entrenar el algoritmo de análisis.
                </p>
                <Button onClick={() => setShowTrainingExamples(true)}>
                  Gestionar Ejemplos
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                      Ejemplos Positivos (Evergreen)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Títulos que funcionan a largo plazo, generan tráfico constante y tienen relevancia duradera.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center">
                      <XCircle className="h-4 w-4 text-red-500 mr-2" />
                      Ejemplos Negativos (No Evergreen)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Títulos que pierden relevancia rápidamente, suelen ser tendencias pasajeras o noticias temporales.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contenido de la pestaña Configuración */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuración de Análisis</CardTitle>
              <CardDescription>Ajusta la forma en que funciona el sistema de análisis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">Sincronización Automática</label>
                    <p className="text-xs text-muted-foreground">
                      Actualiza automáticamente los canales cada 24 horas
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">Análisis Automático</label>
                    <p className="text-xs text-muted-foreground">
                      Analiza nuevos videos automáticamente al sincronizar
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">Umbral de Confianza</label>
                    <p className="text-xs text-muted-foreground">
                      Nivel mínimo de confianza para clasificar un video como evergreen
                    </p>
                  </div>
                  <div className="w-24">
                    <Input defaultValue="70%" />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Guardar Configuración</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mantenimiento de Datos</CardTitle>
              <CardDescription>Herramientas para mantener la integridad de los datos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="border rounded-lg p-4 bg-muted/50">
                  <div className="flex flex-col space-y-2 mb-4">
                    <h3 className="text-sm font-semibold flex items-center">
                      <Database className="h-4 w-4 mr-2 text-primary" />
                      Limpieza de Videos Huérfanos
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Elimina los videos que quedaron huérfanos porque su canal fue eliminado.
                      Esta operación también elimina los ejemplos de entrenamiento asociados a estos videos.
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full border-dashed" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Limpiar Videos Huérfanos
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar videos huérfanos?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción eliminará todos los videos cuyos canales ya no existen en la base de datos.
                          También se eliminarán los ejemplos de entrenamiento derivados de estos videos.
                          Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={cleanupOrphanedVideos}>
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Diálogo de ejemplos de entrenamiento */}
      <ImprovedTrainingExamplesDialog
        open={showTrainingExamples}
        onOpenChange={setShowTrainingExamples}
      />
      
      {/* Diálogo de comparación de títulos */}
      <TitleComparisonDialog
        open={showTitleComparison}
        onOpenChange={setShowTitleComparison}
        initialChannelId={selectedChannelId}
      />
    </div>
  );
};