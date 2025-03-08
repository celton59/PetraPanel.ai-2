import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
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
  FileTextIcon
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
    form.reset({
      title: "",
      description: "",
    });
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            <CardHeader className="bg-muted/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileVideo className="h-5 w-5 text-primary" />
                Detalles del video
              </CardTitle>
              <CardDescription>
                Completa la información básica para tu nuevo video
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-6 space-y-6">
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
            </CardContent>
            
            <CardFooter className="bg-muted/30 px-6 py-3 border-t flex justify-between">
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
                    Creando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Crear Video
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    );
  }

  async function onSubmit(data: VideoFormValues) {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-white hover:bg-primary/90">
          <VideoIcon className="mr-2 h-4 w-4" />
          Nuevo Video
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
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

        <div className="p-6 space-y-6">
          {/* Stepper */}
          <div className="flex items-center justify-center">
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
