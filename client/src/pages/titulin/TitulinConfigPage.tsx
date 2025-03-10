import React, { useState, useEffect } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { GitCompareArrows, Youtube, Trash2, RefreshCw, CheckCircle, XCircle, Info } from "lucide-react";
import { Channel } from "./types";
import { TitleComparisonDialog } from "./components/TitleComparisonDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function TitulinConfigPage() {
  const [channelUrl, setChannelUrl] = useState("");
  const [isAddingChannel, setIsAddingChannel] = useState(false);
  const [showComparisonDialog, setShowComparisonDialog] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [syncingChannel, setSyncingChannel] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Obtener canales
  const { 
    data: channels,
    isLoading: isLoadingChannels,
    refetch: refetchChannels
  } = useQuery<Channel[]>({
    queryKey: ["youtube-channels"],
    queryFn: async () => {
      const response = await axios.get("/api/titulin/channels");
      return response.data;
    },
  });

  // Mutación para agregar un nuevo canal
  const addChannelMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await axios.post("/api/titulin/channels", { url });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Canal agregado correctamente");
      setChannelUrl("");
      setIsAddingChannel(false);
      queryClient.invalidateQueries({ queryKey: ["youtube-channels"] });
    },
    onError: (error) => {
      console.error("Error adding channel:", error);
      toast.error("Error al agregar el canal");
      setIsAddingChannel(false);
    }
  });

  // Mutación para eliminar un canal
  const deleteChannelMutation = useMutation({
    mutationFn: async (channelId: string) => {
      const response = await axios.delete(`/api/titulin/channels/${channelId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Canal eliminado correctamente");
      queryClient.invalidateQueries({ queryKey: ["youtube-channels"] });
    },
    onError: (error) => {
      console.error("Error deleting channel:", error);
      toast.error("Error al eliminar el canal");
    }
  });

  // Mutación para sincronizar videos de un canal
  const syncChannelMutation = useMutation({
    mutationFn: async (channelId: string) => {
      const response = await axios.post(`/api/titulin/channels/sync/${channelId}`);
      return response.data;
    },
    onSuccess: (_, channelId) => {
      toast.success("Canal sincronizado correctamente");
      setSyncingChannel(null);
      queryClient.invalidateQueries({ queryKey: ["youtube-channels"] });
      queryClient.invalidateQueries({ queryKey: ["youtube-videos"] });
      queryClient.invalidateQueries({ queryKey: ["youtube-videos-stats"] });
    },
    onError: (error) => {
      console.error("Error syncing channel:", error);
      toast.error("Error al sincronizar el canal");
      setSyncingChannel(null);
    }
  });

  // Handler para agregar canal
  const handleAddChannel = () => {
    if (!channelUrl) {
      toast.error("Introduce la URL del canal");
      return;
    }

    setIsAddingChannel(true);
    addChannelMutation.mutate(channelUrl);
  };

  // Handler para eliminar canal
  const handleDeleteChannel = (channelId: string) => {
    if (window.confirm("¿Estás seguro de eliminar este canal? Se eliminarán también todos sus videos.")) {
      deleteChannelMutation.mutate(channelId);
    }
  };

  // Handler para sincronizar canal
  const handleSyncChannel = (channelId: string) => {
    setSyncingChannel(channelId);
    syncChannelMutation.mutate(channelId);
  };

  // Formatear fecha
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nunca";
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('es', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      return "Fecha inválida";
    }
  };

  // Abrir diálogo de comparación con un canal preseleccionado
  const openComparisonDialog = (channelId: string) => {
    setSelectedChannelId(channelId);
    setShowComparisonDialog(true);
  };

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Youtube className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Configuración de Titulin</h1>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={() => setShowComparisonDialog(true)}
          >
            <GitCompareArrows className="h-4 w-4" />
            Comparar Títulos
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Canales de YouTube</CardTitle>
            <CardDescription>
              Administra los canales de YouTube para la comparación de títulos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex gap-2">
                <Input
                  placeholder="URL del canal de YouTube (ej: https://www.youtube.com/c/nombrecanal)"
                  value={channelUrl}
                  onChange={(e) => setChannelUrl(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleAddChannel} 
                  disabled={isAddingChannel || !channelUrl}
                >
                  {isAddingChannel ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Agregando...
                    </>
                  ) : "Agregar Canal"}
                </Button>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Información</AlertTitle>
                <AlertDescription>
                  Los canales agregados aquí estarán disponibles para comparar títulos en la herramienta de comparación.
                  Se obtendrán los videos más recientes del canal para su análisis.
                </AlertDescription>
              </Alert>
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <h3 className="text-lg font-medium">Canales Agregados</h3>
              {isLoadingChannels ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : channels && channels.length > 0 ? (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {channels.map((channel) => (
                      <Card key={channel.id} className="p-4">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                              <h4 className="font-semibold">{channel.name}</h4>
                              <Badge variant="outline" className="w-fit">
                                {channel.channelId}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm text-muted-foreground">
                              <div>
                                <strong>Última actualización:</strong> {formatDate(channel.lastVideoFetch)}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    size="icon" 
                                    variant="ghost"
                                    onClick={() => openComparisonDialog(channel.channelId)}
                                  >
                                    <GitCompareArrows className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Comparar títulos con este canal</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    size="icon" 
                                    variant="ghost"
                                    onClick={() => handleSyncChannel(channel.channelId)}
                                    disabled={syncingChannel === channel.channelId}
                                  >
                                    {syncingChannel === channel.channelId ? (
                                      <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <RefreshCw className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Sincronizar videos</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    size="icon" 
                                    variant="ghost"
                                    onClick={() => handleDeleteChannel(channel.channelId)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Eliminar canal</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No hay canales agregados. Agrega tu primer canal de YouTube.</p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => refetchChannels()}>
              Refrescar Lista
            </Button>
            <Button
              variant="default"
              onClick={() => setShowComparisonDialog(true)}
            >
              Abrir Comparador de Títulos
            </Button>
          </CardFooter>
        </Card>

        {/* Modal para comparación de títulos */}
        <TitleComparisonDialog
          open={showComparisonDialog}
          onOpenChange={setShowComparisonDialog}
          initialChannelId={selectedChannelId}
        />
      </div>
    </div>
  );
}