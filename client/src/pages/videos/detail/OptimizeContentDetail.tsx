import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Video } from "@db/schema";
import { useForm } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useVideos } from "@/hooks/useVideos";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Sparkles,
  FileText,
  ArrowRight,
  Smile,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EmojiPicker } from "@/components/emoji/EmojiPicker";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { useUser } from "@/hooks/use-user";
import { OptimizeContentDetailData } from '@/hooks/useVideos'

interface OptimizeContentDetailProps {
  video: Video;
}


const MAX_TITLE_LENGTH = 100;

export function OptimizeContentDetail({
  video,
}: OptimizeContentDetailProps) {

  const { sendVideoToContentReview: sendVideoToReview, assignOptimizer } = useVideos()
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Establecer el optimizador automáticamente al cargar
  useEffect(() => {

    if (Boolean(video.optimizedBy))
      return
    
    assignOptimizer({
      optimizedBy: user!.id!,
      videoId: video.id,
      projectId: video.projectId,
    }).catch( error => {
      console.error("Error al actualizar el optimizador:", error);
    })
    
  }, [video.id]);

  const form = useForm<OptimizeContentDetailData>({
    defaultValues: {
      optimizedDescription:
        video.optimizedDescription || video.description || "",
      tags: video.tags || "",
      optimizedTitle: video.optimizedTitle || video.title || "",
    },
  });
  
  function handleEmojiSelect(emoji: string) {
    const currentOptimizedTitle = form.getValues("optimizedTitle");

    if (
      currentOptimizedTitle &&
      currentOptimizedTitle.length + emoji.length <= MAX_TITLE_LENGTH
    ) {
      form.setValue("optimizedTitle", currentOptimizedTitle + emoji);
    }
  }

  async function handleSubmit(formData: OptimizeContentDetailData) {
    setIsSubmitting(true);
    try {
      await sendVideoToReview({
        projectId: video.projectId,
        videoId: video.id,
        optimizedBy: user!.id!,
        optimizedDescription: formData.optimizedDescription,
        optimizedTitle: formData.optimizedTitle,
        tags: formData.tags
      });
    } catch (error) {
      console.error("Error al actualizar el video:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollArea className="h-auto max-h-[75vh] overflow-y-auto">
      <Card className="border-0 shadow-none p-5">
        <CardHeader className="px-0 sm:px-6">
          <CardTitle>Optimización de Contenido</CardTitle>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="space-y-8" translate="no">
              
              {video.contentReviewComments &&
                video.contentReviewComments.length > 0 && (
                  <>
                    <div className="rounded-lg border border-red-200 dark:border-red-900/50 p-4 shadow-sm bg-gradient-to-r from-red-50/80 via-red-50/50 to-transparent dark:from-red-950/30 dark:via-red-950/20 dark:to-transparent backdrop-blur-sm">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 p-1.5 bg-red-100 dark:bg-red-900/40 rounded-md mr-3">
                          <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
                            Se han solicitado las siguientes correcciones:
                          </h4>
                          <p className="text-red-700/90 dark:text-red-400/90 text-sm whitespace-pre-wrap border-l-2 border-red-300 dark:border-red-700 pl-3 py-1 my-1 bg-red-50/50 dark:bg-red-950/20 rounded-r-sm">
                            {video.contentReviewComments.at(-1)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Accordion type="single" collapsible className="space-y-4">
                      <AccordionItem value="item-1" className="border border-red-100 dark:border-red-900/30 rounded-md overflow-hidden shadow-sm">
                        <AccordionTrigger className="px-4 py-3 text-red-700 dark:text-red-300 hover:bg-red-50/50 dark:hover:bg-red-950/10">
                          <div className="flex items-center">
                            <div className="p-1 rounded-md bg-red-50 dark:bg-red-900/40 mr-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 dark:text-red-400">
                                <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"></path>
                              </svg>
                            </div>
                            Historial de correcciones
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-3 pb-3 pt-1 border-t border-red-100 dark:border-red-900/30 bg-red-50/30 dark:bg-red-950/5">
                          <div className="space-y-2 mt-2">
                            {video.contentReviewComments?.map((comment, index) => (
                              <div key={index} className="rounded-md border border-red-200 dark:border-red-900/40 bg-white/60 dark:bg-gray-900/20 p-3 shadow-sm">
                                <div className="flex items-start">
                                  <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                                  <p className="text-sm text-red-700 dark:text-red-300">{comment}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </>
                )
              }

              {/* Layout optimizado para títulos con sistema de dos columnas */}
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
                        {video.title}
                      </div>
                      
                      {video.seriesNumber && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-md border border-gray-100 dark:border-gray-800">
                          <ArrowRight className="w-3 h-3 flex-shrink-0" />
                          <span>Serie: {video.seriesNumber}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Columna derecha: Título Optimizado */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded-md bg-purple-50 dark:bg-purple-900/50">
                            <Wand2 className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                          </div>
                          <h3 className="font-medium text-purple-700 dark:text-purple-300 text-sm">Título Optimizado</h3>
                        </div>
                        <div className="text-xs px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 font-medium border border-purple-100 dark:border-purple-800/50">
                          {form.getValues("optimizedTitle")?.length}/{MAX_TITLE_LENGTH}
                        </div>
                      </div>
                      
                      <div className="relative">
                        <Textarea
                          {...form.register("optimizedTitle")}
                          placeholder="Escribe el título optimizado..."
                          rows={2}
                          className={cn(
                            "min-h-[60px] max-h-[100px] pr-9 resize-none",
                            "bg-white/80 dark:bg-gray-900/60",
                            "border-purple-200 dark:border-purple-800/70",
                            "focus-visible:ring-purple-500/30",
                            "focus-visible:border-purple-300",
                            "placeholder:text-purple-300/70 dark:placeholder:text-purple-400/40",
                            "text-sm backdrop-blur-sm",
                            "shadow-sm"
                          )}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 bottom-1 w-7 h-7 p-0 text-purple-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:text-purple-300 dark:hover:bg-purple-900/30"
                          onClick={() => setShowEmojiPicker(true)}
                        >
                          <Smile className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Consejo de optimización compacto */}
              <div className="flex items-center p-3 rounded-md border border-purple-100 dark:border-purple-900/50 shadow-sm bg-gradient-to-r from-purple-50/80 to-transparent dark:from-purple-950/30 dark:to-transparent backdrop-blur-sm mt-2 mb-2">
                <div className="flex-shrink-0 p-1 bg-purple-100 dark:bg-purple-900/40 rounded-full mr-2">
                  <Sparkles className="h-3 w-3 text-purple-500 dark:text-purple-400" />
                </div>
                <p className="text-xs text-purple-700/90 dark:text-purple-400/90">
                  <span className="font-medium text-purple-800 dark:text-purple-300">Consejo:</span> Optimiza manteniendo la esencia del contenido y mejorando SEO. Usa etiquetas relevantes para aumentar el alcance.
                </p>
              </div>
              
              {/* Alerta de corrección compacta */}
              {video.status === "content_corrections" && (
                <div className="flex items-center p-2.5 rounded-md border border-amber-200 dark:border-amber-900/50 shadow-sm bg-gradient-to-r from-amber-50/80 to-transparent dark:from-amber-950/30 dark:to-transparent backdrop-blur-sm mt-1 mb-3">
                  <div className="flex-shrink-0 p-1 bg-amber-100 dark:bg-amber-900/40 rounded-full mr-2">
                    <AlertCircle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    <span className="font-medium">Atención:</span> Revisa las correcciones solicitadas antes de volver a enviar.
                  </p>
                </div>
              )}

              <EmojiPicker
                isOpen={showEmojiPicker}
                onClose={() => setShowEmojiPicker(false)}
                onEmojiSelect={handleEmojiSelect}
                maxLength={MAX_TITLE_LENGTH}
                currentLength={form.getValues("optimizedTitle")?.length ?? 0}
              />
            </div>

            {/* Layout optimizado con grid de 2 columnas y campos más compactos */}
            <div className="mt-4">
              <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm relative">
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
                      <Textarea
                        value={video.description || ""}
                        disabled
                        className="min-h-[120px] resize-none text-xs bg-gray-50/80 dark:bg-gray-900/60 border-gray-200 dark:border-gray-800"
                      />
                    </div>
                    
                    {/* Columna derecha: Descripción Optimizada */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1 rounded-md bg-purple-50 dark:bg-purple-900/50">
                          <Wand2 className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                        </div>
                        <h3 className="font-medium text-purple-700 dark:text-purple-300 text-sm">Descripción Optimizada</h3>
                      </div>
                      <Textarea
                        {...form.register("optimizedDescription")}
                        placeholder="Ingresa la descripción optimizada"
                        rows={4}
                        className="min-h-[120px] max-h-[200px] resize-none text-xs bg-white/80 dark:bg-gray-900/60 border-purple-200 dark:border-purple-800/70 focus-visible:ring-purple-500/30 focus-visible:border-purple-300 placeholder:text-purple-300/70"
                      />
                    </div>
                  </div>
                  
                  {/* Tags en la parte inferior, ocupando todo el ancho */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1 rounded-md bg-blue-50 dark:bg-blue-900/50">
                        <div className="text-xs text-blue-500 dark:text-blue-400 font-semibold">#</div>
                      </div>
                      <h3 className="font-medium text-blue-700 dark:text-blue-300 text-sm">Tags (separados por comas)</h3>
                    </div>
                    <Textarea
                      {...form.register("tags")}
                      placeholder="tag1, tag2, tag3"
                      className="min-h-[40px] resize-none text-xs bg-white/80 dark:bg-gray-900/60 border-blue-200 dark:border-blue-800/70 focus-visible:ring-blue-500/30 focus-visible:border-blue-300"
                    />
                  </div>
                </div>
              </Card>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-6 bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 hover:from-blue-700 hover:via-purple-700 hover:to-purple-800 border-0 text-white shadow-md hover:shadow-lg transition-all duration-300"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <Wand2 className="mr-2 h-5 w-5" />
                  Enviar a Revisión
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </ScrollArea>
  );
}
