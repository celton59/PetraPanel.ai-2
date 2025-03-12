import { useState } from "react";
import { toast } from "sonner";
// Importamos axios para usar la instancia con protección CSRF
import api, { refreshCSRFToken } from "../lib/axios";

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

      // Refrescar proactivamente el token CSRF antes de una operación importante
      await refreshCSRFToken();
      
      // Usar nuestra instancia de axios configurada con protección CSRF
      const uploadResponse = await api.post("/api/translator/upload", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const { videoId, status } = uploadResponse.data;
      setProgress({ step: status, videoId });

      toast("Video subido", {
        description: "El video se ha subido correctamente. Puedes continuar con el siguiente paso.",
      });

    } catch (error: any) {
      console.error("Error:", error);
      // Manejo mejorado de errores de CSRF
      if (error.response?.status === 403 && 
          (error.response?.data?.message?.includes('CSRF') || 
           error.response?.data?.message?.includes('token') || 
           error.response?.data?.message?.includes('Token'))) {
        toast.error("Error de seguridad", {
          description: "Hubo un problema con la validación de seguridad. Inténtalo de nuevo.",
        });
      } else if (error.response?.status === 401) {
        toast.error("Error de autenticación", {
          description: "Por favor, inicia sesión para usar el traductor",
        });
      } else {
        toast.error("Error", {
          description: error.response?.data?.message || error.message || "Error desconocido"
        });
      }
      setProgress({ step: "error", error: error.response?.data?.message || error.message || "Error desconocido" });
    } finally {
      setIsProcessing(false);
    }
  };

  const extractAudio = async () => {
    if (!progress?.videoId) return;

    try {
      setIsProcessing(true);
      setProgress(prev => ({ ...prev!, step: "extracting_audio" }));

      // Refrescar proactivamente el token CSRF antes de una operación importante
      await refreshCSRFToken();
      
      // Usar nuestra instancia de axios configurada con protección CSRF
      const response = await api.post(`/api/translator/${progress.videoId}/extract-audio`);

      const result = response.data;
      setProgress(prev => ({ ...prev!, ...result, step: "audio_extracted" }));

      toast("Audio extraído", {
        description: "El audio se ha extraído correctamente. Puedes continuar con el siguiente paso.",
      });

    } catch (error: any) {
      console.error("Error:", error);
      // Manejo mejorado de errores de CSRF
      if (error.response?.status === 403 && 
          (error.response?.data?.message?.includes('CSRF') || 
           error.response?.data?.message?.includes('token') || 
           error.response?.data?.message?.includes('Token'))) {
        toast.error("Error de seguridad", {
          description: "Hubo un problema con la validación de seguridad. Inténtalo de nuevo.",
        });
      } else {
        toast.error("Error", {
          description: error.response?.data?.message || error.message || "Error al extraer el audio"
        });
      }
      setProgress({step: "error", error: error.response?.data?.message || error.message || "Error al extraer el audio"})
    } finally {
      setIsProcessing(false);
    }
  };

  const separateVoice = async () => {
    if (!progress?.videoId) return;

    try {
      setIsProcessing(true);
      setProgress(prev => ({ ...prev!, step: "separating_voice" }));

      // Refrescar proactivamente el token CSRF antes de una operación importante
      await refreshCSRFToken();
      
      // Usar nuestra instancia de axios configurada con protección CSRF
      const response = await api.post(`/api/translator/${progress.videoId}/separate-voice`);

      const result = response.data;
      setProgress(prev => ({ ...prev!, ...result, step: "voice_separated" }));

      toast("Voz separada", {
        description: "La voz se ha separado correctamente. Puedes continuar con el siguiente paso.",
      });

    } catch (error: any) {
      console.error("Error:", error);
      // Manejo mejorado de errores de CSRF
      if (error.response?.status === 403 && 
          (error.response?.data?.message?.includes('CSRF') || 
           error.response?.data?.message?.includes('token') || 
           error.response?.data?.message?.includes('Token'))) {
        toast.error("Error de seguridad", {
          description: "Hubo un problema con la validación de seguridad. Inténtalo de nuevo.",
        });
      } else {
        toast.error("Error", {
          description: error.response?.data?.message || error.message || "Error al separar la voz",
        });
      }
      setProgress({step: "error", error: error.response?.data?.message || error.message || "Error al separar la voz"})
    } finally {
      setIsProcessing(false);
    }
  };

  const transcribe = async () => {
    if (!progress?.videoId) return;

    try {
      setIsProcessing(true);
      setProgress(prev => ({ ...prev!, step: "transcribing" }));

      // Refrescar proactivamente el token CSRF antes de una operación importante
      await refreshCSRFToken();
      
      // Usar nuestra instancia de axios configurada con protección CSRF
      const response = await api.post(`/api/translator/${progress.videoId}/transcribe`);

      const result = response.data;
      setProgress(prev => ({ ...prev!, ...result, step: "transcribed" }));

      toast("Transcripción completada", {
        description: "El audio se ha transcrito correctamente.",
      });

    } catch (error: any) {
      console.error("Error:", error);
      // Manejo mejorado de errores de CSRF
      if (error.response?.status === 403 && 
          (error.response?.data?.message?.includes('CSRF') || 
           error.response?.data?.message?.includes('token') || 
           error.response?.data?.message?.includes('Token'))) {
        toast.error("Error de seguridad", {
          description: "Hubo un problema con la validación de seguridad. Inténtalo de nuevo.",
        });
      } else {
        toast.error("Error", {
          description: error.response?.data?.message || error.message || "Error al transcribir",
        });
      }
      setProgress({step: "error", error: error.response?.data?.message || error.message || "Error al transcribir"})
    } finally {
      setIsProcessing(false);
    }
  };

  const cloneVoice = async () => {
    if (!progress?.videoId) return;

    try {
      setIsProcessing(true);
      setProgress(prev => ({ ...prev!, step: "cloning_voice" }));

      // Refrescar proactivamente el token CSRF antes de una operación importante
      await refreshCSRFToken();
      
      // Usar nuestra instancia de axios configurada con protección CSRF
      const response = await api.post(`/api/translator/${progress.videoId}/clone-voice`);

      const result = response.data;
      setProgress(prev => ({ ...prev!, ...result, step: "voice_cloned" }));

      toast("Voz clonada", {
        description: "La voz se ha clonado correctamente. Puedes continuar con el siguiente paso.",
      });

    } catch (error: any) {
      console.error("Error:", error);
      // Manejo mejorado de errores de CSRF
      if (error.response?.status === 403 && 
          (error.response?.data?.message?.includes('CSRF') || 
           error.response?.data?.message?.includes('token') || 
           error.response?.data?.message?.includes('Token'))) {
        toast.error("Error de seguridad", {
          description: "Hubo un problema con la validación de seguridad. Inténtalo de nuevo.",
        });
      } else {
        toast.error("Error", {
          description: error.response?.data?.message || error.message || "Error al clonar la voz",
        });
      }
      setProgress({step: "error", error: error.response?.data?.message || error.message || "Error al clonar la voz"})
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
      options?: any; // Cambiamos a any para compatibilidad con axios
    }
  ): Promise<T | null> => {
    try {
      setIsProcessing(true);
      setProgress(prev => ({ ...prev!, step: preStep }));

      // Refrescar proactivamente el token CSRF antes de una operación importante
      await refreshCSRFToken();
      
      // Usar nuestra instancia de axios configurada con protección CSRF
      const response = await api.post(endpoint, options.body, {
        headers: options.headers
      });

      const result = response.data as T;
      setProgress(prev => ({ ...prev!, ...result, step: successStep }));

      toast(successToast.title, {
        description: successToast.description,
      });

      return result;

    } catch (error: any) {
      console.error("Error:", error);
      // Manejo mejorado de errores de CSRF
      if (error.response?.status === 403 && 
          (error.response?.data?.message?.includes('CSRF') || 
           error.response?.data?.message?.includes('token') || 
           error.response?.data?.message?.includes('Token'))) {
        toast.error("Error de seguridad", {
          description: "Hubo un problema con la validación de seguridad. Inténtalo de nuevo.",
        });
      } else {
        toast.error("Error", {
          description: error.response?.data?.message || error.message || errorMessage,
        });
      }
      setProgress({ step: "error", error: error.response?.data?.message || error.message || errorMessage });
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