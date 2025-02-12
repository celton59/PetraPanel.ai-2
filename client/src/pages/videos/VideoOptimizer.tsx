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

  // Si el video no está en in_progress o title_corrections, no mostramos el optimizador
  if (video.status !== "in_progress" && video.status !== "title_corrections") {
    return null;
  }

  const form = useForm<FormValues>({
    defaultValues: {
      optimizedDescription: video.optimizedDescription || video.description || "",
      tags: video.tags || ""
    }
  });

  const handleSubmit = async (formData: FormValues) => {
    if (!selectedProjectId) {
      return;
    }

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
              optimizedAt: new Date().toISOString()
            }
          }
        }
      });
    } catch (error) {
      console.error("Error al actualizar el video:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollArea className="h-[80vh] sm:h-[70vh] px-1">
      <div className="max-w-2xl mx-auto">
        <Card className="border-0 shadow-none">
          <CardHeader className="px-0 sm:px-6">
            <CardTitle>Optimización de Contenido</CardTitle>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Proyecto</label>
                <ProjectSelector
                  value={selectedProjectId}
                  onChange={setSelectedProjectId}
                />
              </div>

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
                  className="min-h-[80px] sm:min-h-[100px] resize-none text-sm" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Descripción Optimizada</label>
                <Textarea 
                  {...form.register("optimizedDescription")} 
                  placeholder="Ingresa la descripción optimizada"
                  className="min-h-[80px] sm:min-h-[100px] resize-none text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tags (separados por comas)</label>
                <Textarea 
                  {...form.register("tags")} 
                  placeholder="tag1, tag2, tag3" 
                  className="min-h-[40px] sm:min-h-[50px] resize-none text-sm"
                />
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting || !selectedProjectId} 
                className="w-full mt-6"
              >
                {isSubmitting ? "Enviando..." : "Enviar a Revisión"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}