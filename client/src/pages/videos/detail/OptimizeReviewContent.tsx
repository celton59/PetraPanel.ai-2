import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  MessageSquare,
  CheckCircle2,
  XCircle,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/hooks/use-user";
import { UpdateVideoData, ApiVideo } from "@/hooks/useVideos";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AffiliatesBadgeContainer } from "@/components/video/AffiliateBadge";

interface ContentReviewDetailProps {
  video: ApiVideo;
  onUpdate: (data: UpdateVideoData) => Promise<void>;
}

export function ContentReviewDetail({
  video,
  onUpdate,
}: ContentReviewDetailProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [titleCorrections, setTitleCorrections] = useState<string | undefined>(
    undefined,
  );
  const { user } = useUser();

  function handleSubmit(approve: boolean) {
    if (!approve && !titleCorrections?.trim()) return;

    setIsSubmitting(true);

    try {
      onUpdate({
        status: approve ? "upload_media" : "content_corrections",
        contentReviewedBy: user?.id,
        contentReviewComments: titleCorrections
          ? [...(video.contentReviewComments ?? []), titleCorrections.trim()]
          : video.contentReviewComments ?? [],
      });
    } catch (error) {
      console.error("Error al enviar los cambios:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollArea className="h-auto max-h-[70vh]">
      <div className="mt-2 p-4">
        {/* Título optimizado con layout de 2 columnas */}
        <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 dark:from-blue-600 dark:via-purple-600 dark:to-blue-600"></div>
          <div className="p-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Columna izquierda: Título Original */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-gray-100 dark:bg-gray-800">
                      <FileText className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                    </div>
                    <h3 className="font-medium text-gray-800 dark:text-gray-200 text-sm">Título Original</h3>
                  </div>
                  <Badge variant="outline" className="bg-background/50 text-xs px-2 py-0.5 border border-gray-200 dark:border-gray-700">
                    Original
                  </Badge>
                </div>
                
                <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-white/30 dark:bg-gray-900/30 p-3 min-h-[60px] text-sm text-gray-700 dark:text-gray-300 shadow-sm">
                  <div className="flex flex-col gap-2">
                    <span>{video.title}</span>
                    <AffiliatesBadgeContainer videoId={video.id} title={video.title} />
                  </div>
                </div>
              </div>
              
              {/* Columna derecha: Título Optimizado */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-purple-50 dark:bg-purple-900/50">
                      <MessageSquare className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                    </div>
                    <h3 className="font-medium text-purple-700 dark:text-purple-300 text-sm">Título Optimizado</h3>
                  </div>
                  <Badge variant="outline" className="bg-purple-50/80 text-xs px-2 py-0.5 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
                    Propuesta
                  </Badge>
                </div>
                
                <div className="rounded-md border border-purple-200 dark:border-purple-800/50 bg-white/30 dark:bg-gray-900/30 p-3 min-h-[60px] text-sm text-purple-700 dark:text-purple-300 shadow-sm">
                  <div className="flex flex-col gap-2">
                    <span>{video.optimizedTitle}</span>
                    <AffiliatesBadgeContainer videoId={video.id} title={video.optimizedTitle || ''} />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                      Optimizado por: {video.optimizerUsername}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Descripción optimizada con layout de 2 columnas */}
        <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm relative mt-4">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-300 via-blue-400 to-purple-500 dark:from-gray-700 dark:via-blue-600 dark:to-purple-700"></div>
          <div className="p-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Columna izquierda: Descripción Original */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 rounded-md bg-gray-100 dark:bg-gray-800">
                    <FileText className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  </div>
                  <h3 className="font-medium text-gray-800 dark:text-gray-200 text-sm">Descripción Original</h3>
                </div>
                <div className="rounded-md border border-gray-200 dark:border-gray-800 bg-white/30 dark:bg-gray-900/30 p-3 min-h-[100px] text-sm text-gray-700 dark:text-gray-300 shadow-sm overflow-y-auto">
                  {video.description || "Sin descripción"}
                </div>
              </div>
                  
              {/* Columna derecha: Descripción Optimizada */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 rounded-md bg-purple-50 dark:bg-purple-900/50">
                    <MessageSquare className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                  </div>
                  <h3 className="font-medium text-purple-700 dark:text-purple-300 text-sm">Descripción Optimizada</h3>
                </div>
                <div className="rounded-md border border-purple-200 dark:border-purple-800/50 bg-white/30 dark:bg-gray-900/30 p-3 min-h-[100px] text-sm text-purple-700 dark:text-purple-300 shadow-sm overflow-y-auto">
                  {video.optimizedDescription || "Sin descripción optimizada"}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                    Optimizado por: {video.optimizerUsername}
                  </p>
                </div>
              </div>
            </div>
                  
            {/* Tags en la parte inferior si están disponibles */}
            {video.tags && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 rounded-md bg-blue-50 dark:bg-blue-900/50">
                    <div className="text-xs text-blue-500 dark:text-blue-400 font-semibold">#</div>
                  </div>
                  <h3 className="font-medium text-blue-700 dark:text-blue-300 text-sm">Tags propuestos</h3>
                </div>
                <div className="rounded-md border border-blue-200 dark:border-blue-800 bg-white/30 dark:bg-gray-900/30 p-3 text-sm text-blue-700 dark:text-blue-300">
                  {video.tags}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Panel de decisión optimizado */}
        <Card className="mt-4 overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-amber-50 dark:bg-amber-900/50">
                  <CheckCircle2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="font-medium text-amber-700 dark:text-amber-300 text-sm">Decisión de Revisión</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleSubmit(true)}
                  disabled={isSubmitting}
                  className="py-1 h-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-0 text-white"
                  size="sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Aprobar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleSubmit(false)}
                  disabled={isSubmitting || !titleCorrections?.trim()}
                  className="py-1 h-8"
                  size="sm"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  Rechazar
                </Button>
              </div>
            </div>

            <Separator className="my-3" />

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Comentarios de Revisión
              </label>
              <Textarea
                placeholder="Escribe aquí los motivos del rechazo o sugerencias de mejora..."
                value={titleCorrections}
                onChange={(e) => setTitleCorrections(e.target.value)}
                className="min-h-[80px] resize-none text-xs bg-white/80 dark:bg-gray-900/60 border-amber-200 dark:border-amber-800/70 focus-visible:ring-amber-500/30 focus-visible:border-amber-300"
              />
            </div>
          </div>
        </Card>

        {/* Última revisión compacta */}
        {video.contentReviewComments?.at(-1) && (
          <div className="flex items-center p-3 rounded-md border border-red-200 dark:border-red-900/50 shadow-sm bg-gradient-to-r from-red-50/80 to-transparent dark:from-red-950/30 dark:to-transparent backdrop-blur-sm mt-4">
            <div className="flex-shrink-0 p-1 bg-red-100 dark:bg-red-900/40 rounded-full mr-2">
              <AlertTriangle className="h-3 w-3 text-red-500 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xs font-medium text-red-700 dark:text-red-300">Última Revisión</h3>
                <Badge variant="outline" className="bg-red-50/80 text-xs h-5 px-1.5 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800/50">
                  Rechazado
                </Badge>
              </div>
              <p className="text-xs text-red-700/90 dark:text-red-400/90 whitespace-pre-wrap">
                {video.contentReviewComments?.at(-1)}
              </p>
            </div>
          </div>
        )}

        {/* Historial de correcciones mejorado */}
        {video.contentReviewComments && video.contentReviewComments.length > 0 && (
          <Accordion type="single" collapsible className="mt-4">
            <AccordionItem value="item-1" className="overflow-hidden rounded-md border border-gray-200 dark:border-gray-800 shadow-sm">
              <AccordionTrigger className="px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-900/40 dark:to-transparent">
                <div className="flex items-center">
                  <div className="p-1 rounded-full bg-red-50 dark:bg-red-900/30 mr-2">
                    <AlertCircle className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">
                    Historial de correcciones
                    <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40 text-xs font-medium text-red-600 dark:text-red-300">
                      {video.contentReviewComments.length}
                    </span>
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 py-3 space-y-3 bg-gradient-to-b from-gray-50/70 to-white dark:from-gray-900/30 dark:to-gray-900/10">
                {video.contentReviewComments?.map((comment, index) => {
                  // Determinar si es la última entrada (la más reciente)
                  const isLatest = index === video.contentReviewComments!.length - 1;
                  
                  return (
                    <div 
                      key={index} 
                      className={`
                        relative flex flex-col p-3 rounded-md shadow-sm
                        ${isLatest 
                          ? "border border-red-300 dark:border-red-800 bg-gradient-to-r from-red-50/90 to-white dark:from-red-950/30 dark:to-gray-900/20" 
                          : "border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/40"
                        }
                      `}
                    >
                      {/* Indicador de entrada más reciente */}
                      {isLatest && (
                        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-400 via-red-500 to-red-400 dark:from-red-700 dark:via-red-600 dark:to-red-700 rounded-t-md"></div>
                      )}
                      
                      <div className="flex items-center mb-1.5">
                        <AlertCircle className={`
                          h-3.5 w-3.5 mr-2 flex-shrink-0
                          ${isLatest ? "text-red-500 dark:text-red-400" : "text-gray-400 dark:text-gray-500"}
                        `} />
                        <span className={`
                          text-xs font-medium
                          ${isLatest ? "text-red-700 dark:text-red-300" : "text-gray-600 dark:text-gray-400"}
                        `}>
                          {isLatest ? "Corrección más reciente" : `Corrección anterior ${video.contentReviewComments!.length - index}`}
                        </span>
                        {isLatest && (
                          <Badge variant="outline" className="ml-2 bg-red-50/80 text-[0.65rem] h-4 px-1 py-0 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800/50">
                            Último
                          </Badge>
                        )}
                      </div>
                      
                      <p className={`
                        text-xs whitespace-pre-wrap pl-5 border-l-2 
                        ${isLatest ? "border-red-300 dark:border-red-700 text-red-700 dark:text-red-300" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"}
                      `}>
                        {comment}
                      </p>
                    </div>
                  );
                })}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </div>
    </ScrollArea>
  );
}
