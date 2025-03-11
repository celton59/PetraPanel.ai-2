import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StandardSearchButton } from "@/components/ui/search-button";
import { 
  AlertCircle, 
  CheckCircle2, 
  Copy, 
  AlertTriangle,
  ExternalLink,
  Info
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

// Tipado para resultados de la comparación
interface SimilarTitle {
  videoId: number;
  title: string;
  similarity: number;
  isEvergreen: boolean;
}

interface ChannelVideo {
  id: number;
  videoId: string;
  title: string;
  publishedAt: Date | null;
  thumbnailUrl: string | null;
  viewCount: number | null;
  likeCount: number | null;
}

interface ComparisonResult {
  success: boolean;
  similarTitles: SimilarTitle[];
  channelExists: boolean;
  channelVideos: ChannelVideo[];
  proposedTitle: string;
}

interface BulkComparisonResult {
  success: boolean;
  results: {
    proposedTitle: string;
    similarTitles: SimilarTitle[];
    averageSimilarity: number;
    highestSimilarity: number;
  }[];
  channelInfo?: {
    id: number;
    channelId: string;
    name: string;
    videoCount: number;
  };
  totalProcessed: number;
}

interface ChannelCheckResult {
  success: boolean;
  exists: boolean;
  channel?: {
    id: number;
    channelId: string;
    name: string;
    thumbnailUrl: string | null;
    videoCount: number;
  };
  channelInfo?: {
    channelId: string;
    name: string;
    thumbnailUrl: string | null;
    subscriberCount: number | null;
    videoCount: number | null;
  };
}

interface TitleComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialChannelId?: string | null;
}

