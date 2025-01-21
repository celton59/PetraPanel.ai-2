import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, MessageSquare, CheckCircle2, XCircle, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { Video } from "@db/schema";
import { useUser } from "@/hooks/use-user";

interface OptimizeReviewContentProps {
  video: Video;
  onUpdate: (videoId: number, data: any) => Promise<void>;
}

export function OptimizeReviewContent({ video, onUpdate }: OptimizeReviewContentProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [titleCorrections, setTitleCorrections] = useState("");
  const { user } = useUser();

  const handleApprove = async (status = 'title_approved') => {
    setIsSubmitting(true);
    try {
      await onUpdate(video.id, {
        status: "upload_review",
        metadata: {
          ...video.metadata,
          secondaryStatus: {
            type: 'title_approved',
            updatedAt: new Date().toISOString()
          },
          optimization: {
            ...video.metadata?.optimization,
            reviewedBy: {
              userId: user?.id,
              username: user?.username,
              reviewedAt: new Date().toISOString(),
              approved: true
            },
            approvalHistory: [
              ...(video.metadata?.optimization?.approvalHistory || []),
              {
                action: 'approved',
                by: {
                  userId: user?.id,
                  username: user?.username
                },
                timestamp: new Date().toISOString()
              }
            ]
          }
        }
      });
    } catch (error) {
      console.error("Error al aprobar:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!titleCorrections.trim()) return;

    setIsSubmitting(true);
    try {
      await onUpdate(video.id, {
        status: "title_corrections",
        lastReviewComments: titleCorrections.trim(),
        metadata: {
          ...video.metadata,
          secondaryStatus: {
            type: 'title_rejected',
            updatedAt: new Date().toISOString(),
            comment: titleCorrections.trim()
          },
          optimization: {
            ...video.metadata?.optimization,
            approvalHistory: [
              ...(video.metadata?.optimization?.approvalHistory || []),
              {
                action: 'rejected',
                by: {
                  userId: user?.id,
                  username: user?.username || ''
                },
                timestamp: new Date().toISOString(),
                comment: titleCorrections.trim()
              }
            ]
          }
        }
      });
    } catch (error) {
      console.error("Error al rechazar:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
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
                  {video.metadata?.optimization?.optimizedBy && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Optimizado por: {video.metadata.optimization.optimizedBy.username}
                    </p>
                  )}
                </div>
              </ScrollArea>
            </Card>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Decisión</h3>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Aprobar
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isSubmitting || !titleCorrections.trim()}
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
        <Card className="p-6 border-destructive/20 bg-destructive/5">
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