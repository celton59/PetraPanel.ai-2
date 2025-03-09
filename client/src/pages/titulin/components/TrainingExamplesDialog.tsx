import React, { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
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
import { Loader2, Plus, Trash, Search } from "lucide-react";

interface TrainingExample {
  id: number;
  title: string;
  is_evergreen: boolean;
  created_at: string;
  created_by?: number;
}

interface TrainingExamplesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TrainingExamplesDialog({
  open,
  onOpenChange,
}: TrainingExamplesDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [examples, setExamples] = useState<TrainingExample[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [isEvergreen, setIsEvergreen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Cargar ejemplos
  const loadExamples = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/titulin/training-examples");
      if (response.data.success) {
        setExamples(response.data.data);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Error al cargar ejemplos de entrenamiento",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar ejemplos al abrir el diálogo
  useEffect(() => {
    if (open) {
      loadExamples();
    }
  }, [open]);

  // Añadir nuevo ejemplo
  const addExample = async () => {
    if (!newTitle.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El título no puede estar vacío",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post("/api/titulin/training-examples", {
        title: newTitle,
        isEvergreen,
      });

      if (response.data.success) {
        toast({
          title: "Éxito",
          description: "Ejemplo añadido correctamente",
        });
        setNewTitle("");
        loadExamples();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Error al añadir ejemplo",
      });
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
        toast({
          title: "Éxito",
          description: "Ejemplo eliminado correctamente",
        });
        loadExamples();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Error al eliminar ejemplo",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar ejemplos según la pestaña activa y término de búsqueda
  // Aplicar filtros a los ejemplos (por pestaña y término de búsqueda)
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
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col p-6">
        <DialogHeader className="pb-4">
          <DialogTitle>Ejemplos de entrenamiento para análisis de contenido</DialogTitle>
          <DialogDescription>
            Estos ejemplos ayudan a mejorar la precisión del análisis de títulos, enseñando a la IA a distinguir entre contenido evergreen (atemporal) y no evergreen (temporal). Cuantos más ejemplos de calidad agregue, mejores serán los resultados del análisis.
          </DialogDescription>
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

            <div className="flex-1 overflow-auto">
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
                                disabled={isLoading}
                              >
                                <Trash className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="evergreen" className="space-y-4">
                
                <div className="mb-4 flex gap-2 items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar ejemplos evergreen..." 
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
                        <TableHead className="w-[100px]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExamples.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                            No hay ejemplos disponibles
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredExamples.map((example) => (
                          <TableRow key={example.id}>
                            <TableCell className="font-medium">{example.title}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteExample(example.id)}
                                disabled={isLoading}
                              >
                                <Trash className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="not-evergreen" className="space-y-4">
                
                <div className="mb-4 flex gap-2 items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar ejemplos no evergreen..." 
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
                        <TableHead className="w-[100px]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExamples.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                            No hay ejemplos disponibles
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredExamples.map((example) => (
                          <TableRow key={example.id}>
                            <TableCell className="font-medium">{example.title}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteExample(example.id)}
                                disabled={isLoading}
                              >
                                <Trash className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <DialogFooter className="mt-4 pt-3 border-t flex justify-end">
          <Button 
            variant="default" 
            size="default" 
            onClick={() => onOpenChange(false)}
            className="px-5"
          >
            Cerrar diálogo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}