export function TitleComparisonDialog({
  open,
  onOpenChange,
  initialChannelId
}: TitleComparisonDialogProps) {
  // Estados para la comparación individual
  const [proposedTitle, setProposedTitle] = useState("");
  const [channelUrl, setChannelUrl] = useState("");
  const [channelId, setChannelId] = useState<string | null>(initialChannelId || null);
  const [loading, setLoading] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  
  // Estados para la comparación masiva
  const [bulkTitles, setBulkTitles] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResults, setBulkResults] = useState<BulkComparisonResult | null>(null);
  
  // Estado para la verificación de canal
  const [channelLoading, setChannelLoading] = useState(false);
  const [channelResult, setChannelResult] = useState<ChannelCheckResult | null>(null);
  
  // Función para comparar un título
  const compareTitle = async () => {
    if (!proposedTitle) {
      toast.error("Introduce un título para comparar");
      return;
    }

    setLoading(true);
    
    try {
      let selectedChannelId = channelId;
      
      // Si hay una URL de canal, primero verificar el canal
      if (channelUrl) {
        const channelResponse = await axios.get('/api/title-comparison/check-channel', {
          params: { channelUrl }
        });
        
        if (channelResponse.data.success) {
          if (channelResponse.data.exists) {
            selectedChannelId = channelResponse.data.channel.channelId;
            setChannelId(selectedChannelId);
          } else if (channelResponse.data.channelInfo) {
            selectedChannelId = channelResponse.data.channelInfo.channelId;
            setChannelId(selectedChannelId);
          }
        }
      }
      
      // Obtener el token CSRF del meta tag
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      
      // Realizar la comparación
      const response = await axios.post('/api/title-comparison/compare', 
        {
          proposedTitle,
          channelId: selectedChannelId
        },
        {
          headers: {
            'X-CSRF-Token': csrfToken || ''
          }
        }
      );
      
      if (response.data.success) {
        setComparisonResult(response.data);
      } else {
        toast.error("Error al comparar el título");
      }
    } catch (error) {
      console.error('Error comparing title:', error);
      toast.error("Error al realizar la comparación");
    } finally {
      setLoading(false);
    }
  };
  
  // Función para comparar múltiples títulos
  const compareBulkTitles = async () => {
    if (!bulkTitles) {
      toast.error("Introduce títulos para comparar");
      return;
    }
    
    setBulkLoading(true);
    
    try {
      const titles = bulkTitles
        .split('\n')
        .map(title => title.trim())
        .filter(title => title.length > 0);
      
      if (titles.length === 0) {
        toast.error("No se encontraron títulos válidos");
        setBulkLoading(false);
        return;
      }
      
      let selectedChannelId = channelId;
      
      // Si hay una URL de canal, primero verificar el canal
      if (channelUrl) {
        const channelResponse = await axios.get('/api/title-comparison/check-channel', {
          params: { channelUrl }
        });
        
        if (channelResponse.data.success) {
          if (channelResponse.data.exists) {
            selectedChannelId = channelResponse.data.channel.channelId;
            setChannelId(selectedChannelId);
          } else if (channelResponse.data.channelInfo) {
            selectedChannelId = channelResponse.data.channelInfo.channelId;
            setChannelId(selectedChannelId);
          }
        }
      }
      
      // Obtener el token CSRF del meta tag
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      
      // Realizar la comparación masiva
      const response = await axios.post('/api/title-comparison/bulk', 
        {
          proposedTitles: titles,
          channelId: selectedChannelId
        },
        {
          headers: {
            'X-CSRF-Token': csrfToken || ''
          }
        }
      );
      
      if (response.data.success) {
        setBulkResults(response.data);
      } else {
        toast.error("Error al comparar los títulos");
      }
    } catch (error) {
      console.error('Error comparing bulk titles:', error);
      toast.error("Error al realizar la comparación masiva");
    } finally {
      setBulkLoading(false);
    }
  };
  
  // Función para verificar el estado de un canal
  const checkChannel = async () => {
    if (!channelUrl) {
      toast.error("Introduce la URL del canal");
      return;
    }
    
    setChannelLoading(true);
    
    try {
      const response = await axios.get('/api/title-comparison/check-channel', {
        params: { channelUrl }
      });
      
      if (response.data.success) {
        setChannelResult(response.data);
        
        if (response.data.exists) {
          toast.success(`Canal encontrado: ${response.data.channel.name}`);
        } else {
          toast.info(`Canal de YouTube encontrado, pero no está en nuestra base de datos`);
        }
      } else {
        toast.error("Error al verificar el canal");
      }
    } catch (error) {
      console.error('Error checking channel:', error);
      toast.error("Error al verificar el canal");
    } finally {
      setChannelLoading(false);
    }
  };
  
  // Calcular color de similitud
  const getSimilarityColor = (similarity: number) => {
    if (similarity > 0.8) return "bg-red-500";
    if (similarity > 0.6) return "bg-orange-500";
    if (similarity > 0.4) return "bg-yellow-500";
    return "bg-green-500";
  };
  
  // Formatear porcentaje de similitud
  const formatSimilarity = (similarity: number) => {
    return `${Math.round(similarity * 100)}%`;
  };
  
  // Renderizar títulos similares
  const renderSimilarTitles = (similarTitles: SimilarTitle[]) => {
    if (similarTitles.length === 0) {
      return (
        <div className="p-4 text-center">
          <CheckCircle2 className="mx-auto mb-2 h-10 w-10 text-green-500" />
          <p className="text-sm text-muted-foreground">
            No se encontraron títulos similares
          </p>
        </div>
      );
    }
    
    return similarTitles.map((title, index) => (
      <div key={index} className="mb-3 p-3 border rounded-md">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold truncate">{title.title}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge className={getSimilarityColor(title.similarity)}>
                  {formatSimilarity(title.similarity)}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Similitud: {formatSimilarity(title.similarity)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>ID: {title.videoId}</span>
          <Badge variant={title.isEvergreen ? "secondary" : "outline"}>
            {title.isEvergreen ? "Evergreen" : "No Evergreen"}
          </Badge>
        </div>
      </div>
    ));
  };
  
  // Renderizar resultados de comparación masiva
  const renderBulkResults = () => {
    if (!bulkResults || !bulkResults.results.length) return null;
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            Resultados ({bulkResults.totalProcessed} títulos)
          </h3>
          {bulkResults.channelInfo && (
            <Badge variant="outline">
              Canal: {bulkResults.channelInfo.name} 
              ({bulkResults.channelInfo.videoCount} videos)
            </Badge>
          )}
        </div>
        
        <ScrollArea className="h-80">
          {bulkResults.results.map((result, index) => (
            <Card key={index} className="mb-3">
              <CardHeader className="p-3 pb-0">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm">{result.proposedTitle}</CardTitle>
                  <div className="flex items-center space-x-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge className={getSimilarityColor(result.highestSimilarity)}>
                            {formatSimilarity(result.highestSimilarity)}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Similitud máxima: {formatSimilarity(result.highestSimilarity)}</p>
                          <p>Similitud promedio: {formatSimilarity(result.averageSimilarity)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <div className="text-xs">
                  {result.similarTitles.length > 0 ? (
                    result.similarTitles.map((title, idx) => (
                      <div key={idx} className="mb-1 p-2 border rounded-md">
                        <div className="flex items-center justify-between">
                          <span className="truncate">{title.title}</span>
                          <Badge className={getSimilarityColor(title.similarity)} variant="outline">
                            {formatSimilarity(title.similarity)}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-2 text-center text-muted-foreground">
                      <CheckCircle2 className="mx-auto mb-1 h-5 w-5 text-green-500" />
                      <p>Sin similitudes</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </ScrollArea>
      </div>
    );
  };

  // Renderizar información del canal
  const renderChannelInfo = () => {
    if (!channelResult) return null;
    
    if (channelResult.exists && channelResult.channel) {
      return (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg">Canal en la base de datos</CardTitle>
            <CardDescription>
              Este canal ya está registrado en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              {channelResult.channel.thumbnailUrl && (
                <img 
                  src={channelResult.channel.thumbnailUrl} 
                  alt={channelResult.channel.name}
                  className="h-16 w-16 rounded-full object-cover" 
                />
              )}
              <div>
                <h3 className="font-medium">{channelResult.channel.name}</h3>
                <p className="text-sm text-muted-foreground">
                  ID: {channelResult.channel.channelId}
                </p>
                <p className="text-sm text-muted-foreground">
                  {channelResult.channel.videoCount} videos analizados
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    } else if (!channelResult.exists && channelResult.channelInfo) {
      return (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg">Canal de YouTube</CardTitle>
            <CardDescription>
              Canal encontrado en YouTube, pero no en nuestra base de datos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              {channelResult.channelInfo.thumbnailUrl && (
                <img 
                  src={channelResult.channelInfo.thumbnailUrl} 
                  alt={channelResult.channelInfo.name || "Canal"}
                  className="h-16 w-16 rounded-full object-cover" 
                />
              )}
              <div>
                <h3 className="font-medium">{channelResult.channelInfo.name}</h3>
                <p className="text-sm text-muted-foreground">
                  ID: {channelResult.channelInfo.channelId}
                </p>
                <p className="text-sm text-muted-foreground">
                  {channelResult.channelInfo.subscriberCount ? 
                    `${Math.round(channelResult.channelInfo.subscriberCount / 1000)}K` : 
                    "?"} suscriptores
                </p>
                <p className="text-sm text-muted-foreground">
                  {channelResult.channelInfo.videoCount || "?"} videos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    return null;
  };

  // Efecto para cargar los datos del canal si se proporciona initialChannelId
  useEffect(() => {
    if (initialChannelId && open) {
      // Verificar el canal seleccionado
      const fetchChannelInfo = async () => {
        setChannelLoading(true);
        try {
          const response = await axios.get('/api/title-comparison/check-channel', {
            params: { channelId: initialChannelId }
          });
          
          if (response.data.success) {
            setChannelResult(response.data);
            
            if (response.data.exists) {
              toast.success(`Canal cargado: ${response.data.channel.name}`);
            }
          }
        } catch (error) {
          console.error('Error fetching channel info:', error);
        } finally {
          setChannelLoading(false);
        }
      };
      
      fetchChannelInfo();
    }
  }, [initialChannelId, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Comparador de Títulos</DialogTitle>
          <DialogDescription>
            Compara títulos propuestos con los existentes en YouTube para evitar duplicados
            {channelId && channelResult?.channel && (
              <span className="block mt-1 text-xs font-medium">
                Canal seleccionado: {channelResult.channel.name}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="single" className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="single">Título Individual</TabsTrigger>
            <TabsTrigger value="bulk">Comparación Masiva</TabsTrigger>
            <TabsTrigger value="channel">Canal</TabsTrigger>
          </TabsList>
          
          {/* Pestaña: Título Individual */}
          <TabsContent value="single" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="proposed-title">Título propuesto</Label>
                <div className="flex mt-1">
                  <Input
                    id="proposed-title"
                    value={proposedTitle}
                    onChange={(e) => setProposedTitle(e.target.value)}
                    placeholder="Introduce el título a comparar"
                    className="flex-1"
                  />
                  <StandardSearchButton 
                    onClick={compareTitle} 
                    disabled={loading} 
                    className="ml-2"
                    iconOnly={false}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="channel-url" className="flex items-center">
                  URL del canal (opcional)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="ml-1 h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Si proporcionas una URL de canal, se compararán solo los títulos de ese canal</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <div className="flex mt-1">
                  <Input
                    id="channel-url"
                    value={channelUrl}
                    onChange={(e) => setChannelUrl(e.target.value)}
                    placeholder="https://www.youtube.com/c/nombre-canal"
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    onClick={checkChannel} 
                    disabled={channelLoading} 
                    className="ml-2"
                  >
                    Verificar
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Resultados de comparación individual */}
            {loading ? (
              <div className="space-y-3 mt-4">
                <Skeleton className="h-[20px] w-3/4" />
                <Skeleton className="h-[100px] w-full" />
                <Skeleton className="h-[50px] w-3/4" />
                <Skeleton className="h-[50px] w-1/2" />
              </div>
            ) : comparisonResult && (
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Resultados para:</h3>
                  <Card>
                    <CardContent className="p-3">
                      <p className="text-lg">{comparisonResult.proposedTitle}</p>
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Títulos similares:</h3>
                  <Card>
                    <CardContent className="p-3">
                      {renderSimilarTitles(comparisonResult.similarTitles)}
                    </CardContent>
                  </Card>
                </div>
                
                {comparisonResult.channelExists && comparisonResult.channelVideos.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Videos del canal:</h3>
                    <ScrollArea className="h-64">
                      {comparisonResult.channelVideos.map((video) => (
                        <Card key={video.id} className="mb-2">
                          <CardContent className="p-3 flex items-start space-x-3">
                            {video.thumbnailUrl && (
                              <img 
                                src={video.thumbnailUrl} 
                                alt={video.title}
                                className="h-16 w-24 object-cover rounded-md" 
                              />
                            )}
                            <div>
                              <p className="font-medium">{video.title}</p>
                              <div className="flex text-xs text-muted-foreground mt-1">
                                <span className="mr-2">
                                  {video.publishedAt ? new Date(video.publishedAt).toLocaleDateString() : "Sin fecha"}
                                </span>
                                {video.viewCount && <span className="mr-2">{video.viewCount} vistas</span>}
                                {video.likeCount && <span>{video.likeCount} likes</span>}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </ScrollArea>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          
          {/* Pestaña: Comparación Masiva */}
          <TabsContent value="bulk" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="bulk-titles">Títulos propuestos (uno por línea)</Label>
                <Textarea
                  id="bulk-titles"
                  value={bulkTitles}
                  onChange={(e) => setBulkTitles(e.target.value)}
                  placeholder="Título 1&#10;Título 2&#10;Título 3"
                  className="min-h-[120px]"
                />
              </div>
              
              <div>
                <Label htmlFor="bulk-channel-url" className="flex items-center">
                  URL del canal (opcional)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="ml-1 h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Si proporcionas una URL de canal, se verificará y asociará a estos títulos</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <div className="flex mt-1">
                  <Input
                    id="bulk-channel-url"
                    value={channelUrl}
                    onChange={(e) => setChannelUrl(e.target.value)}
                    placeholder="https://www.youtube.com/c/nombre-canal"
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    onClick={checkChannel} 
                    disabled={channelLoading} 
                    className="ml-2"
                  >
                    Verificar
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-center">
                <Button 
                  onClick={compareBulkTitles} 
                  disabled={bulkLoading} 
                  className="w-1/2"
                >
                  Comparar todos
                </Button>
              </div>
            </div>
            
            {/* Resultados de comparación masiva */}
            {bulkLoading ? (
              <div className="space-y-3 mt-4">
                <Progress value={45} className="w-full" />
                <Skeleton className="h-[20px] w-3/4" />
                <Skeleton className="h-[50px] w-full" />
                <Skeleton className="h-[50px] w-full" />
                <Skeleton className="h-[50px] w-full" />
              </div>
            ) : (
              renderBulkResults()
            )}
            
            {/* Información del canal */}
            {renderChannelInfo()}
          </TabsContent>
          
          {/* Pestaña: Canal */}
          <TabsContent value="channel" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="channel-check-url">URL del canal</Label>
                <div className="flex mt-1">
                  <Input
                    id="channel-check-url"
                    value={channelUrl}
                    onChange={(e) => setChannelUrl(e.target.value)}
                    placeholder="https://www.youtube.com/c/nombre-canal"
                    className="flex-1"
                  />
                  <Button 
                    onClick={checkChannel} 
                    disabled={channelLoading} 
                    className="ml-2"
                  >
                    Verificar
                  </Button>
                </div>
              </div>
              
              {/* Información del canal */}
              {channelLoading ? (
                <div className="space-y-3 mt-4">
                  <Skeleton className="h-[20px] w-3/4" />
                  <div className="flex space-x-4">
                    <Skeleton className="h-[80px] w-[80px] rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-[20px] w-[200px]" />
                      <Skeleton className="h-[15px] w-[150px]" />
                      <Skeleton className="h-[15px] w-[100px]" />
                    </div>
                  </div>
                </div>
              ) : (
                renderChannelInfo()
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cerrar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}