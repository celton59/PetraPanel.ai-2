import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Video } from "@db/schema";
import { FileSelectionForCorrections } from "./FileSelectionForCorrections";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MediaCorrectionsDialogProps {
  video: Video;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestCorrections: (corrections: {
    comments: string;
    needsVideoCorrection: boolean;
    needsThumbnailCorrection: boolean;
  }) => Promise<void>;
}

export function MediaCorrectionsDialog({
  video,
  open,
  onOpenChange,
  onRequestCorrections,
}: MediaCorrectionsDialogProps) {
  const [comments, setComments] = useState("");
  const [selectedFiles, setSelectedFiles] = useState({
    video: video.metadata?.corrections?.files.video?.needsCorrection || false,
    thumbnail: video.metadata?.corrections?.files.thumbnail?.needsCorrection || false,
  });

  // Obtener el historial de correcciones del metadata del video
  const correctionHistory = video.metadata?.corrections?.history || [];

  const handleSubmit = async () => {
    if (!comments.trim() || (!selectedFiles.video && !selectedFiles.thumbnail)) {
      return;
    }

    await onRequestCorrections({
      comments: comments.trim(),
      needsVideoCorrection: selectedFiles.video,
      needsThumbnailCorrection: selectedFiles.thumbnail,
    });

    // Limpiar el estado
    setComments("");
    setSelectedFiles({ video: false, thumbnail: false });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Solicitar Correcciones de Archivos</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <FileSelectionForCorrections
            video={video}
            selectedFiles={selectedFiles}
            onSelectionChange={setSelectedFiles}
          />

          <div className="space-y-2">
            <Label>Comentarios de Revisión</Label>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Describe los cambios necesarios..."
              className="min-h-[100px]"
            />
          </div>

          {correctionHistory.length > 0 && (
            <div className="space-y-3">
              <Label>Historial de Correcciones</Label>
              <ScrollArea className="h-[200px] rounded-md border p-4">
                <div className="space-y-4">
                  {correctionHistory.map((correction: any, index: number) => (
                    <Alert 
                      key={index}
                      variant="destructive" 
                      className="bg-destructive/5 border-destructive/10"
                    >
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-destructive">
                        <p className="font-medium mb-1">
                          {new Date(correction.timestamp).toLocaleString()}:
                        </p>
                        <p className="text-sm">{correction.comment}</p>
                        <p className="text-xs mt-1">
                          {correction.files.videoRequested && "Video, "}
                          {correction.files.thumbnailRequested && "Miniatura"}
                        </p>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!comments.trim() || (!selectedFiles.video && !selectedFiles.thumbnail)}
            className="w-full"
          >
            Enviar Correcciones
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}