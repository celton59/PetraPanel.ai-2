import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ProjectSelector } from "../ProjectSelector";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useVideos } from "@/hooks/use-videos";
import { queryClient } from "@/lib/queryClient";
import { Loader2, FolderKanban, VideoIcon, FolderIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";

const videoSchema = z.object({
  title: z.string()
    .min(1, "El título es requerido")
    .max(100, "El título no puede exceder los 100 caracteres"),
  description: z.string()
    .max(500, "La descripción no puede exceder los 500 caracteres")
    .optional()
});

type VideoFormValues = z.infer<typeof videoSchema>;

interface Project {
  id: number;
  name: string;
}

interface NewVideoDialogProps {
  autoOpen?: boolean;
}

export function NewVideoDialog({ autoOpen = false }: NewVideoDialogProps) {
  const [step, setStep] = useState(1);
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const { createVideo } = useVideos(selectedProjects[0]);

  const { data: projectsResponse } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await fetch("/api/projects");
      if (!response.ok) {
        throw new Error("Error al cargar los proyectos");
      }
      return response.json() as Promise<{ data: Project[] }>;
    }
  });

  const projects = projectsResponse?.data || [];

  const form = useForm<VideoFormValues>({
    resolver: zodResolver(videoSchema),
    defaultValues: {
      title: "",
      description: ""
    },
    mode: "onChange"
  });

  const handleBack = () => {
    setStep(1);
  };

  const resetForm = () => {
    setStep(1);
    setSelectedProjects([]);
    form.reset({
      title: "",
      description: ""
    });
  };

  const onSubmit = async (data: VideoFormValues) => {
    if (selectedProjects.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes seleccionar un proyecto"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createVideo({
        projectId: selectedProjects[0],
        title: data.title,
        description: data.description || ""
      });

      queryClient.invalidateQueries({ queryKey: ["videos"] });

      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Error creating video:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo crear el video"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProjectSelection = (projects: number[]) => {
    setSelectedProjects(projects);
    if (projects.length > 0) {
      setStep(2);
    }
  };

  const selectedProject = projects.find((p: Project) => p.id === selectedProjects[0]);

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button data-new-video-trigger>
          <VideoIcon className="mr-2 h-4 w-4" />
          Nuevo Video
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {step === 1 ? (
              <>
                <FolderKanban className="h-5 w-5 text-primary" />
                Selección de Proyecto
              </>
            ) : (
              <>
                <VideoIcon className="h-5 w-5 text-primary" />
                Detalles del Video
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          <div className="flex items-center gap-2">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-sm ${
              step === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              1
            </span>
            <span className="text-sm font-medium">Proyecto</span>
            <span className="mx-2">→</span>
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-sm ${
              step === 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              2
            </span>
            <span className="text-sm font-medium">Detalles</span>
          </div>

          {step === 1 ? (
            <Card className="p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Selecciona un proyecto</h3>
                  <p className="text-sm text-muted-foreground">
                    El video será creado dentro del proyecto seleccionado
                  </p>
                </div>
                <ProjectSelector
                  value={selectedProjects[0] || null}
                  onChange={(value) => handleProjectSelection(value ? [value] : [])}
                />
              </div>
            </Card>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {step === 2 && selectedProjects.length > 0 && (
                  <Card className="p-4 border-primary/20 bg-primary/5 mb-4">
                    <div className="flex items-center gap-2">
                      <FolderIcon className="h-4 w-4 text-primary" />
                      <div className="space-y-1">
                        <h4 className="font-medium">Proyecto seleccionado</h4>
                        <p className="text-sm text-muted-foreground font-medium">
                          {selectedProject?.name || 'Cargando...'}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

                <Card className="p-6 space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título del Video</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Introducción a React Hooks" {...field} />
                        </FormControl>
                        <FormDescription>
                          Un título descriptivo y conciso para tu video
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe el contenido del video..."
                            className="min-h-[100px] resize-none"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Máximo 500 caracteres
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Card>

                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={handleBack}>
                    Atrás
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !form.formState.isValid}
                  >
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Crear Video
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}