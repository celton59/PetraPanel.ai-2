import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Video } from "@db/schema";
import { useForm } from "react-hook-form";
import { ProjectSelector } from "@/components/ProjectSelector";
import { OptimizationReviewSection } from "./review/OptimizationReviewSection";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface VideoOptimizerProps {
  video: Video;
  onUpdate: (videoId: number, data: any) => Promise<void>;
}

export function VideoOptimizer({ video, onUpdate }: VideoOptimizerProps) {
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(video.projectId);
  const [optimizedTitle, setOptimizedTitle] = useState(video.optimizedTitle || video.title || "");

  if (video.status !== "in_progress" && video.status !== "title_corrections") {
    return null;
  }

  const form = useForm();

  const handleSubmit = async () => {
    if (!selectedProjectId) return;
    setIsSubmitting(true);
    try {
      await onUpdate(video.id, {
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
    <div className="w-full h-screen bg-background p-6">
      <Card className="w-full h-full border-none shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            Optimización de Contenido
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[calc(100vh-200px)]">
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 h-full">
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

            {video.status === "title_corrections" && video.lastReviewComments && (
              <Alert variant="destructive" className="bg-destructive/10 border-none">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {video.lastReviewComments}
                </AlertDescription>
              </Alert>
            )}

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
    </div>
  );
}