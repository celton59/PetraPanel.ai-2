import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useLocation as useWouterLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { ProjectDropdown } from "../ProjectDropdown";
import { TitulinVideo } from "../types";

interface SendToOptimizeDialogProps {
  video: TitulinVideo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendToOptimizeDialog({ video, open, onOpenChange }: SendToOptimizeDialogProps) {
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [_location, navigate] = useWouterLocation();

  const sendToOptimizeMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(`/api/titulin/videos/${video.id}/send-to-optimize`, {
        projectId: selectedProject
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["youtube-videos"] });
      onOpenChange(false); // Cerrar el diálogo
      
      toast.success("Video enviado a optimización", {
        description: "El video ha sido enviado al proyecto seleccionado"
      });
      
      // Redirigir a la página de videos
      if (data.videoId) {
        // Breve retraso para dar tiempo a que se cierre el modal
        setTimeout(() => {
          navigate(`/videos?videoId=${data.videoId}`);
        }, 500);
      }
    },
    onError: (error) => {
      console.error("Error sending video to optimize:", error);
      toast.error("Error", {
        description: "No se pudo enviar el video a optimización",
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enviar video a optimización</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <h3 className="font-semibold">Título del video</h3>
            <p className="text-sm">{video.title}</p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold">Canal</h3>
            <p className="text-sm">{video.channelId}</p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold">Proyecto destino</h3>
            <ProjectDropdown
              value={selectedProject}
              onChange={setSelectedProject}
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => sendToOptimizeMutation.mutate()}
              disabled={!selectedProject || sendToOptimizeMutation.isPending}
            >
              {sendToOptimizeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Enviando...
                </>
              ) : "Enviar a optimización"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}