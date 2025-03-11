import React, { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import api from "../../../lib/axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
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
import { 
  Loader2, 
  Plus, 
  Trash, 
  Search, 
  FileUp, 
  FileDown, 
  Download,
  CheckCircle, 
  XCircle,
  Filter,
  ChevronDown,
  AlertCircle,
  ListPlus,
  Video,
  BarChart4,
  Layers,
  Cpu,
  ArrowUpDown,
  Info,
  PanelLeftOpen,
  PanelLeftClose
} from "lucide-react";

// Importar los componentes de visualización
import { DataQualityMetrics } from "./visualization/DataQualityMetrics";
import { EmbeddingVisualizer } from "./visualization/EmbeddingVisualizer";
import { AdvancedCategorizationPanel } from "./visualization/AdvancedCategorizationPanel";

interface TrainingExample {
  id: number;
  title: string;
  is_evergreen: boolean;
  created_at: string;
  created_by?: number;
  confidence?: number;
  category?: string;
  similarity_score?: number;
  embedding?: number[];
  vector_processed?: boolean;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface TrainingExamplesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Componente para el panel de importación
function ImportPanel({
  onImportCSV,
  onImportText,
  onImportYouTube,
  isImporting
}: {
  onImportCSV: () => void;
  onImportText: () => void;
  onImportYouTube: () => void;
  isImporting: boolean;
}) {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-md">Importar ejemplos</CardTitle>
        <CardDescription>
          Añade ejemplos desde diferentes fuentes para mejorar el análisis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={onImportCSV}
            disabled={isImporting}
            variant="outline" 
            size="sm" 
            className="flex items-center"
          >
            <FileUp className="mr-2 h-4 w-4" />
            Importar CSV
          </Button>
          <Button 
            onClick={onImportText}
            disabled={isImporting}
            variant="outline" 
            size="sm" 
            className="flex items-center"
          >
            <ListPlus className="mr-2 h-4 w-4" />
            Importar texto
          </Button>
          <Button 
            onClick={onImportYouTube}
            disabled={isImporting}
            variant="outline" 
            size="sm" 
            className="flex items-center"
          >
            <Video className="mr-2 h-4 w-4" />
            Importar de YouTube
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Componente para el panel de acciones
function ActionsPanel({
  onExport,
  onProcessVectors,
  unprocessedCount,
  isExporting,
  isProcessing
}: {
  onExport: () => void;
  onProcessVectors: () => void;
  unprocessedCount: number;
  isExporting: boolean;
  isProcessing: boolean;
}) {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-md">Acciones</CardTitle>
        <CardDescription>
          Gestiona y procesa tus ejemplos de entrenamiento
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={onExport}
            disabled={isExporting}
            variant="outline" 
            size="sm" 
            className="flex items-center"
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Exportar ejemplos
          </Button>
          <Button 
            onClick={onProcessVectors}
            disabled={isProcessing || unprocessedCount === 0}
            variant="default" 
            size="sm" 
            className="flex items-center"
          >
            {isProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Cpu className="mr-2 h-4 w-4" />
            )}
            {isProcessing ? 'Procesando...' : `Procesar vectores (${unprocessedCount})`}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Componente para el formulario de nuevo ejemplo
function AddExampleForm({
  title,
  isEvergreen,
  onTitleChange,
  onEvergreenChange,
  onSubmit,
  isSubmitting
}: {
  title: string;
  isEvergreen: boolean;
  onTitleChange: (value: string) => void;
  onEvergreenChange: (value: boolean) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-md">Añadir nuevo ejemplo</CardTitle>
        <CardDescription>
          Ingresa un título y selecciona su tipo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="new-title">Título</Label>
            <div className="flex gap-2">
              <Input
                id="new-title"
                placeholder="Título del ejemplo"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={onSubmit}
                disabled={isSubmitting || !title.trim()}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Añadir
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch 
              id="evergreen-toggle" 
              checked={isEvergreen}
              onCheckedChange={onEvergreenChange}
            />
            <Label htmlFor="evergreen-toggle">
              {isEvergreen ? (
                <span className="text-green-700 font-medium">Evergreen (contenido atemporal)</span>
              ) : (
                <span className="text-amber-700 font-medium">No Evergreen (contenido temporal)</span>
              )}
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Componente para la tabla de ejemplos
function ExamplesTable({
  examples, 
  onDelete, 
  isLoading
}: {
  examples: TrainingExample[];
  onDelete: (id: number) => void;
  isLoading: boolean;
}) {
  return (
    <div className="rounded-md border overflow-auto bg-card">
      <Table>
        <TableHeader className="sticky top-0 bg-background border-b z-10">
          <TableRow>
            <TableHead className="w-[60%]">Título</TableHead>
            <TableHead className="w-[20%]">Tipo</TableHead>
            <TableHead className="w-[20%] text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-10">
                <div className="flex flex-col items-center space-y-2">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <div className="text-sm text-muted-foreground">Cargando ejemplos...</div>
                </div>
              </TableCell>
            </TableRow>
          ) : examples.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                <div className="flex flex-col items-center space-y-2">
                  <AlertCircle className="h-10 w-10 text-muted" />
                  <div className="text-base font-medium">No hay ejemplos disponibles</div>
                  <div className="text-sm text-muted-foreground max-w-sm text-center">
                    No hay ejemplos de entrenamiento. Agrega algunos o importa desde diferentes fuentes.
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            examples.map((example) => (
              <TableRow key={example.id} className="hover:bg-muted/20">
                <TableCell className="font-medium">{example.title}</TableCell>
                <TableCell>
                  {example.is_evergreen ? (
                    <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                      Evergreen
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700">
                      No Evergreen
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(example.id)}
                    className="hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash className="h-4 w-4 text-red-600" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

// Componente para el diálogo de importación masiva
function BulkImportDialog({
  open,
  onOpenChange,
  titles,
  onTitlesChange,
  isEvergreen,
  onEvergreenChange,
  onImport,
  isImporting
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titles: string;
  onTitlesChange: (value: string) => void;
  isEvergreen: boolean;
  onEvergreenChange: (value: boolean) => void;
  onImport: () => void;
  isImporting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Importar ejemplos en masa</DialogTitle>
          <DialogDescription>
            Ingrese un título por línea. Todos los títulos serán importados como el tipo seleccionado.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="bulk-titles">Títulos (uno por línea)</Label>
            <textarea
              id="bulk-titles"
              className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Ingrese un título por línea"
              value={titles}
              onChange={(e) => onTitlesChange(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="bulk-evergreen" 
              checked={isEvergreen}
              onCheckedChange={onEvergreenChange}
            />
            <Label htmlFor="bulk-evergreen">
              {isEvergreen ? (
                <span className="text-green-700 font-medium">Evergreen (contenido atemporal)</span>
              ) : (
                <span className="text-amber-700 font-medium">No Evergreen (contenido temporal)</span>
              )}
            </Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={onImport}
            disabled={isImporting || !titles.trim()}
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Importar títulos
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Componente para el diálogo de importación desde YouTube
function YouTubeImportDialog({
  open,
  onOpenChange,
  channels,
  selectedChannel,
  onChannelChange,
  isEvergreen,
  onEvergreenChange,
  onImport,
  isImporting
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channels: {id: string, name: string, channelId: string}[];
  selectedChannel: {id: string, name: string, channelId: string} | null;
  onChannelChange: (value: string) => void;
  isEvergreen: boolean;
  onEvergreenChange: (value: boolean) => void;
  onImport: () => void;
  isImporting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Importar desde canal de YouTube</DialogTitle>
          <DialogDescription>
            Seleccione un canal e indique si los títulos deben considerarse como contenido evergreen (atemporal) o no evergreen (temporal).
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="channel-selector">Canal de YouTube</Label>
            <Select
              value={selectedChannel?.id || ""}
              onValueChange={(value) => {
                onChannelChange(value);
              }}
            >
              <SelectTrigger id="channel-selector">
                <SelectValue placeholder="Seleccione un canal" />
              </SelectTrigger>
              <SelectContent>
                {channels.length === 0 ? (
                  <div className="py-2 px-4 text-sm text-muted-foreground">
                    No hay canales disponibles
                  </div>
                ) : (
                  channels.map(channel => (
                    <SelectItem key={channel.id} value={channel.id}>
                      {channel.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="youtube-evergreen" 
              checked={isEvergreen}
              onCheckedChange={onEvergreenChange}
            />
            <Label htmlFor="youtube-evergreen">
              {isEvergreen ? (
                <span className="text-green-700 font-medium">Evergreen (contenido atemporal)</span>
              ) : (
                <span className="text-amber-700 font-medium">No Evergreen (contenido temporal)</span>
              )}
            </Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={onImport}
            disabled={isImporting || !selectedChannel}
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <AlertCircle className="mr-2 h-4 w-4" />
                Importar títulos
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ImprovedTrainingExamplesDialog({
  open,
  onOpenChange,
}: TrainingExamplesDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [examples, setExamples] = useState<TrainingExample[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [isEvergreen, setIsEvergreen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("examples");
  const [activeFilterTab, setActiveFilterTab] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showSidebar, setShowSidebar] = useState(true);
  
  // Estado para paginación
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 100,
    totalPages: 0
  });
  
  // Estado para operaciones por lotes
  const [selectedExamples, setSelectedExamples] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Estado para importación/exportación
  const [isUploading, setIsUploading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImportingFromYoutube, setIsImportingFromYoutube] = useState(false);
  const [youtubeChannelOpen, setYoutubeChannelOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<{id: string, name: string, channelId: string} | null>(null);
  const [channels, setChannels] = useState<{id: string, name: string, channelId: string}[]>([]);
  const [importAsEvergreen, setImportAsEvergreen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estado para importación masiva
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  
  // Estado para procesamiento de vectores
  const [isProcessingVectors, setIsProcessingVectors] = useState(false);
  const [unprocessedCount, setUnprocessedCount] = useState(0);
  const [bulkTitles, setBulkTitles] = useState("");
  const [bulkIsEvergreen, setBulkIsEvergreen] = useState(true);
  const [isImportingBulk, setIsImportingBulk] = useState(false);
  
  // Estado para ordenamiento
  const [sortBy, setSortBy] = useState<string>("id");
  const [sortDir, setSortDir] = useState<string>("asc");

  // Métricas de datos para el panel de calidad
  const dataMetrics = useMemo(() => {
    return {
      totalExamples: examples.length,
      evergreenExamples: examples.filter(e => e.is_evergreen).length,
      nonEvergreenExamples: examples.filter(e => !e.is_evergreen).length,
      processedVectors: examples.filter(e => e.vector_processed).length,
      avgConfidence: examples.reduce((acc, e) => acc + (e.confidence || 0), 0) / examples.length || 0
    };
  }, [examples]);

  // Cargar ejemplos
  const loadExamples = async () => {
    setIsLoading(true);
    setSelectedExamples([]);
    setSelectAll(false);

    try {
      // Construir parámetros de consulta
      const params = new URLSearchParams({
        limit: "10000", // Valor alto para traer todos los registros
        sortBy,
        sortDir
      });

      // Añadir parámetros adicionales solo si tienen valor
      if (searchTerm) params.append('search', searchTerm);
      if (activeFilterTab !== 'all') params.append('type', activeFilterTab);

      const response = await api.get(`/api/titulin/training-examples?${params}`);
      
      if (response.data.success) {
        setExamples(response.data.data);
        setPagination(response.data.pagination);
        
        // Contar ejemplos sin procesar
        const unprocessed = response.data.data.filter((example: TrainingExample) => !example.vector_processed).length;
        setUnprocessedCount(unprocessed);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al cargar ejemplos de entrenamiento");
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar ejemplos y canales al abrir el diálogo
  useEffect(() => {
    if (open) {
      loadExamples();
      loadChannels();
    }
  }, [open]);
  
  // Cargar canales de YouTube
  const loadChannels = async () => {
    try {
      const response = await api.get('/api/titulin/channels/for-training');
      if (response.data && Array.isArray(response.data)) {
        setChannels(response.data.map(channel => ({
          id: channel.id, // ID interno del canal
          channelId: channel.channelId, // ID de YouTube
          name: channel.name
        })));
      }
    } catch (error) {
      console.error('Error al cargar canales de YouTube:', error);
      toast.error('No se pudieron cargar los canales de YouTube');
    }
  };
  
  // Efecto para aplicar filtros con un debounce para la búsqueda
  useEffect(() => {
    if (!open) return;
    
    const timer = setTimeout(() => {
      // Cargar con los nuevos filtros
      loadExamples();
    }, 300); // Esperar 300ms después de terminar de escribir
    
    return () => clearTimeout(timer);
  }, [searchTerm, activeFilterTab, sortBy, sortDir]);
  
  // Manejar ordenamiento
  const toggleSort = (column: string) => {
    if (sortBy === column) {
      // Si ya se está ordenando por esta columna, cambiar la dirección
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      // Cambiar la columna de ordenamiento y resetear a ascendente
      setSortBy(column);
      setSortDir('asc');
    }
  };

  // Añadir nuevo ejemplo
  const addExample = async () => {
    if (!newTitle.trim()) {
      toast.error("El título no puede estar vacío");
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post("/api/titulin/training-examples", {
        title: newTitle,
        isEvergreen,
      });

      if (response.data.success) {
        toast.success("Ejemplo añadido correctamente");
        setNewTitle("");
        loadExamples();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al añadir ejemplo");
    } finally {
      setIsLoading(false);
    }
  };

  // Eliminar ejemplo
  const deleteExample = async (id: number) => {
    setIsLoading(true);
    try {
      const response = await api.delete(`/api/titulin/training-examples/${id}`);
      if (response.data.success) {
        toast.success("Ejemplo eliminado correctamente");
        loadExamples();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al eliminar ejemplo");
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar ejemplos según la pestaña activa y término de búsqueda
  const filteredExamples = useMemo(() => {
    return examples.filter((example) => {
      // Filtrar por tipo (pestaña activa)
      const matchesTab = 
        activeFilterTab === "all" || 
        (activeFilterTab === "evergreen" && example.is_evergreen === true) || 
        (activeFilterTab === "not-evergreen" && example.is_evergreen === false);
      
      // Filtrar por término de búsqueda
      const matchesSearch = 
        !searchTerm.trim() || 
        example.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesTab && matchesSearch;
    });
  }, [examples, activeFilterTab, searchTerm]);
  
  // Contador de resultados filtrados por tipo para mostrar en las pestañas
  const evergreenCount = useMemo(() => examples.filter(e => e.is_evergreen === true).length, [examples]);
  const notEvergreenCount = useMemo(() => examples.filter(e => e.is_evergreen === false).length, [examples]);
  
  // Función para cambiar de pestaña y limpiar la búsqueda
  const handleFilterTabChange = (value: string) => {
    setSearchTerm('');
    setActiveFilterTab(value);
    loadExamples();
  };
  
  // Función para exportar ejemplos
  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Crear la URL con los parámetros de filtrado
      let url = '/api/titulin/training-examples/export';
      if (activeFilterTab !== 'all') {
        url += `?type=${activeFilterTab.replace('evergreen', 'evergreen').replace('not-evergreen', 'not-evergreen')}`;
      }
      
      // Realizar la petición con responseType blob para descargar el archivo
      const response = await api.get(url, { responseType: 'blob' });
      
      // Crear un objeto URL para el blob
      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      
      // Crear un enlace temporal y hacer clic en él
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `ejemplos-entrenamiento-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success('Archivo CSV exportado correctamente');
    } catch (error: any) {
      toast.error('Error al exportar ejemplos');
      console.error('Error exportando ejemplos:', error);
    } finally {
      setIsExporting(false);
    }
  };
  
  // Función para abrir el diálogo de selección de archivo
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Función para importar ejemplos desde un canal de YouTube
  const handleImportFromYoutube = async () => {
    if (!selectedChannel) {
      toast.error('Seleccione un canal primero');
      return;
    }
    
    if (!selectedChannel.channelId) {
      toast.error('El canal seleccionado no tiene un ID de YouTube válido');
      return;
    }
    
    setIsImportingFromYoutube(true);
    try {
      const response = await api.post('/api/titulin/training-examples/import-from-channel', {
        channelId: selectedChannel.channelId, // Usamos el channelId de YouTube
        isEvergreen: importAsEvergreen
      });
      
      if (response.data.success) {
        toast.success(response.data.message || `Títulos del canal ${selectedChannel.name} importados como ${importAsEvergreen ? 'evergreen' : 'no evergreen'}`);
        loadExamples(); // Recargar ejemplos
        setYoutubeChannelOpen(false); // Cerrar el diálogo
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al importar títulos desde YouTube';
      toast.error(errorMessage);
      console.error('Error importando desde YouTube:', error);
    } finally {
      setIsImportingFromYoutube(false);
    }
  };
  
  // Función para importar ejemplos desde CSV
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validar que es un archivo CSV
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      toast.error('Por favor, seleccione un archivo CSV válido');
      return;
    }
    
    setIsUploading(true);
    try {
      // Crear un formulario con el archivo
      const formData = new FormData();
      formData.append('file', file);
      
      // Enviar la petición
      const response = await api.post('/api/titulin/training-examples/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true  // Asegura que se envíen las cookies de autenticación
      });
      
      if (response.data.success) {
        toast.success(response.data.message || 'Ejemplos importados correctamente');
        loadExamples(); // Recargar ejemplos
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al importar ejemplos');
      console.error('Error importando ejemplos:', error);
    } finally {
      setIsUploading(false);
      // Limpiar input para permitir seleccionar el mismo archivo nuevamente
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Función para manejar la importación masiva de ejemplos
  const handleBulkImport = async () => {
    if (!bulkTitles.trim()) {
      toast.error('Ingrese al menos un título');
      return;
    }
    
    setIsImportingBulk(true);
    try {
      // Dividir los títulos por saltos de línea y filtrar líneas vacías
      const titles = bulkTitles
        .split('\n')
        .map(title => title.trim())
        .filter(title => title.length > 0);
      
      if (titles.length === 0) {
        toast.error('No se encontraron títulos válidos');
        return;
      }
      
      // Enviar la petición
      const response = await api.post('/api/titulin/training-examples/bulk', {
        operation: 'create',
        titles,
        isEvergreen: bulkIsEvergreen
      }, {
        withCredentials: true  // Asegura que se envíen las cookies de autenticación
      });
      
      if (response.data.success) {
        toast.success(`${response.data.insertedCount || titles.length} ejemplos importados correctamente`);
        loadExamples(); // Recargar ejemplos
        setBulkTitles(''); // Limpiar el textarea
        setBulkImportOpen(false); // Cerrar diálogo
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al importar ejemplos en masa');
      console.error('Error importando ejemplos en masa:', error);
    } finally {
      setIsImportingBulk(false);
    }
  };
  
  // Función para gestionar operaciones en lote
  const handleBulkOperation = async (operation: 'delete' | 'update', data?: { is_evergreen?: boolean }) => {
    if (selectedExamples.length === 0) {
      toast.error('No hay ejemplos seleccionados');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await api.post('/api/titulin/training-examples/bulk', {
        operation,
        ids: selectedExamples,
        data
      });
      
      if (response.data.success) {
        toast.success(`Operación completada con éxito en ${selectedExamples.length} ejemplos`);
        loadExamples(); // Recargar ejemplos
        setSelectedExamples([]); // Limpiar selección
        setSelectAll(false); // Resetear selección total
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al realizar operación en lote');
      console.error('Error en operación masiva:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para procesar vectores de ejemplos
  const processVectors = async () => {
    if (unprocessedCount === 0) {
      toast.info('No hay ejemplos pendientes de procesar');
      return;
    }
    
    setIsProcessingVectors(true);
    try {
      // Obtener solo IDs de ejemplos sin procesar
      const unprocessedIds = examples
        .filter(example => !example.vector_processed)
        .map(example => example.id);
        
      const response = await api.post('/api/titulin/training-examples/process-vectors', {
        ids: unprocessedIds
      });
      
      if (response.data.success) {
        toast.success(`${response.data.processedCount || unprocessedIds.length} vectores procesados correctamente`);
        loadExamples(); // Recargar ejemplos para ver los actualizados
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al procesar vectores');
      console.error('Error procesando vectores:', error);
    } finally {
      setIsProcessingVectors(false);
    }
  };
  
  // Función para categorizar ejemplos
  const handleCategorizeExamples = async (exampleIds: number[], category: string) => {
    setIsLoading(true);
    try {
      // Simulamos actualización con un timeout
      // Aquí iría la llamada real al API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Actualizar localmente para mostrar cambios
      const updatedExamples = examples.map(example => 
        exampleIds.includes(example.id) 
          ? { ...example, category } 
          : example
      );
      
      setExamples(updatedExamples);
      toast.success(`${exampleIds.length} ejemplos categorizados como "${category}"`);
    } catch (error: any) {
      toast.error('Error al categorizar ejemplos');
      console.error('Error categorizando ejemplos:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      {/* Diálogo de importación masiva */}
      <BulkImportDialog
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
        titles={bulkTitles}
        onTitlesChange={setBulkTitles}
        isEvergreen={bulkIsEvergreen}
        onEvergreenChange={setBulkIsEvergreen}
        onImport={handleBulkImport}
        isImporting={isImportingBulk}
      />
      
      {/* Diálogo de importación desde YouTube */}
      <YouTubeImportDialog
        open={youtubeChannelOpen}
        onOpenChange={setYoutubeChannelOpen}
        channels={channels}
        selectedChannel={selectedChannel}
        onChannelChange={(value) => {
          const channel = channels.find(c => c.id === value);
          setSelectedChannel(channel || null);
        }}
        isEvergreen={importAsEvergreen}
        onEvergreenChange={setImportAsEvergreen}
        onImport={handleImportFromYoutube}
        isImporting={isImportingFromYoutube}
      />
      
      {/* Input oculto para carga de archivos */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept=".csv"
      />
      
      {/* Diálogo principal */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-6 pb-2">
            <div className="flex justify-between items-center">
              <div>
                <DialogTitle>Ejemplos de entrenamiento para análisis de contenido</DialogTitle>
                <DialogDescription>
                  Estos ejemplos ayudan a mejorar la precisión del análisis de títulos, enseñando a la IA a distinguir entre contenido evergreen (atemporal) y no evergreen (temporal).
                </DialogDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowSidebar(!showSidebar)}
                className="ml-4"
              >
                {showSidebar ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 flex overflow-hidden">
            {/* Panel lateral */}
            {showSidebar && (
              <div className="w-[260px] bg-muted/20 p-4 border-r overflow-auto">
                <div className="space-y-4">
                  <div className="font-medium text-sm">Navegación</div>
                  
                  <div className="space-y-1">
                    <Button
                      variant={activeTab === "examples" ? "default" : "ghost"}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setActiveTab("examples")}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Ejemplos
                    </Button>
                    <Button
                      variant={activeTab === "visualization" ? "default" : "ghost"}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setActiveTab("visualization")}
                    >
                      <BarChart4 className="mr-2 h-4 w-4" />
                      Visualización
                    </Button>
                    <Button
                      variant={activeTab === "categorization" ? "default" : "ghost"}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setActiveTab("categorization")}
                    >
                      <Layers className="mr-2 h-4 w-4" />
                      Categorización
                    </Button>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="font-medium text-sm mb-2">Filtros</div>
                    <div className="space-y-1">
                      <Button
                        variant={activeFilterTab === "all" ? "secondary" : "ghost"}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleFilterTabChange("all")}
                      >
                        Todos ({examples.length})
                      </Button>
                      <Button
                        variant={activeFilterTab === "evergreen" ? "secondary" : "ghost"}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleFilterTabChange("evergreen")}
                      >
                        <span className="text-green-700">Evergreen</span>
                        <Badge variant="outline" className="ml-2 bg-green-50 text-green-700">
                          {evergreenCount}
                        </Badge>
                      </Button>
                      <Button
                        variant={activeFilterTab === "not-evergreen" ? "secondary" : "ghost"}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleFilterTabChange("not-evergreen")}
                      >
                        <span className="text-amber-700">No Evergreen</span>
                        <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700">
                          {notEvergreenCount}
                        </Badge>
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="font-medium text-sm mb-2">Información</div>
                    <Card className="p-4 bg-card">
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total ejemplos:</span>
                          <span className="font-medium">{examples.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Ejemplos evergreen:</span>
                          <span className="font-medium text-green-700">{evergreenCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Ejemplos no evergreen:</span>
                          <span className="font-medium text-amber-700">{notEvergreenCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Vectores procesados:</span>
                          <span className="font-medium">{examples.filter(e => e.vector_processed).length}</span>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            )}
            
            {/* Contenido principal */}
            <div className="flex-1 p-6 pt-2 overflow-auto">
              {/* Sección de ejemplos */}
              {activeTab === "examples" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    <div className="xl:col-span-2">
                      <AddExampleForm 
                        title={newTitle}
                        isEvergreen={isEvergreen}
                        onTitleChange={setNewTitle}
                        onEvergreenChange={setIsEvergreen}
                        onSubmit={addExample}
                        isSubmitting={isLoading}
                      />
                    </div>
                    
                    <div>
                      <ImportPanel
                        onImportCSV={handleImportClick}
                        onImportText={() => setBulkImportOpen(true)}
                        onImportYouTube={() => setYoutubeChannelOpen(true)}
                        isImporting={isUploading || isImportingFromYoutube || isImportingBulk}
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleSort('title')}
                          className="flex items-center"
                        >
                          Ordenar
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                        
                        <Input
                          className="max-w-[300px]"
                          placeholder="Buscar ejemplos..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onKeyDown={(e) => e.key === 'Escape' && setSearchTerm('')}
                        />
                        
                        <Badge>
                          {filteredExamples.length} resultado{filteredExamples.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      
                      <div className="space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleExport}
                          disabled={isExporting || examples.length === 0}
                          className="flex items-center"
                        >
                          {isExporting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="mr-2 h-4 w-4" />
                          )}
                          Exportar
                        </Button>
                        
                        <Button
                          variant="default"
                          size="sm"
                          onClick={processVectors}
                          disabled={isProcessingVectors || unprocessedCount === 0}
                          className="flex items-center"
                        >
                          {isProcessingVectors ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Cpu className="mr-2 h-4 w-4" />
                          )}
                          {isProcessingVectors ? 'Procesando...' : `Procesar vectores (${unprocessedCount})`}
                        </Button>
                      </div>
                    </div>
                    
                    <ExamplesTable 
                      examples={filteredExamples}
                      onDelete={deleteExample}
                      isLoading={isLoading}
                    />
                  </div>
                </div>
              )}
              
              {/* Sección de visualización */}
              {activeTab === "visualization" && (
                <div className="space-y-6">
                  <DataQualityMetrics 
                    totalExamples={dataMetrics.totalExamples}
                    evergreenExamples={dataMetrics.evergreenExamples}
                    nonEvergreenExamples={dataMetrics.nonEvergreenExamples}
                    processedVectors={dataMetrics.processedVectors}
                    avgConfidence={dataMetrics.avgConfidence}
                  />
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Visualización de embeddings</CardTitle>
                      <CardDescription>
                        Visualización espacial de los vectores de ejemplos. Los puntos cercanos indican títulos semánticamente similares.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 min-h-[400px]">
                      <EmbeddingVisualizer 
                        examples={examples}
                        className="h-full"
                      />
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {/* Sección de categorización */}
              {activeTab === "categorization" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Categorización avanzada</CardTitle>
                      <CardDescription>
                        Herramienta para categorizar ejemplos en grupos temáticos que ayuden a mejorar el análisis.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 min-h-[500px]">
                      <AdvancedCategorizationPanel 
                        examples={examples}
                        onCategorize={handleCategorizeExamples}
                        className="h-full"
                      />
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="p-6 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}