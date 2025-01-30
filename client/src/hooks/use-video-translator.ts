import { useState } from "react";
import { useToast } from "./use-toast";

export type TranslationStep = 
  | "uploading"
  | "extracting_audio"
  | "separating_voice"
  | "cloning_voice"
  | "transcribing"
  | "translating"
  | "merging";

export interface TranslationProgress {
  step: TranslationStep;
  progress: number;
}

export function useVideoTranslator() {
  const [isUploading, setIsUploading] = useState(false);
  const [translationProgress, setTranslationProgress] = useState<TranslationProgress | null>(null);
  const { toast } = useToast();

  const uploadVideo = async (file: File) => {
    try {
      setIsUploading(true);
      setTranslationProgress({ step: "uploading", progress: 0 });

      const formData = new FormData();
      formData.append("video", file);

      // Subir el video
      const uploadResponse = await fetch("/api/translator/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Error al subir el video");
      }

      const { videoId } = await uploadResponse.json();

      // Iniciar el proceso de traducción
      const eventSource = new EventSource(`/api/translator/${videoId}/translate`);

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setTranslationProgress({
          step: data.step,
          progress: data.progress
        });

        if (data.step === "completed") {
          eventSource.close();
          setTranslationProgress(null);
          toast({
            title: "Traducción completada",
            description: "El video ha sido traducido exitosamente",
          });
        }
      };

      eventSource.onerror = (error) => {
        console.error("Error en la traducción:", error);
        eventSource.close();
        setTranslationProgress(null);
        toast({
          title: "Error",
          description: "Ha ocurrido un error durante la traducción",
          variant: "destructive",
        });
      };

    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isUploading,
    translationProgress,
    uploadVideo,
  };
}
