import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, PlayCircle, Loader2 } from "lucide-react";
import { useVideoTranslator } from "@/hooks/use-video-translator";
import { useState } from "react";
import { TranslationSteps } from "@/components/video/TranslationSteps";

export default function VideoTranslator() {
  const { isProcessing, progress, uploadVideo, extractAudio, separateVoice, cloneVoice, transcribe } = useVideoTranslator();
  const [currentVideo, setCurrentVideo] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCurrentVideo(file);
    }
  };

  const handleUpload = async () => {
    if (!currentVideo) return;
    await uploadVideo(currentVideo);
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
                    disabled={isProcessing}
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
                    disabled={isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? (
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

        {/* Componente de pasos de traducción */}
        <TranslationSteps
          progress={progress}
          isProcessing={isProcessing}
          onExtractAudio={extractAudio}
          onSeparateVoice={separateVoice}
          onCloneVoice={cloneVoice}
          onTranscribe={transcribe}
        />
      </div>
    </div>
  );
}