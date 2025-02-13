import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Video } from "@db/schema";
import { useForm } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UpdateVideoData } from "@/hooks/useVideos";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Sparkles, FileText, ArrowRight, Smile, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmojiPicker } from "@/components/emoji/EmojiPicker";

interface VideoOptimizerProps {
  video: Video;
  onUpdate: (videoId: number, data: UpdateVideoData) => Promise<void>;
}

type FormValues = {
  optimizedDescription: string;
  tags: string;
  optimizedTitle: string
};

const MAX_TITLE_LENGTH = 100;

export function VideoOptimizer({ video, onUpdate }: VideoOptimizerProps) {
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    defaultValues: {
      optimizedDescription: video.optimizedDescription || video.description || "",
      tags: video.tags || "",
      optimizedTitle: video.optimizedTitle || video.title || "",
    }
  });

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  function handleEmojiSelect(emoji: string) {
    const currentOptimizedTitle = form.getValues("optimizedTitle");
    
    if (currentOptimizedTitle.length + emoji.length <= MAX_TITLE_LENGTH) {
      // setOptimizedTitle(optimizedTitle + emoji);
      form.setValue('optimizedTitle', currentOptimizedTitle + emoji)
    }
  };

  

  async function handleSubmit (formData: FormValues) {

    setIsSubmitting(true);
    try {
      await onUpdate(video.id, {
        optimizedDescription: formData.optimizedDescription,
        tags: formData.tags,
        optimizedTitle: formData.optimizedTitle,
        status: "optimize_review",
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

              <div className="space-y-8" translate="no">
                {video.lastReviewComments && video.status === "title_corrections" && (
                  <Alert className="border-2 border-red-200 bg-red-50/50 dark:bg-red-950/10 dark:border-red-900/50">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <AlertDescription className="text-red-700 dark:text-red-300">
                      <p className="font-medium mb-1">Se han solicitado las siguientes correcciones:</p>
                      <p className="text-sm whitespace-pre-wrap">{video.lastReviewComments}</p>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-8">
                  <Card className="overflow-hidden border-2">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <h3 className="font-semibold">Título Original</h3>
                        </div>
                        <Badge variant="outline" className="bg-background/50">Original</Badge>
                      </div>
                      <div className="space-y-4">
                        <ScrollArea className="h-[80px] rounded-md border bg-muted/5">
                          <div className="p-4">
                            <p className="text-lg leading-relaxed">{video.title}</p>
                          </div>
                        </ScrollArea>
                        {video.seriesNumber && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/5 p-3 rounded-lg">
                            <ArrowRight className="w-4 h-4" />
                            <span>Serie: {video.seriesNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>

                  <Card className="overflow-hidden border-2 border-purple-200 dark:border-purple-800/50">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Wand2 className="h-5 w-5 text-purple-500" />
                          <h3 className="font-semibold text-purple-700 dark:text-purple-300">
                            Título Optimizado
                          </h3>
                        </div>
                        <div className="text-sm text-purple-500 dark:text-purple-400 font-medium">
                          {form.getValues('optimizedTitle').length}/{MAX_TITLE_LENGTH}
                        </div>
                      </div>

                      <div className="relative">
                        <Textarea                          
                            {...form.register("optimizedTitle")} 
                          placeholder="Escribe el título optimizado..."
                          className={cn(
                            "min-h-[80px] pr-12 resize-none",
                            "bg-white/50 dark:bg-gray-900/50",
                            "border-purple-200 dark:border-purple-800/50",
                            "focus-visible:ring-purple-500/20",
                            "placeholder:text-purple-400/50",
                            "text-lg"
                          )}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 bottom-2 text-purple-400 hover:text-purple-600 dark:hover:text-purple-300"
                          onClick={() => setShowEmojiPicker(true)}
                        >
                          <Smile className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>

                <Alert className="bg-gradient-to-r from-purple-50/50 to-transparent dark:from-purple-950/20">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <AlertDescription className="text-purple-700 dark:text-purple-300 text-sm">
                    Optimiza el título manteniendo la esencia del contenido y mejorando su visibilidad.
                    {video.status === "title_corrections" && (
                      <p className="mt-1 text-purple-500 dark:text-purple-400 font-medium">
                        Por favor, revisa las correcciones solicitadas antes de volver a enviar.
                      </p>
                    )}
                  </AlertDescription>
                </Alert>

                <EmojiPicker
                  isOpen={showEmojiPicker}
                  onClose={() => setShowEmojiPicker(false)}
                  onEmojiSelect={handleEmojiSelect}
                  maxLength={MAX_TITLE_LENGTH}
                  currentLength={form.getValues('optimizedTitle').length}
                />
              </div>
              

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
                disabled={isSubmitting} 
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