import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useVideos } from "@/hooks/useVideos";
import { useUser } from "@/hooks/use-user";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import {
  Loader2,
  FolderKanban,
  VideoIcon,
  FolderIcon,
  FileVideo,
  ArrowRight,
  CheckCircle2,
  CircleSlash,
  FileStack,
  ListPlus,
  FileTextIcon,
  Upload,
  Eye,
  FileUp,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ProjectSelector } from "@/components/project/ProjectSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const videoSchema = z.object({
  title: z
    .string()
    .min(1, "El título es requerido")
    .max(100, "El título no puede exceder los 100 caracteres"),
  description: z
    .string()
    .max(500, "La descripción no puede exceder los 500 caracteres")
    .optional(),
});

type VideoFormValues = z.infer<typeof videoSchema>;

interface Project {
  id: number;
  name: string;
}

interface NewVideoDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function NewVideoDialog({ open, onOpenChange }: NewVideoDialogProps) {
  const [step, setStep] = useState(1);
  const [selectedProject, setSelectedProject] = useState<Project | undefined>(
    undefined,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("single");
  const [bulkTitles, setBulkTitles] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const { user } = useUser();
  const [, navigate] = useLocation();

  // Verificar si el usuario tiene permiso para crear videos
  useEffect(() => {
    if (user && user.role !== "admin" && open) {
      toast.error("Acceso denegado", {
        description: "No tienes permisos para crear nuevos videos"
      });

      // Cerrar el diálogo y redirigir si no tiene permisos
      if (onOpenChange) {
        onOpenChange(false);
      }
      navigate("/videos");
    }
  }, [user, open, onOpenChange, navigate]);

  const { createVideo, createBulkVideos } = useVideos();

  const form = useForm<VideoFormValues>({
    resolver: zodResolver(videoSchema),
    defaultValues: {
      title: "",
      description: "",
    },
    mode: "onChange",
  });

  function resetForm() {
    setStep(1);
    setSelectedProject(undefined);
    setActiveTab("single");
    setBulkTitles("");
    setShowPreview(false);
    form.reset({
      title: "",
      description: "",
    });
  }

  // Función para importar títulos desde un archivo
  function handleFileImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Aceptamos solo archivos .txt y .csv
    if (file.type !== "text/plain" && !file.name.endsWith('.csv')) {
      toast.error("Formato de archivo no soportado", {
        description: "Solo se permiten archivos TXT o CSV",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      // Para CSV, separamos por líneas y comas si es necesario
      if (file.name.endsWith('.csv')) {
        // Dividimos por líneas primero
        const lines = content.split(/\r?\n/).filter(line => line.trim());
        // Si solo hay una línea con comas, probablemente es un CSV con una línea
        if (lines.length === 1 && lines[0].includes(',')) {
          const titles = lines[0].split(',').map(title => title.trim()).filter(Boolean);
          setBulkTitles(titles.join('\n'));
        } else {
          // Múltiples líneas, asumimos una por título
          setBulkTitles(lines.join('\n'));
        }
      } else {
        // Para archivos .txt, simplemente usamos el contenido tal cual
        setBulkTitles(content);
      }

      // Resetear el input para permitir cargar el mismo archivo otra vez
      event.target.value = '';

      toast.success("Archivo importado", {
        description: "Los títulos se han cargado correctamente",
      });
    };

    reader.onerror = () => {
      toast.error("Error al leer el archivo", {
        description: "No se pudo procesar el archivo seleccionado",
      });
    };

    reader.readAsText(file);
  }

  // Función para manejar el drag and drop de archivos
  function handleDragOver(event: React.DragEvent) {
    event.preventDefault();
    setIsDraggingFile(true);
  }

  function handleDragLeave(event: React.DragEvent) {
    event.preventDefault();
    setIsDraggingFile(false);
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setIsDraggingFile(false);

    const file = event.dataTransfer.files[0];
    if (!file) return;

    // Mismo procesamiento que en handleFileImport
    if (file.type !== "text/plain" && !file.name.endsWith('.csv')) {
      toast.error("Formato de archivo no soportado", {
        description: "Solo se permiten archivos TXT o CSV",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (file.name.endsWith('.csv')) {
        const lines = content.split(/\r?\n/).filter(line => line.trim());
        if (lines.length === 1 && lines[0].includes(',')) {
          const titles = lines[0].split(',').map(title => title.trim()).filter(Boolean);
          setBulkTitles(titles.join('\n'));
        } else {
          setBulkTitles(lines.join('\n'));
        }
      } else {
        setBulkTitles(content);
      }

      toast.success("Archivo importado", {
        description: "Los títulos se han cargado correctamente",
      });
    };

    reader.onerror = () => {
      toast.error("Error al leer el archivo", {
        description: "No se pudo procesar el archivo seleccionado",
      });
    };

    reader.readAsText(file);
  }

  // Función para generar la vista previa de los videos
  function renderVideoPreview() {
    const titles = bulkTitles
      .split('\n')
      .map(line => line.trim())
      .filter(title => title.length > 0);

    if (titles.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-10 bg-muted/20 rounded-lg border border-dashed">
          <AlertCircle className="h-10 w-10 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">No hay títulos para previsualizar</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Vista Previa ({titles.length} videos)</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(false)}
            className="h-7 text-xs"
          >
            Volver a edición
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-2 max-h-[180px] overflow-y-auto pr-2">
          {titles.map((title, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 bg-background rounded-md border"
            >
              <div className="bg-primary/10 text-primary rounded-full h-6 w-6 flex items-center justify-center font-medium text-xs shrink-0">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{title}</p>
                <p className="text-xs text-muted-foreground">
                  Proyecto: {selectedProject?.name}
                </p>
              </div>
              <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full shrink-0">
                Pendiente
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function getStep1Content() {
    return (
      <Card className="overflow-hidden border-primary/20">
        <CardHeader className="bg-muted/50">
          <CardTitle className="text-lg flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-primary" />
            Selecciona un proyecto
          </CardTitle>
          <CardDescription>
            El video será asociado al proyecto que selecciones a continuación
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ProjectSelector
              value={selectedProject?.id || null}
              onChange={(project) => {
                setSelectedProject(project);
                // Añadimos una pequeña animación al seleccionar
                setTimeout(() => setStep(2), 300);
              }}
            />
          </motion.div>
        </CardContent>
        <CardFooter className="bg-muted/30 px-6 py-3 border-t flex justify-between">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Paso 1 de 2</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-primary"
            disabled={!selectedProject}
            onClick={() => setStep(2)}
          >
            Siguiente
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    );
  }

  function getStep2Content() {
    return (
      <div className="space-y-4">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {selectedProject && (
              <Card className="border-primary/20 bg-primary/5 overflow-hidden">
                <div className="p-4 flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <FolderIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Proyecto seleccionado</h4>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">{selectedProject?.name}</span> &bull; <span className="text-xs">{selectedProject?.id}</span>
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto h-7 w-7"
                    onClick={() => setStep(1)}
                  >
                    <CircleSlash className="h-4 w-4 text-muted-foreground/70" />
                  </Button>
                </div>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        <Card className="overflow-hidden border-primary/20">
          <CardHeader className="bg-muted/50 pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileVideo className="h-5 w-5 text-primary" />
              Detalles del video
            </CardTitle>
            <CardDescription>
              {activeTab === "single"
                ? "Completa la información básica para tu nuevo video"
                : "Crea múltiples videos a partir de una lista de títulos"}
            </CardDescription>
          </CardHeader>

          <div className="border-b border-muted px-6 pt-2">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="single" className="flex items-center gap-1.5">
                  <VideoIcon className="h-4 w-4" />
                  Video único
                </TabsTrigger>
                <TabsTrigger value="bulk" className="flex items-center gap-1.5">
                  <FileStack className="h-4 w-4" />
                  Carga masiva
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <CardContent className="p-6 space-y-6">
            <AnimatePresence mode="wait">
              {activeTab === "single" ? (
                <motion.div
                  key="single-form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                      >
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Título del Video</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Ej: Introducción a React Hooks"
                                  {...field}
                                  className="bg-background"
                                />
                              </FormControl>
                              <FormDescription>
                                Un título descriptivo y conciso para tu video
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                      >
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descripción</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Describe el contenido del video..."
                                  className="min-h-[120px] resize-none bg-background"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormDescription>
                                <div className="flex justify-between">
                                  <span>Añade una descripción para tu video</span>
                                  <span className="text-xs font-mono">
                                    {(field.value?.length || 0)}/500
                                  </span>
                                </div>
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </motion.div>

                      <div className="flex justify-between pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setStep(1)}
                          size="sm"
                        >
                          Atrás
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={isSubmitting || !form.formState.isValid}
                          className="gap-1.5"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="ml-2">Creando...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4" />
                              Crear Video
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </motion.div>
              ) : (
                <motion.div
                  key="bulk-form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="flex flex-col space-y-2">
                    <div className="flex gap-2 items-start">
                      <div className="bg-primary/10 p-1.5 rounded text-primary">
                        <ListPlus className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-1">Lista de Títulos</h4>
                        <p className="text-xs text-muted-foreground">
                          Ingresa un título por línea. Se creará un video por cada línea.
                        </p>
                      </div>
                    </div>

                    <Textarea
                      value={bulkTitles}
                      onChange={(e) => setBulkTitles(e.target.value)}
                      placeholder="Título 1&#10;Título 2&#10;Título 3&#10;..."
                      className="h-[120px] max-h-[120px] bg-background"
                    />

                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <FileTextIcon className="h-3.5 w-3.5" />
                        <span>
                          {bulkTitles.split('\n').filter(line => line.trim().length > 0).length} títulos
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {bulkTitles.trim() && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => setBulkTitles('')}
                          >
                            Limpiar
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Área para drop de archivos */}
                    <div
                      className={`border-2 border-dashed rounded-md p-3 mt-2 transition-colors ${
                        isDraggingFile
                          ? 'bg-primary/10 border-primary'
                          : 'bg-muted/30 border-muted-foreground/20 hover:bg-muted/50'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <div className="flex items-center justify-center gap-3">
                        <div className={`rounded-full p-2 shrink-0 ${isDraggingFile ? 'bg-primary/20 text-primary' : 'bg-muted-foreground/10 text-muted-foreground'}`}>
                          <FileUp className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Importar desde archivo</p>
                          <p className="text-xs text-muted-foreground">
                            Arrastra un archivo TXT o CSV aquí, o{" "}
                            <label className="text-primary cursor-pointer hover:underline">
                              busca en tu dispositivo
                              <input
                                type="file"
                                className="hidden"
                                accept=".txt,.csv"
                                onChange={handleFileImport}
                              />
                            </label>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Botones para vista previa y creación */}
                  {showPreview ? (
                    renderVideoPreview()
                  ) : (
                    <div className="flex justify-between pt-4">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setStep(1)}
                          size="sm"
                        >
                          Atrás
                        </Button>
                        {bulkTitles.trim() && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setShowPreview(true)}
                            className="gap-1.5"
                          >
                            <Eye className="h-4 w-4" />
                            Vista previa
                          </Button>
                        )}
                      </div>
                      <Button
                        onClick={handleBulkSubmit}
                        size="sm"
                        disabled={isSubmitting || !bulkTitles.trim()}
                        className="gap-1.5 w-[200px] justify-center"
                      >
                        {isSubmitting && bulkTitles.trim() ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Creando videos...
                          </>
                        ) : (
                          <>
                            <FileStack className="h-4 w-4" />
                            Crear {bulkTitles.split('\n').filter(line => line.trim().length > 0).length} Videos
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    );
  }

  async function onSubmit(data: VideoFormValues) {
    // Verificar el rol del usuario
    if (user?.role !== "admin") {
      toast.error("Acceso denegado", {
        description: "No tienes permisos para crear nuevos videos"
      });
      if (onOpenChange) {
        onOpenChange(false);
      }
      return;
    }

    if (!selectedProject) {
      toast.error("Error", {
        description: "Debes seleccionar un proyecto",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createVideo({
        projectId: selectedProject.id,
        title: data.title,
        description: data.description || "",
      });

      queryClient.invalidateQueries({ queryKey: ["videos"] });

      if (onOpenChange) {
        onOpenChange(false);
      }
      resetForm();
    } catch (error: any) {
      console.error("Error creating video:", error);
      toast.error("Error", {
        description: error.message || "No se pudo crear el video",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleBulkSubmit() {
    // Verificar el rol del usuario
    if (user?.role !== "admin") {
      toast.error("Acceso denegado", {
        description: "No tienes permisos para crear nuevos videos"
      });
      if (onOpenChange) {
        onOpenChange(false);
      }
      return;
    }

    if (!selectedProject) {
      toast.error("Error", {
        description: "Debes seleccionar un proyecto",
      });
      return;
    }

    // Obtener lista de títulos no vacíos
    const titles = bulkTitles
      .split('\n')
      .map(line => line.trim())
      .filter(title => title.length > 0);

    if (titles.length === 0) {
      toast.error("Error", {
        description: "Debes ingresar al menos un título",
      });
      return;
    }

    // Mostrar siempre una confirmación con el número de videos
    if (!window.confirm(`¿Estás seguro que deseas crear ${titles.length} videos? Esta operación puede tardar varios minutos.`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createBulkVideos({
        projectId: selectedProject.id,
        titles,
      });

      queryClient.invalidateQueries({ queryKey: ["videos"] });

      if (onOpenChange) {
        onOpenChange(false);
      }
      resetForm();
    } catch (error: any) {
      console.error("Error creating videos in bulk:", error);
      toast.error("Error", {
        description: error.message || "No se pudieron crear los videos en masa",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden max-h-[90vh]">
        <div className="bg-muted/80 px-6 py-4 border-b">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              {step === 1 ? (
                <>
                  <FolderKanban className="h-5 w-5 text-primary" />
                  Crear Nuevo Video
                </>
              ) : (
                <>
                  <VideoIcon className="h-5 w-5 text-primary" />
                  Crear Nuevo Video
                </>
              )}
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Stepper */}
          <div className="flex items-center justify-center" style={{ marginBottom: '3rem'}}>
            <div className="flex items-center">
              <div className="relative">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    step === 1
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30 bg-background text-muted-foreground"
                  }`}
                >
                  {step > 1 ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">1</span>
                  )}
                </div>
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium">
                  Proyecto
                </span>
              </div>

              <div className="w-20 mx-1">
                <div
                  className={`h-0.5 ${
                    step > 1 ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                />
              </div>

              <div className="relative">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    step === 2
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30 bg-background text-muted-foreground"
                  }`}
                >
                  <span className="text-sm font-medium">2</span>
                </div>
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium">
                  Detalles
                </span>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                {getStep1Content()}
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {getStep2Content()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}