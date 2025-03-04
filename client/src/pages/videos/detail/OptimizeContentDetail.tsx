import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Video } from "@db/schema";
import { useForm } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UpdateVideoData } from "@/hooks/useVideos";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

interface OptimizeContentDetailProps {
  video: Video;
  onUpdate: (data: UpdateVideoData, keepDialog?: boolean) => Promise<void>;
}

type FormValues = Partial<UpdateVideoData>;

const MAX_TITLE_LENGTH = 100;

export function OptimizeContentDetail({
  video,
  onUpdate,
}: OptimizeContentDetailProps) {
  
  const { user } = useUser();
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    onUpdate({ optimizedBy: user!.id! }, true);
  }, [])

  const form = useForm<FormValues>({
    defaultValues: {
      optimizedDescription:
        video.optimizedDescription || video.description || "",
      tags: video.tags || "",
      optimizedTitle: video.optimizedTitle || video.title || "",
    },
  });

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  function handleEmojiSelect(emoji: string) {
    const currentOptimizedTitle = form.getValues("optimizedTitle");

    if (
      currentOptimizedTitle &&
      currentOptimizedTitle.length + emoji.length <= MAX_TITLE_LENGTH
    ) {
      form.setValue("optimizedTitle", currentOptimizedTitle + emoji);
    }
  }

  async function handleSubmit(formData: FormValues) {
    setIsSubmitting(true);
    try {
      await onUpdate({
        optimizedDescription: formData.optimizedDescription,
        tags: formData.tags,
        optimizedTitle: formData.optimizedTitle,
        status: "content_review",
        optimizedBy: user!.id!
      });
    } catch (error) {
      console.error("Error al actualizar el video:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollArea className="h-auto max-h-[70vh]">
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

              <div className="grid gap-8">
                <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm relative">
                  {/* Gradiente sutil en la parte superior */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700"></div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-800">
                          <FileText className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                        </div>
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Título Original</h3>
                      </div>
                      <Badge variant="outline" className="bg-background/50 border border-gray-200 dark:border-gray-700">
                        Original
                      </Badge>
                    </div>
                    <div className="space-y-4">
                      <ScrollArea className="h-[80px] rounded-md border border-gray-200 dark:border-gray-800 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm">
                        <div className="p-4">
                          <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                            {video.title}
                          </p>
                        </div>
                      </ScrollArea>
                      {video.seriesNumber && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                          <ArrowRight className="w-4 h-4" />
                          <span>Serie: {video.seriesNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                <Card className="overflow-hidden border border-purple-200 dark:border-purple-800 shadow-sm relative">
                  {/* Gradiente en la parte superior */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 via-purple-500 to-purple-400 dark:from-purple-600 dark:via-purple-500 dark:to-purple-600"></div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-purple-50 dark:bg-purple-900/50">
                          <Wand2 className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                        </div>
                        <h3 className="font-semibold text-purple-700 dark:text-purple-300">
                          Título Optimizado
                        </h3>
                      </div>
                      <div className="text-sm px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 font-medium border border-purple-100 dark:border-purple-800/50">
                        {form.getValues("optimizedTitle")?.length}/{MAX_TITLE_LENGTH}
                      </div>
                    </div>

                    <div className="relative">
                      <Textarea
                        {...form.register("optimizedTitle")}
                        placeholder="Escribe el título optimizado..."
                        className={cn(
                          "min-h-[80px] pr-12 resize-none",
                          "bg-white/80 dark:bg-gray-900/60",
                          "border-purple-200 dark:border-purple-800/70",
                          "focus-visible:ring-purple-500/30",
                          "focus-visible:border-purple-300",
                          "placeholder:text-purple-300/70 dark:placeholder:text-purple-400/40",
                          "text-lg backdrop-blur-sm",
                          "shadow-sm"
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 bottom-2 text-purple-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:text-purple-300 dark:hover:bg-purple-900/30"
                        onClick={() => setShowEmojiPicker(true)}
                      >
                        <Smile className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="rounded-lg border border-purple-100 dark:border-purple-900/50 p-4 shadow-sm bg-gradient-to-r from-purple-50/80 via-purple-50/50 to-transparent dark:from-purple-950/30 dark:via-purple-950/20 dark:to-transparent backdrop-blur-sm">
                <div className="flex items-start">
                  <div className="flex-shrink-0 p-1.5 bg-purple-100 dark:bg-purple-900/40 rounded-md mr-3">
                    <Sparkles className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-1">
                      Consejos para Optimización
                    </h4>
                    <p className="text-purple-700/90 dark:text-purple-400/90 text-sm">
                      Optimiza el título manteniendo la esencia del contenido y mejorando su visibilidad para SEO.
                      Usa etiquetas relevantes para aumentar el alcance.
                    </p>
                    {video.status === "media_corrections" && (
                      <p className="mt-2 text-purple-600 dark:text-purple-300 text-sm font-medium border-l-2 border-purple-400 pl-2">
                        Por favor, revisa las correcciones solicitadas antes de volver a enviar.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <EmojiPicker
                isOpen={showEmojiPicker}
                onClose={() => setShowEmojiPicker(false)}
                onEmojiSelect={handleEmojiSelect}
                maxLength={MAX_TITLE_LENGTH}
                currentLength={form.getValues("optimizedTitle")?.length ?? 0}
              />
            </div>

            <div className="grid gap-6 mt-4">
              <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700"></div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-800">
                        <FileText className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                      </div>
                      <h3 className="font-medium text-gray-800 dark:text-gray-200">Descripción Original</h3>
                    </div>
                  </div>
                  <Textarea
                    value={video.description || ""}
                    disabled
                    className="min-h-[80px] sm:min-h-[100px] resize-none text-sm bg-gray-50/80 dark:bg-gray-900/60 border-gray-200 dark:border-gray-800"
                  />
                </div>
              </Card>

              <Card className="overflow-hidden border border-purple-200 dark:border-purple-800 shadow-sm relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 via-purple-500 to-purple-400 dark:from-purple-600 dark:via-purple-500 dark:to-purple-600"></div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-purple-50 dark:bg-purple-900/50">
                        <Wand2 className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                      </div>
                      <h3 className="font-medium text-purple-700 dark:text-purple-300">Descripción Optimizada</h3>
                    </div>
                  </div>
                  <Textarea
                    {...form.register("optimizedDescription")}
                    placeholder="Ingresa la descripción optimizada"
                    className="min-h-[80px] sm:min-h-[100px] resize-none text-sm bg-white/80 dark:bg-gray-900/60 border-purple-200 dark:border-purple-800/70 focus-visible:ring-purple-500/30 focus-visible:border-purple-300 placeholder:text-purple-300/70 dark:placeholder:text-purple-400/40"
                  />
                </div>
              </Card>

              <Card className="overflow-hidden border border-purple-200 dark:border-purple-800 shadow-sm relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-300 to-purple-500 dark:from-purple-700 dark:to-purple-500"></div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-purple-50 dark:bg-purple-900/50">
                        <div className="text-xs text-purple-500 dark:text-purple-400 font-semibold">#</div>
                      </div>
                      <h3 className="font-medium text-purple-700 dark:text-purple-300">Tags (separados por comas)</h3>
                    </div>
                  </div>
                  <Textarea
                    {...form.register("tags")}
                    placeholder="tag1, tag2, tag3"
                    className="min-h-[40px] sm:min-h-[50px] resize-none text-sm bg-white/80 dark:bg-gray-900/60 border-purple-200 dark:border-purple-800/70 focus-visible:ring-purple-500/30 focus-visible:border-purple-300 placeholder:text-purple-300/70 dark:placeholder:text-purple-400/40"
                  />
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
