import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, PlayCircle, Loader2, Volume2, Mic, Languages, FileVideo } from "lucide-react";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";

type TranslationStep = 
  | "uploading"
  | "extracting_audio"
  | "separating_voice"
  | "cloning_voice"
  | "transcribing"
  | "translating"
  | "merging";

interface TranslationProgress {
  step: TranslationStep;
  progress: number;
}

const stepMessages: Record<TranslationStep, string> = {
  uploading: "Subiendo video...",
  extracting_audio: "Extrayendo audio...",
  separating_voice: "Separando voz y música...",
  cloning_voice: "Clonando voz...",
  transcribing: "Transcribiendo audio...",
  translating: "Traduciendo texto...",
  merging: "Uniendo archivos finales..."
};

const StepIcon = ({ step }: { step: TranslationStep }) => {
  switch (step) {
    case "uploading":
      return <Upload className="h-4 w-4" />;
    case "extracting_audio":
      return <Volume2 className="h-4 w-4" />;
    case "separating_voice":
      return <Volume2 className="h-4 w-4" />;
    case "cloning_voice":
      return <Mic className="h-4 w-4" />;
    case "transcribing":
      return <Languages className="h-4 w-4" />;
    case "translating":
      return <Languages className="h-4 w-4" />;
    case "merging":
      return <FileVideo className="h-4 w-4" />;
    default:
      return <Loader2 className="h-4 w-4 animate-spin" />;
  }
};

export default function VideoTranslator() {
  const [isUploading, setIsUploading] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<File | null>(null);
  const [translationProgress, setTranslationProgress] = useState<TranslationProgress | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCurrentVideo(file);
    }
  };

  const handleUpload = async () => {
    if (!currentVideo) return;

    try {
      setIsUploading(true);
      setTranslationProgress({ step: "uploading", progress: 0 });

      // Simular progreso de subida
      const formData = new FormData();
      formData.append("video", currentVideo);

      // Aquí irá la lógica real de subida y procesamiento
      await simulateTranslationProcess();

    } catch (error) {
      console.error("Error during translation:", error);
    } finally {
      setIsUploading(false);
    }
  };

  // Función temporal para simular el proceso
  const simulateTranslationProcess = async () => {
    const steps: TranslationStep[] = [
      "uploading",
      "extracting_audio",
      "separating_voice",
      "cloning_voice",
      "transcribing",
      "translating",
      "merging"
    ];

    for (const step of steps) {
      setTranslationProgress({ step, progress: 0 });

      // Simular progreso
      for (let progress = 0; progress <= 100; progress += 10) {
        setTranslationProgress({ step, progress });
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setTranslationProgress(null);
  };

  return (
    <div className="container mx-auto max-w-[1200px] px-4 py-8">
      <div className="flex flex-col gap-2 mb-12">
        <h1 className="text-4xl font-bold">Traductor de Videos</h1>
        <p className="text-muted-foreground text-lg">
          Traduce tus videos a diferentes idiomas manteniendo la voz original
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Subir Video</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div className="w-full max-w-xl">
                <label
                  htmlFor="video-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-accent/50"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click para subir</span> o arrastra y suelta
                    </p>
                  </div>
                  <input
                    id="video-upload"
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                  />
                </label>
              </div>

              {currentVideo && (
                <div className="w-full max-w-xl">
                  <p className="text-sm text-muted-foreground mb-2">
                    Video seleccionado: {currentVideo.name}
                  </p>
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="w-full"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Iniciar Traducción
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {translationProgress && (
          <Card>
            <CardHeader>
              <CardTitle>Progreso de Traducción</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <StepIcon step={translationProgress.step} />
                  <div className="flex-1">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">
                        {stepMessages[translationProgress.step]}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {translationProgress.progress}%
                      </span>
                    </div>
                    <Progress value={translationProgress.progress} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}