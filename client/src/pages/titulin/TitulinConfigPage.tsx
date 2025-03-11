import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Trash2, RefreshCw, Plus, Youtube, Search, ArrowRightLeft } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import { TitleComparisonDialog } from './components/TitleComparisonDialog';

interface Channel {
  id: number;
  channelId: string;
  name: string;
  url: string;
  thumbnailUrl: string | null;
  description: string | null;
  subscriberCount: number | null;
  videoCount: number | null;
  lastVideoFetch: string | null;
  lastAnalysis: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function TitulinConfigPage() {
  const [newChannelUrl, setNewChannelUrl] = useState<string>('');
  const [addDialogOpen, setAddDialogOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [compareDialogOpen, setCompareDialogOpen] = useState<boolean>(false);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [syncingChannel, setSyncingChannel] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Consulta para obtener los canales
  const { data: channels, isLoading, isError, refetch } = useQuery({
    queryKey: ['titulin', 'channels'],
    queryFn: async () => {
      const response = await axios.get('/api/titulin/channels');
      return response.data;
    }
  });
  
  // Mutación para agregar un canal
  const addChannelMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await axios.post('/api/titulin/channels', { url });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['titulin', 'channels'] });
      setAddDialogOpen(false);
      setNewChannelUrl('');
      toast({
        title: "Canal agregado con éxito",
        description: "El canal se ha agregado y se están importando sus videos.",
      });
    },
    onError: (error: any) => {
      console.error("Error al agregar canal:", error);
      toast({
        title: "Error al agregar el canal",
        description: error.response?.data?.message || "Ocurrió un error al intentar agregar el canal.",
        variant: "destructive",
      });
    }
  });
  
  // Mutación para eliminar un canal
  const deleteChannelMutation = useMutation({
    mutationFn: async (channelId: string) => {
      const response = await axios.delete(`/api/titulin/channels/${channelId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['titulin', 'channels'] });
      setDeleteDialogOpen(false);
      setSelectedChannel(null);
      toast({
        title: "Canal eliminado con éxito",
        description: "El canal y todos sus videos han sido eliminados.",
      });
    },
    onError: (error: any) => {
      console.error("Error al eliminar canal:", error);
      toast({
        title: "Error al eliminar el canal",
        description: error.response?.data?.message || "Ocurrió un error al intentar eliminar el canal.",
        variant: "destructive",
      });
    }
  });
  
  // Mutación para sincronizar videos de un canal
  const syncChannelMutation = useMutation({
    mutationFn: async (channelId: string) => {
      setSyncingChannel(channelId);
      const response = await axios.post(`/api/titulin/channels/sync/${channelId}`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['titulin', 'channels'] });
      setSyncingChannel(null);
      toast({
        title: "Sincronización completada",
        description: `Se han sincronizado ${data.videoCount} videos del canal.`,
      });
    },
    onError: (error: any) => {
      console.error("Error al sincronizar canal:", error);
      setSyncingChannel(null);
      toast({
        title: "Error de sincronización",
        description: error.response?.data?.message || "Ocurrió un error al intentar sincronizar los videos del canal.",
        variant: "destructive",
      });
    }
  });
  
  const handleAddChannel = () => {
    if (!newChannelUrl.trim()) {
      toast({
        title: "URL no válida",
        description: "Por favor introduce una URL de canal de YouTube válida.",
        variant: "destructive",
      });
      return;
    }
    
    addChannelMutation.mutate(newChannelUrl);
  };
  
  const handleDeleteChannel = (channel: Channel) => {
    setSelectedChannel(channel);
    setDeleteDialogOpen(true);
  };
  
  const confirmDeleteChannel = () => {
    if (selectedChannel) {
      deleteChannelMutation.mutate(selectedChannel.channelId);
    }
  };
  
  const handleSyncChannel = (channelId: string) => {
    syncChannelMutation.mutate(channelId);
  };
  
  const handleCompareChannel = (channel: Channel) => {
    setSelectedChannel(channel);
    setCompareDialogOpen(true);
  };
  
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Nunca';
    
    try {
      const date = new Date(dateStr);
      return formatDistanceToNow(date, { addSuffix: true, locale: es });
    } catch (e) {
      return 'Fecha inválida';
    }
  };
  
  // Renderizar skeleton loader durante la carga
  if (isLoading) {
    return (
      <div className="container mx-auto py-10 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Configuración de Titulin</h1>
          <Skeleton className="h-10 w-40" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-64 mb-2" />
            <Skeleton className="h-5 w-full max-w-md" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Renderizar mensaje de error
  if (isError) {
    return (
      <div className="container mx-auto py-10">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>No se pudieron cargar los canales.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Ha ocurrido un error al intentar cargar los canales de YouTube. Por favor intenta de nuevo.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => refetch()}>Reintentar</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Configuración de Titulin</h1>
        <Button 
          onClick={() => setAddDialogOpen(true)} 
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          Agregar Canal
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Canales de YouTube</CardTitle>
          <CardDescription>
            Canales configurados para la comparación de títulos y generación de sugerencias.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {channels && channels.length > 0 ? (
            <Table>
              <TableCaption>Lista de canales de YouTube configurados.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Canal</TableHead>
                  <TableHead>Videos</TableHead>
                  <TableHead>Última sincronización</TableHead>
                  <TableHead className="w-[150px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {channels.map((channel: Channel) => (
                  <TableRow key={channel.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        {channel.thumbnailUrl ? (
                          <img 
                            src={channel.thumbnailUrl} 
                            alt={channel.name} 
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <Youtube size={16} />
                          </div>
                        )}
                        <div>
                          <div>{channel.name}</div>
                          <div className="text-sm text-muted-foreground">{channel.channelId}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{channel.videoCount || 0}</TableCell>
                    <TableCell>{formatDate(channel.lastVideoFetch)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          title="Probar comparación de títulos"
                          onClick={() => handleCompareChannel(channel)}
                        >
                          <ArrowRightLeft size={16} />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          title="Sincronizar videos"
                          disabled={syncingChannel === channel.channelId}
                          onClick={() => handleSyncChannel(channel.channelId)}
                        >
                          {syncingChannel === channel.channelId ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <RefreshCw size={16} />
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          title="Eliminar canal"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteChannel(channel)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Youtube size={48} className="mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-1">No hay canales configurados</h3>
              <p className="text-muted-foreground mb-4">
                Agrega canales de YouTube para mejorar la calidad de las sugerencias de títulos.
              </p>
              <Button onClick={() => setAddDialogOpen(true)}>Agregar Canal</Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Diálogo para agregar un canal */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Canal de YouTube</DialogTitle>
            <DialogDescription>
              Introduce la URL del canal de YouTube que deseas agregar. Los videos del canal serán importados automáticamente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="channelUrl">URL del Canal</Label>
              <Input 
                id="channelUrl" 
                placeholder="https://www.youtube.com/c/NombreDelCanal" 
                value={newChannelUrl} 
                onChange={(e) => setNewChannelUrl(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setAddDialogOpen(false);
                setNewChannelUrl('');
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAddChannel}
              disabled={addChannelMutation.isPending}
            >
              {addChannelMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Agregando...
                </>
              ) : 'Agregar Canal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de confirmación para eliminar un canal */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el canal y todos sus videos asociados de la base de datos.
              {selectedChannel && (
                <div className="mt-2 p-2 bg-muted rounded-md">
                  <strong>{selectedChannel.name}</strong>
                  <div className="text-sm text-muted-foreground">{selectedChannel.channelId}</div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedChannel(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteChannel}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteChannelMutation.isPending}
            >
              {deleteChannelMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : 'Eliminar Canal'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Diálogo de comparación de títulos */}
      {selectedChannel && (
        <TitleComparisonDialog 
          open={compareDialogOpen} 
          onOpenChange={setCompareDialogOpen}
          initialChannelId={selectedChannel.channelId}
        />
      )}
    </div>
  );
}