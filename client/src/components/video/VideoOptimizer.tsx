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

  // Solo se muestra el optimizador si el video está en "in_progress" o "title_corrections"
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
    <div className="min-h-screen w-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center p-6">
      <ScrollArea className="w-full max-w-6xl bg-transparent">
        <Card className="shadow-2xl rounded-2xl bg-white overflow-hidden">
          <CardHeader className="px-8 py-6 border-b border-gray-200">
            <CardTitle className="text-3xl font-bold text-gray-800">
              Optimización de Contenido
            </CardTitle>
          </CardHeader>
          <CardContent className="px-8 py-6">
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
              {/* Selector de Proyecto */}
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2">
                  Proyecto
                </label>
                <ProjectSelector
                  value={selectedProjectId}
                  onChange={setSelectedProjectId}
                />
              </div>

              {/* Grid de dos columnas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Columna Izquierda */}
                <div className="space-y-8">
                  <OptimizationReviewSection
                    video={video}
                    optimizedTitle={optimizedTitle}
                    setOptimizedTitle={setOptimizedTitle}
                  />
                  <div>
                    <label className="block text-lg font-medium text-gray-700 mb-2">
                      Descripción Original
                    </label>
                    <Textarea
                      value={video.description || ""}
                      disabled
                      className="min-h-[180px] resize-none text-base border border-gray-200 rounded-lg bg-gray-100"
                    />
                  </div>
                </div>
                {/* Columna Derecha */}
                <div className="space-y-8">
                  <div>
                    <label className="block text-lg font-medium text-gray-700 mb-2">
                      Descripción Optimizada
                    </label>
                    <Textarea
                      {...form.register("optimizedDescription")}
                      placeholder="Ingresa la descripción optimizada"
                      className="min-h-[180px] resize-none text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                  <div>
                    <label className="block text-lg font-medium text-gray-700 mb-2">
                      Tags (separados por comas)
                    </label>
                    <Textarea
                      {...form.register("tags")}
                      placeholder="tag1, tag2, tag3"
                      className="min-h-[100px] resize-none text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                </div>
              </div>
              {/* Botón de envío */}
              <Button
                type="submit"
                disabled={isSubmitting || !selectedProjectId}
                className="w-full py-4 text-xl font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
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
