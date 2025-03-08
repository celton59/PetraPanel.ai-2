import { Video } from "@db/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UpdateVideoData } from "@/hooks/useVideos";
import { ArrowLeft, CheckCircle2, AlertCircle, Youtube } from "lucide-react";

interface FinalReviewContentProps {
  video: Video;
  onUpdate: (data: UpdateVideoData) => Promise<void>;
  openYoutubeDialog: () => void;
}

export function FinalReviewContent({
  video,
  onUpdate,
  openYoutubeDialog
}: FinalReviewContentProps) {
  // Solo se muestra si estamos en estado final_review
  if (video.status !== "final_review") return null;

  return (
    <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-red-600 to-red-500 dark:from-red-600 dark:via-red-700 dark:to-red-600"></div>
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-1.5 rounded-md bg-red-50 dark:bg-red-900/50">
            <Youtube className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="font-medium text-red-700 dark:text-red-300 text-base">Publicar en YouTube</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Este video está listo para ser publicado en YouTube</p>
          </div>
        </div>
        
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-800/50 mb-4">
          <div className="flex items-start gap-3">
            <div className="text-red-600 dark:text-red-400 mt-0.5">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-red-700 dark:text-red-300">Información importante</h4>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                Una vez publicado en YouTube, este video avanzará a estado "Completado" y ya no se podrá editar.
                Verifica toda la información antes de proceder.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          <Button
            size="lg"
            onClick={openYoutubeDialog}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 py-2 px-6"
          >
            <Youtube className="mr-2 h-5 w-5" />
            Publicar ahora en YouTube
          </Button>
          <Button
            variant="outline"
            className="py-2 px-4 border-green-200 text-green-600 hover:text-green-700 hover:border-green-300 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20"
            onClick={() => onUpdate({ status: 'completed' })}
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Completar sin YouTube
          </Button>
          <Button
            variant="outline"
            className="py-2 px-4 border-amber-200 text-amber-600 hover:text-amber-700 hover:border-amber-300 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/20"
            onClick={() => onUpdate({ status: 'media_review' })}
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Volver a revisión de medios
          </Button>
        </div>
      </div>
    </Card>
  );
}