
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Video } from "@db/schema";
import { useForm } from "react-hook-form";
import { ProjectSelector } from "@/components/ProjectSelector";
import { OptimizationReviewSection } from "./review/OptimizationReviewSection";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface VideoOptimizerProps {
  video: Video;
  onUpdate: (videoId: number, data: any) => Promise<void>;
}

type FormValues = {
  optimizedDescription: string;
  tags: string;
};

export function VideoOptimizer({ video, onUpdate }: VideoOptimizerProps) {
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(video.projectId);
  const [optimizedTitle, setOptimizedTitle] = useState(video.optimizedTitle || video.title || "");

  if (video.status !== "in_progress" && video.status !== "title_corrections") {
    return null;
  }

  const form = useForm<FormValues>({
    defaultValues: {
      optimizedDescription: video.optimizedDescription || video.description || "",
      tags: video.tags || "",
    },
  });

  const handleSubmit = async (formData: FormValues) => {
    if (!selectedProjectId) return;
    setIsSubmitting(true);
    try {
      await onUpdate(video.id, {
        ...formData,
        projectId: selectedProjectId,
        optimizedTitle,
        status: "optimize_review" as const,
        updatedAt: new Date().toISOString(),
        metadata: {
          ...video.metadata,
          optimization: {
            ...video.metadata?.optimization,
            optimizedBy: {
              userId: user?.id,
              username: user?.username,
              optimizedAt: new Date().toISOString(),
            },
          },
        },
      });
    } catch (error) {
      console.error("Error al actualizar el video:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-background h-screen">
      <ScrollArea className="h-full">
        <Card className="border-none shadow-none">
          <CardHeader className="px-6">
            <CardTitle className="text-2xl font-semibold">
              Optimización de Contenido
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6">
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Selector de Proyecto */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Proyecto</label>
                <ProjectSelector
                  value={selectedProjectId}
                  onChange={setSelectedProjectId}
                />
              </div>

              {/* Grilla de contenido */}
              <div className="grid grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
                {/* Columna Izquierda */}
                <div className="space-y-6 pr-3">
                  <OptimizationReviewSection
                    video={video}
                    optimizedTitle={optimizedTitle}
                    setOptimizedTitle={setOptimizedTitle}
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Descripción Original</label>
                    <Textarea
                      value={video.description || ""}
                      disabled
                      className="h-36 resize-none bg-muted/50"
                    />
                  </div>
                </div>

                {/* Columna Derecha */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Descripción Optimizada</label>
                    <Textarea
                      {...form.register("optimizedDescription")}
                      placeholder="Escribe la descripción optimizada"
                      className="h-36 resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tags</label>
                    <Textarea
                      {...form.register("tags")}
                      placeholder="Ingresa los tags separados por comas"
                      className="h-24 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Alertas y estado */}
              {video.status === "title_corrections" && video.lastReviewComments && (
                <Alert variant="destructive" className="bg-destructive/10 border-none">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {video.lastReviewComments}
                  </AlertDescription>
                </Alert>
              )}

              {/* Botón de envío */}
              <Button
                type="submit"
                disabled={isSubmitting || !selectedProjectId}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? "Enviando..." : "Enviar a Revisión"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </ScrollArea>
    </div>
  );
}
