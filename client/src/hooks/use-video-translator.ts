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

      // Hacer la petición con credentials: 'include' para enviar las cookies de sesión
      const uploadResponse = await fetch("/api/translator/upload", {
        method: "POST",
        body: formData,
        credentials: 'include' // Añadir esta línea para incluir cookies
      });

      if (!uploadResponse.ok) {
        if (uploadResponse.status === 401) {
          throw new Error("Por favor, inicia sesión para usar el traductor");
        }
        throw new Error("Error al subir el video");
      }

      const { videoId } = await uploadResponse.json();

      // Configurar el EventSource con withCredentials
      const eventSource = new EventSource(`/api/translator/${videoId}/translate`, {
        withCredentials: true // Añadir esta línea para incluir cookies en SSE
      });

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