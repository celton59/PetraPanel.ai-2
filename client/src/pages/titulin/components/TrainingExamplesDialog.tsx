import React, { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import axios from "axios";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious,
  PaginationEllipsis
} from "@/components/ui/pagination";
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
  ListPlus
} from "lucide-react";

interface TrainingExample {
  id: number;
  title: string;
  is_evergreen: boolean;
  created_at: string;
  created_by?: number;
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

export function TrainingExamplesDialog({
  open,
  onOpenChange,
}: TrainingExamplesDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [examples, setExamples] = useState<TrainingExample[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [isEvergreen, setIsEvergreen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // Estado para paginación
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 50,
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
  const [selectedChannel, setSelectedChannel] = useState<{id: string, name: string} | null>(null);
  const [channels, setChannels] = useState<{id: string, name: string}[]>([]);
  const [importAsEvergreen, setImportAsEvergreen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estado para importación masiva
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [bulkTitles, setBulkTitles] = useState("");
  const [bulkIsEvergreen, setBulkIsEvergreen] = useState(true);
  const [isImportingBulk, setIsImportingBulk] = useState(false);
  
  // Estado para ordenamiento
  const [sortBy, setSortBy] = useState<string>("id");
  const [sortDir, setSortDir] = useState<string>("asc");

  // Cargar ejemplos con paginación
  const loadExamples = async (page = 1, limit = 50) => {
    setIsLoading(true);
    setSelectedExamples([]);
    setSelectAll(false);

    try {
      // Construir parámetros de consulta
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortDir
      });

      // Añadir parámetros adicionales solo si tienen valor
      if (searchTerm) params.append('search', searchTerm);
      if (activeTab !== 'all') params.append('type', activeTab);

      const response = await axios.get(`/api/titulin/training-examples?${params}`);
      
      if (response.data.success) {
        setExamples(response.data.data);
        setPagination(response.data.pagination);
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
      loadExamples(1, pagination.limit);
      loadChannels();
    }
  }, [open]);
  
  // Cargar canales de YouTube
  const loadChannels = async () => {
    try {
      const response = await axios.get('/api/titulin/channels/for-training');
      if (response.data && Array.isArray(response.data)) {
        setChannels(response.data.map(channel => ({
          id: channel.channelId,
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
      // Reiniciar a la primera página al cambiar los filtros
      loadExamples(1, pagination.limit);
    }, 300); // Esperar 300ms después de terminar de escribir
    
    return () => clearTimeout(timer);
  }, [searchTerm, activeTab, sortBy, sortDir]);
  
  // Manejar ordenamiento y selección múltiple
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
      const response = await axios.post("/api/titulin/training-examples", {
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
      const response = await axios.delete(`/api/titulin/training-examples/${id}`);
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
        activeTab === "all" || 
        (activeTab === "evergreen" && example.is_evergreen) || 
        (activeTab === "not-evergreen" && !example.is_evergreen);
      
      // Filtrar por término de búsqueda
      const matchesSearch = 
        !searchTerm.trim() || 
        example.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesTab && matchesSearch;
    });
  }, [examples, activeTab, searchTerm]);
  
  // Función para cambiar de pestaña y limpiar la búsqueda
  const handleTabChange = (value: string) => {
    setSearchTerm('');
    setActiveTab(value);
    loadExamples(1, pagination.limit);
  };
  
  // Función para cambiar de página
  const handlePageChange = (page: number) => {
    if (page !== pagination.page && page > 0 && page <= pagination.totalPages) {
      loadExamples(page, pagination.limit);
    }
  };
  
  // Función para exportar ejemplos
  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Crear la URL con los parámetros de filtrado
      let url = '/api/titulin/training-examples/export';
      if (activeTab !== 'all') {
        url += `?type=${activeTab.replace('evergreen', 'evergreen').replace('not-evergreen', 'not-evergreen')}`;
      }
      
      // Realizar la petición con responseType blob para descargar el archivo
      const response = await axios.get(url, { responseType: 'blob' });
      
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
    
    setIsImportingFromYoutube(true);
    try {
      // Enviamos el channelId que corresponde al campo channelId de la tabla youtube_channels
      const response = await axios.post('/api/titulin/training-examples/import-from-channel', {
        channelId: selectedChannel.id, // Este es el ID de YouTube, no el ID interno de la base de datos
        isEvergreen: importAsEvergreen
      });
      
      if (response.data.success) {
        toast.success(response.data.message || `Títulos del canal ${selectedChannel.name} importados como ${importAsEvergreen ? 'evergreen' : 'no evergreen'}`);
        loadExamples(); // Recargar ejemplos
        setYoutubeChannelOpen(false); // Cerrar el diálogo
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al importar títulos desde YouTube');
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
      const response = await axios.post('/api/titulin/training-examples/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
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
      const response = await axios.post('/api/titulin/training-examples/bulk', {
        operation: 'create',
        titles,
        isEvergreen: bulkIsEvergreen
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
      const response = await axios.post('/api/titulin/training-examples/bulk', {
        operation,
        ids: selectedExamples,
        data
      });
      
      if (response.data.success) {
        toast.success(`${response.data.affectedCount} ejemplos ${operation === 'delete' ? 'eliminados' : 'actualizados'} correctamente`);
        loadExamples(pagination.page, pagination.limit);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Error en operación masiva: ${operation}`);
    } finally {
      setIsLoading(false);
      setSelectedExamples([]);
      setSelectAll(false);
    }
  };

  return (
    <>
      {/* Diálogo para importación masiva de ejemplos */}
      <Dialog open={bulkImportOpen} onOpenChange={setBulkImportOpen}>
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
                placeholder="Ingrese un título por línea, por ejemplo:
Como ganar dinero con YouTube en 2023
10 trucos para mejorar tu SEO
Los mejores plugins de WordPress
..."
                value={bulkTitles}
                onChange={(e) => setBulkTitles(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="bulk-is-evergreen"
                checked={bulkIsEvergreen}
                onCheckedChange={setBulkIsEvergreen}
              />
              <Label htmlFor="bulk-is-evergreen">
                Importar como contenido evergreen (atemporal)
              </Label>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <strong>Nota:</strong> Si un título ya existe en la base de datos, se omitirá.
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkImportOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleBulkImport}
              disabled={isImportingBulk || !bulkTitles.trim()}
            >
              {isImportingBulk ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <ListPlus className="mr-2 h-4 w-4" />
                  Importar títulos
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para importar desde canal de YouTube */}
      <Dialog open={youtubeChannelOpen} onOpenChange={setYoutubeChannelOpen}>
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
                  const channel = channels.find(c => c.id === value);
                  if (channel) {
                    setSelectedChannel({ id: channel.id, name: channel.name });
                  }
                }}
              >
                <SelectTrigger id="channel-selector">
                  <SelectValue placeholder="Seleccionar un canal" />
                </SelectTrigger>
                <SelectContent>
                  {channels.length === 0 ? (
                    <SelectItem value="" disabled>No hay canales disponibles</SelectItem>
                  ) : (
                    channels.map((channel) => (
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
                id="import-as-evergreen"
                checked={importAsEvergreen}
                onCheckedChange={setImportAsEvergreen}
              />
              <Label htmlFor="import-as-evergreen">
                Importar como contenido evergreen (atemporal)
              </Label>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <strong>Nota:</strong> Se importarán todos los títulos de videos del canal seleccionado.
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setYoutubeChannelOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleImportFromYoutube}
              disabled={isImportingFromYoutube || !selectedChannel}
            >
              {isImportingFromYoutube ? (
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
      
      {/* Diálogo principal de ejemplos de entrenamiento */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col p-6">
          <DialogHeader className="pb-4">
            <div className="flex justify-between items-center">
              <div>
                <DialogTitle>Ejemplos de entrenamiento para análisis de contenido</DialogTitle>
                <DialogDescription>
                  Estos ejemplos ayudan a mejorar la precisión del análisis de títulos, enseñando a la IA a distinguir entre contenido evergreen (atemporal) y no evergreen (temporal). Cuantos más ejemplos de calidad agregue, mejores serán los resultados del análisis.
                </DialogDescription>
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleImportClick} disabled={isUploading} variant="outline" size="sm">
                  {isUploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileUp className="mr-2 h-4 w-4" />
                  )}
                  Importar CSV
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".csv"
                />
                <Button 
                  variant="outline"
                  onClick={() => setBulkImportOpen(true)}
                  size="sm"
                >
                  <ListPlus className="mr-2 h-4 w-4" />
                  Importar en masa
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setYoutubeChannelOpen(true)}
                  disabled={isImportingFromYoutube}
                  size="sm"
                >
                  {isImportingFromYoutube ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <AlertCircle className="mr-2 h-4 w-4" />
                  )}
                  Importar desde YouTube
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 flex flex-col overflow-hidden">
            <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="all">
                    Todos
                    <Badge variant="secondary" className="ml-2 bg-muted">
                      {examples.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="evergreen">
                    Evergreen
                    <Badge variant="secondary" className="ml-2 bg-green-50 text-green-700">
                      {examples.filter(e => e.is_evergreen).length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="not-evergreen">
                    No Evergreen
                    <Badge variant="secondary" className="ml-2 bg-amber-50 text-amber-700">
                      {examples.filter(e => !e.is_evergreen).length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Contenido principal */}
              <div className="flex-1 overflow-auto">
                {/* Contenido de la pestaña "Todos" */}
                <TabsContent value="all" className="space-y-4">
                  <Card>
                    <CardHeader className="py-4">
                      <CardTitle className="text-base">Añadir nuevo ejemplo de entrenamiento</CardTitle>
                      <CardDescription>
                        Estos ejemplos ayudan a la IA a determinar si un título es evergreen o no
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4">
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="title">Título del video</Label>
                          <div className="flex gap-2">
                            <Input
                              id="title"
                              placeholder="Ingrese un título de ejemplo para el análisis"
                              value={newTitle}
                              onChange={(e) => setNewTitle(e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              onClick={addExample}
                              disabled={isLoading || !newTitle.trim()}
                              className="whitespace-nowrap"
                            >
                              {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Plus className="mr-2 h-4 w-4" />
                              )}
                              Añadir
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 mt-1">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="is-evergreen"
                              checked={isEvergreen}
                              onCheckedChange={setIsEvergreen}
                            />
                            <Label htmlFor="is-evergreen" className="font-medium">
                              {isEvergreen ? (
                                <span className="text-green-600 flex items-center">
                                  Es contenido evergreen
                                  <Badge variant="outline" className="ml-2 bg-green-50 text-green-600 border-green-200">
                                    Evergreen
                                  </Badge>
                                </span>
                              ) : (
                                <span className="text-amber-600 flex items-center">
                                  No es contenido evergreen
                                  <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-600 border-amber-200">
                                    No Evergreen
                                  </Badge>
                                </span>
                              )}
                            </Label>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="mb-4 flex gap-2 items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input 
                        placeholder="Buscar ejemplos..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 h-10" 
                      />
                    </div>
                    <Badge className="ml-2">
                      {filteredExamples.length} resultado{filteredExamples.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>

                  <div className="rounded-md border overflow-auto max-h-[400px]">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background border-b z-10">
                        <TableRow>
                          <TableHead>Título</TableHead>
                          <TableHead className="w-[150px]">Tipo</TableHead>
                          <TableHead className="w-[100px]">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredExamples.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                              No hay ejemplos disponibles
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredExamples.map((example) => (
                            <TableRow key={example.id}>
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
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteExample(example.id)}
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

                  <div className="flex justify-between items-center mt-4">
                    <div className="space-x-2">
                      <Button variant="outline" onClick={handleExport} disabled={isExporting}>
                        {isExporting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <FileDown className="mr-2 h-4 w-4" />
                        )}
                        Exportar CSV
                      </Button>
                    </div>

                    {/* Paginación */}
                    <Pagination>
                      <PaginationContent>
                        {pagination.page > 1 && (
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => handlePageChange(pagination.page - 1)}
                            />
                          </PaginationItem>
                        )}

                        {pagination.page > 2 && (
                          <PaginationItem>
                            <PaginationLink onClick={() => handlePageChange(1)}>
                              1
                            </PaginationLink>
                          </PaginationItem>
                        )}

                        {pagination.page > 3 && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}

                        {pagination.page > 1 && (
                          <PaginationItem>
                            <PaginationLink
                              onClick={() => handlePageChange(pagination.page - 1)}
                            >
                              {pagination.page - 1}
                            </PaginationLink>
                          </PaginationItem>
                        )}

                        <PaginationItem>
                          <PaginationLink isActive>
                            {pagination.page}
                          </PaginationLink>
                        </PaginationItem>

                        {pagination.page < pagination.totalPages && (
                          <PaginationItem>
                            <PaginationLink
                              onClick={() => handlePageChange(pagination.page + 1)}
                            >
                              {pagination.page + 1}
                            </PaginationLink>
                          </PaginationItem>
                        )}

                        {pagination.page < pagination.totalPages - 2 && (
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )}

                        {pagination.page < pagination.totalPages - 1 && (
                          <PaginationItem>
                            <PaginationLink
                              onClick={() => handlePageChange(pagination.totalPages)}
                            >
                              {pagination.totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        )}

                        {pagination.page < pagination.totalPages && (
                          <PaginationItem>
                            <PaginationNext
                              onClick={() => handlePageChange(pagination.page + 1)}
                            />
                          </PaginationItem>
                        )}
                      </PaginationContent>
                    </Pagination>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          <DialogFooter className="border-t mt-4 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}