import { useRoute } from "wouter";
import { useVideos } from "@/hooks/use-videos";
import { useUser } from "@/hooks/use-user";
import { VideoCard } from "@/components/VideoCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { UpdateVideoData } from "@/hooks/use-videos";
import type { Video } from "@db/schema";

interface CreateVideoData {
  title: string;
  description: string;
}

export default function ProjectPage() {
  const [, params] = useRoute("/project/:id");
  const projectId = parseInt(params?.id || "0");
  const { videos, isLoading, createVideo, updateVideo } = useVideos(projectId);
  const { user } = useUser();
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<CreateVideoData>({
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const onSubmit = async (data: CreateVideoData) => {
    try {
      await createVideo({ ...data, projectId });
      setDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error creating video:", error);
    }
  };

  const handleUpdateVideo = async (videoId: number, data: UpdateVideoData) => {
    try {
      await updateVideo({ videoId, data, currentRole: user?.role || 'viewer' });
    } catch (error) {
      console.error("Error updating video:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-[1200px] px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Videos del Proyecto</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Video
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Video</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Título</label>
                  <Input
                    placeholder="Título del video"
                    {...form.register("title", { required: true })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Descripción</label>
                  <Textarea
                    placeholder="Descripción del video"
                    {...form.register("description")}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Crear Video
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mx-auto max-w-4xl">
        <div className="grid gap-6">
          {videos?.map((video: Video) => (
            <VideoCard 
              key={video.id} 
              video={video} 
              userRole={user?.role || 'viewer'}
              onUpdate={handleUpdateVideo}
            />
          ))}
          {(!videos || videos.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              No hay videos en este proyecto. Crea uno nuevo para empezar.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}