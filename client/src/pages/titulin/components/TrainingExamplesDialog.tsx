import React, { useState, useEffect } from "react";
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
import { Loader2, Plus, Trash } from "lucide-react";

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

  // Filtrar ejemplos según la pestaña activa
  const filteredExamples = examples.filter((example) => {
    if (activeTab === "all") return true;
    if (activeTab === "evergreen") return example.is_evergreen;
    if (activeTab === "not-evergreen") return !example.is_evergreen;
    return true;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Ejemplos de entrenamiento para IA</DialogTitle>
          <DialogDescription>
            Configura los ejemplos de títulos evergreen y no evergreen que se utilizarán para entrenar a la IA
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="evergreen">Evergreen</TabsTrigger>
                <TabsTrigger value="not-evergreen">No Evergreen</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <Badge>{examples.length} Total</Badge>
                <Badge variant="outline" className="bg-green-50">
                  {examples.filter(e => e.is_evergreen).length} Evergreen
                </Badge>
                <Badge variant="outline" className="bg-amber-50">
                  {examples.filter(e => !e.is_evergreen).length} No Evergreen
                </Badge>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              <TabsContent value="all" className="space-y-4 flex-1 overflow-auto">
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-base">Añadir nuevo ejemplo</CardTitle>
                    <CardDescription>
                      Los ejemplos se utilizarán para entrenar al modelo de IA
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="title">Título del video</Label>
                        <Input
                          id="title"
                          placeholder="Ingrese un título de ejemplo"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="is-evergreen"
                            checked={isEvergreen}
                            onCheckedChange={setIsEvergreen}
                          />
                          <Label htmlFor="is-evergreen">
                            {isEvergreen ? "Evergreen" : "No Evergreen"}
                          </Label>
                        </div>
                        <Button
                          onClick={addExample}
                          disabled={isLoading || !newTitle.trim()}
                          className="ml-auto"
                        >
                          {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="mr-2 h-4 w-4" />
                          )}
                          Añadir ejemplo
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="rounded-md border overflow-auto">
                  <Table>
                    <TableHeader>
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

              <TabsContent value="evergreen" className="space-y-4 flex-1 overflow-auto">
                <div className="rounded-md border overflow-auto">
                  <Table>
                    <TableHeader>
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

              <TabsContent value="not-evergreen" className="space-y-4 flex-1 overflow-auto">
                <div className="rounded-md border overflow-auto">
                  <Table>
                    <TableHeader>
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

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}