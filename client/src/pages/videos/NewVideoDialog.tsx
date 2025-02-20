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
import { ProjectSelector } from "./ProjectSelector";
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
import { Loader2, FolderKanban, VideoIcon, FolderIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

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

  const { createVideo } = useVideos(selectedProject?.id);

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
    form.reset({
      title: "",
      description: "",
    });
  }

  function getStep1Content() {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">Selecciona un proyecto</h3>
            <p className="text-sm text-muted-foreground">
              El video será creado dentro del proyecto seleccionado
            </p>
          </div>
          <ProjectSelector
            value={selectedProject?.id || null}
            onChange={(project) => {
              setSelectedProject(project);
              setStep(2);
            }}
          />
        </div>
      </Card>
    );
  }

  function getStep2Content() {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {step === 2 && selectedProject && (
            <Card className="p-4 border-primary/20 bg-primary/5 mb-4">
              <div className="flex items-center gap-2">
                <FolderIcon className="h-4 w-4 text-primary" />
                <div className="space-y-1">
                  <h4 className="font-medium">Proyecto seleccionado</h4>
                  <p className="text-sm text-muted-foreground font-medium">
                    {selectedProject?.name || "Cargando..."}
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
                    <Input
                      placeholder="Ej: Introducción a React Hooks"
                      {...field}
                    />
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
                  <FormDescription>Máximo 500 caracteres</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Card>

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
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
        <Button>
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
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-sm ${
                step === 1
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              1
            </span>
            <span className="text-sm font-medium">Proyecto</span>
            <span className="mx-2">→</span>
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-sm ${
                step === 2
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              2
            </span>
            <span className="text-sm font-medium">Detalles</span>
          </div>

          {step === 1 && getStep1Content()}
          {step === 2 && getStep2Content()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
