import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, MessageSquare, CheckCircle2, XCircle, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/hooks/use-user";
import { UpdateVideoData, ApiVideo } from "@/hooks/useVideos";

interface OptimizeReviewContentProps {
  video: ApiVideo;
  onUpdate: (videoId: number, data: UpdateVideoData) => Promise<void>;
}

export function OptimizeReviewContent({ video, onUpdate }: OptimizeReviewContentProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [titleCorrections, setTitleCorrections] = useState<string | undefined>(undefined);
  const { user } = useUser();

  async function handleSubmit (approve: boolean) {

    if (!approve && !titleCorrections?.trim()) return;
    
    setIsSubmitting(true)

    try {
      await onUpdate(video.id, {
        status: approve ? "upload_review" : 'title_corrections',
        reviewedBy: user?.id,
        lastReviewComments: titleCorrections?.trim(),
      });
    } catch (error) {
      console.error("Error al enviar los cambios:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-4">
      
      {/* Title */}
      <div className="grid gap-6 lg:grid-cols-2">
        
        <Card className="overflow-hidden border-2 bg-gradient-to-br from-muted/50 to-transparent">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">Título Original</h3>
              </div>
              <Badge variant="outline" className="bg-background/50">Original</Badge>
            </div>
            <Card className="bg-card/50 border-none">
              <ScrollArea className="h-[100px]">
                <div className="p-4">
                  <p className="text-lg leading-relaxed">{video.title}</p>
                </div>
              </ScrollArea>
            </Card>
          </div>
        </Card>

        <Card className="overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Título Optimizado</h3>
              </div>
              <Badge variant="outline" className="border-primary/20 text-primary">Propuesta</Badge>
            </div>
            <Card className="bg-card/50 border-none">
              <ScrollArea className="h-[100px]">
                <div className="p-4">
                  <p className="text-lg leading-relaxed text-primary">{video.optimizedTitle}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Optimizado por: {video.optimizerUsername}
                  </p>
                </div>
              </ScrollArea>
            </Card>
          </div>
        </Card>
      </div>

      {/* Description */}
      <div className="mt-4 grid gap-6 lg:grid-cols-2">

        <Card className="overflow-hidden border-2 bg-gradient-to-br from-muted/50 to-transparent">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">Descripción Original</h3>
              </div>
              <Badge variant="outline" className="bg-background/50">Original</Badge>
            </div>
            <Card className="bg-card/50 border-none">
              <ScrollArea className="h-[100px]">
                <div className="p-4">
                  <p className="text-lg leading-relaxed">{video.description}</p>
                </div>
              </ScrollArea>
            </Card>
          </div>
        </Card>

        <Card className="overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Descripción Optimizada</h3>
              </div>
              <Badge variant="outline" className="border-primary/20 text-primary">Propuesta</Badge>
            </div>
            <Card className="bg-card/50 border-none">
              <ScrollArea className="h-[100px]">
                <div className="p-4">
                  <p className="text-lg leading-relaxed text-primary">{video.optimizedDescription}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Optimizado por: {video.optimizerUsername}
                  </p>
                </div>
              </ScrollArea>
            </Card>
          </div>
        </Card>
      </div>

      <Card className="mt-4 p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Decisión</h3>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Aprobar
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting || !titleCorrections?.trim()}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rechazar
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Comentarios de Revisión
            </label>
            <Textarea
              placeholder="Escribe aquí los motivos del rechazo o sugerencias de mejora..."
              value={titleCorrections}
              onChange={(e) => setTitleCorrections(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>
        </div>
      </Card>

      {video.lastReviewComments && (
        <Card className="mt-4 p-6 border-destructive/20 bg-destructive/5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-destructive">
                  Última Revisión
                </h3>
                <Badge variant="outline" className="bg-destructive/10 text-destructive">
                  Rechazado
                </Badge>
              </div>
              <Card className="bg-card/50 border-none">
                <div className="p-4">
                  <p className="text-sm whitespace-pre-wrap">
                    {video.lastReviewComments}
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}