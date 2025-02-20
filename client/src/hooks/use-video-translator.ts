import { useState } from "react";
import { toast } from "sonner";

export type TranslationStep = 
  | "uploading"
  | "uploaded"
  | "extracting_audio"
  | "audio_extracted"
  | "separating_voice"
  | "voice_separated"
  | "transcribing"
  | "transcribed"
  | "cloning_voice"
  | "voice_cloned"
  | "translating"
  | "translated"
  | "merging"
  | "merged"
  | "completed"
  | "error";

export interface TranslationProgress {
  step: TranslationStep;
  videoId?: string;
  audioPath?: string;
  vocals?: string;
  instrumental?: string;
  voiceId?: string;
  text?: string;
  error?: string;
}

export function useVideoTranslator() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<TranslationProgress | null>(null);

  const uploadVideo = async (file: File) => {
    try {
      setIsProcessing(true);
      setProgress({ step: "uploading" });

      const formData = new FormData();
      formData.append("video", file);

      const uploadResponse = await fetch("/api/translator/upload", {
        method: "POST",
        body: formData,
        credentials: 'include'
      });

      if (!uploadResponse.ok) {
        if (uploadResponse.status === 401) {
          throw new Error("Por favor, inicia sesión para usar el traductor");
        }
        throw new Error("Error al subir el video");
      }

      const { videoId, status } = await uploadResponse.json();
      setProgress({ step: status, videoId });

      toast("Video subido", {
        description: "El video se ha subido correctamente. Puedes continuar con el siguiente paso.",
      });

    } catch (error) {
      console.error("Error:", error);
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Error desconocido"
      });
      setProgress({ step: "error", error: error instanceof Error ? error.message : "Error desconocido" });
    } finally {
      setIsProcessing(false);
    }
  };

  const extractAudio = async () => {
    if (!progress?.videoId) return;

    try {
      setIsProcessing(true);
      setProgress(prev => ({ ...prev!, step: "extracting_audio" }));

      const checkResponse = await fetch(`/api/translator/${progress.videoId}/check-files`);
      const existingFiles = await checkResponse.json();

      if (existingFiles.hasAudio) {
        setProgress(prev => ({
          ...prev,
          step: 'audio_extracted',
          audioPath: existingFiles.audioPath
        }));
        return;
      }

      const response = await fetch(`/api/translator/${progress.videoId}/extract-audio`, {
        method: "POST",
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error("Error al extraer el audio");
      }

      const result = await response.json();
      setProgress(prev => ({ ...prev!, ...result, step: "audio_extracted" }));

      toast("Audio extraído", {
        description: "El audio se ha extraído correctamente. Puedes continuar con el siguiente paso.",
      });

    } catch (error) {
      console.error("Error:", error);
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Error al extraer el audio"
      });
      setProgress({step: "error", error: error instanceof Error ? error.message : "Error al extraer el audio"})
    } finally {
      setIsProcessing(false);
    }
  };

  const separateVoice = async () => {
    if (!progress?.videoId) return;

    try {
      setIsProcessing(true);
      setProgress(prev => ({ ...prev!, step: "separating_voice" }));

      const response = await fetch(`/api/translator/${progress.videoId}/separate-voice`, {
        method: "POST",
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error("Error al separar la voz");
      }

      const result = await response.json();
      setProgress(prev => ({ ...prev!, ...result, step: "voice_separated" }));

      toast("Voz separada", {
        description: "La voz se ha separado correctamente. Puedes continuar con el siguiente paso.",
      });

    } catch (error) {
      console.error("Error:", error);
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Error al separar la voz",
      });
      setProgress({step: "error", error: error instanceof Error ? error.message : "Error al separar la voz"})
    } finally {
      setIsProcessing(false);
    }
  };

  const transcribe = async () => {
    if (!progress?.videoId) return;

    try {
      setIsProcessing(true);
      setProgress(prev => ({ ...prev!, step: "transcribing" }));

      const response = await fetch(`/api/translator/${progress.videoId}/transcribe`, {
        method: "POST",
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error("Error al transcribir");
      }

      const result = await response.json();
      setProgress(prev => ({ ...prev!, ...result, step: "transcribed" }));

      toast("Transcripción completada", {
        description: "El audio se ha transcrito correctamente.",
      });

    } catch (error) {
      console.error("Error:", error);
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Error al transcribir",
      });
      setProgress({step: "error", error: error instanceof Error ? error.message : "Error al transcribir"})
    } finally {
      setIsProcessing(false);
    }
  };

  const cloneVoice = async () => {
    if (!progress?.videoId) return;

    try {
      setIsProcessing(true);
      setProgress(prev => ({ ...prev!, step: "cloning_voice" }));

      const response = await fetch(`/api/translator/${progress.videoId}/clone-voice`, {
        method: "POST",
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error("Error al clonar la voz");
      }

      const result = await response.json();
      setProgress(prev => ({ ...prev!, ...result, step: "voice_cloned" }));

      toast("Voz clonada", {
        description: "La voz se ha clonado correctamente. Puedes continuar con el siguiente paso.",
      });

    } catch (error) {
      console.error("Error:", error);
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Error al clonar la voz",
      });
      setProgress({step: "error", error: error instanceof Error ? error.message : "Error al clonar la voz"})
    } finally {
      setIsProcessing(false);
    }
  };

  const executeStep = async <T extends object>(
    {
      preStep,
      endpoint,
      successStep,
      successToast,
      errorMessage,
      options = {}
    }: {
      preStep: TranslationStep;
      endpoint: string;
      successStep: TranslationStep;
      successToast: { title: string; description: string };
      errorMessage: string;
      options?: RequestInit;
    }
  ): Promise<T | null> => {
    try {
      setIsProcessing(true);
      setProgress(prev => ({ ...prev!, step: preStep }));

      const response = await fetch(endpoint, {
        method: "POST",
        credentials: 'include',
        ...options
      });

      if (!response.ok) {
        throw new Error(errorMessage);
      }

      const result = await response.json() as T;
      setProgress(prev => ({ ...prev!, ...result, step: successStep }));

      toast(successToast.title, {
        description: successToast.description,
      });

      return result;

    } catch (error) {
      console.error("Error:", error);
      toast.error("Error", {
        description: error instanceof Error ? error.message : errorMessage,
      });
      setProgress({ step: "error", error: error instanceof Error ? error.message : errorMessage });
      return null;
    } finally {
      setIsProcessing(false);
    }
  };


  return {
    isProcessing,
    progress,
    uploadVideo,
    extractAudio,
    separateVoice,
    transcribe,
    cloneVoice,
    executeStep
  };
}