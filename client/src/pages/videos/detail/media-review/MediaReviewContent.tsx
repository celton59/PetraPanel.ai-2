import { Video } from "@db/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, XCircle } from "lucide-react";

interface MediaReviewContentProps {
  video: Video;
  videoNeedsCorrection: boolean;
  thumbnailNeedsCorrection: boolean;
  reviewComments: string;
  setVideoNeedsCorrection: (checked: boolean) => void;
  setThumbnailNeedsCorrection: (checked: boolean) => void;
  setReviewComments: (comments: string) => void;
  handleApprove: () => void;
  handleReject: () => void;
}

export function MediaReviewContent({
  video,
  videoNeedsCorrection,
  thumbnailNeedsCorrection,
  reviewComments,
  setVideoNeedsCorrection,
  setThumbnailNeedsCorrection,
  setReviewComments,
  handleApprove,
  handleReject
}: MediaReviewContentProps) {
  // Solo se muestra si estamos en estado media_review
  if (video.status !== "media_review") return null;

  return (
    <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm relative mb-4">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 dark:from-amber-600 dark:via-amber-500 dark:to-amber-600"></div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-amber-50 dark:bg-amber-900/50">
              <CheckCircle2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="font-medium text-amber-700 dark:text-amber-300 text-sm">Verificación de Contenido</h3>
          </div>
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              className="py-1 h-7 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-0 text-white"
              onClick={handleApprove}
              disabled={videoNeedsCorrection || thumbnailNeedsCorrection}
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Aprobar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="py-1 h-7"
              onClick={handleReject}
              disabled={!videoNeedsCorrection && !thumbnailNeedsCorrection}
            >
              <XCircle className="w-3.5 h-3.5 mr-1" />
              Rechazar
            </Button>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 rounded-md bg-white/80 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800">
              <Checkbox
                id="video-correction"
                onCheckedChange={(checked) => setVideoNeedsCorrection(checked as boolean)}
                className="border-amber-500 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
              />
              <label htmlFor="video-correction" className="text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                Necesita corregir Vídeo
              </label>
            </div>
            
            <div className="flex items-center gap-2 p-3 rounded-md bg-white/80 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800">
              <Checkbox
                id="thumbnail-correction"
                onCheckedChange={(checked) => setThumbnailNeedsCorrection(checked as boolean)}
                className="border-amber-500 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
              />
              <label htmlFor="thumbnail-correction" className="text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                Necesita corregir Miniatura
              </label>
            </div>
          </div>
          
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
              Comentarios de Revisión
            </label>
            <Textarea
              placeholder="Escribe aquí los motivos del rechazo o sugerencias de mejora..."
              value={reviewComments}
              disabled={!videoNeedsCorrection && !thumbnailNeedsCorrection}
              onChange={(e) => setReviewComments(e.target.value)}
              className="min-h-[80px] resize-none text-xs bg-white/80 dark:bg-gray-900/60 border-amber-200 dark:border-amber-800/70 focus-visible:ring-amber-500/30 focus-visible:border-amber-300"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}