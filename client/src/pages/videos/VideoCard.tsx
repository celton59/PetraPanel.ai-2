import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Video, VideoStatus, User } from "@db/schema";
import { Clock, Edit, PlayCircle, Upload, Youtube, AlertCircle, Image, CheckCircle2, List, Layout } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { UpdateVideoData } from "@/hooks/useVideos";
import { VideoOptimizer } from "./VideoOptimizer";
import { OptimizeReviewContent } from "./review/OptimizeReviewContent";
import { UploadReviewContent } from "./review/UploadReviewContent";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MediaCorrectionsDialog } from "./review/MediaCorrectionsDialog";
import { MediaCorrectionsContent } from "./review/MediaCorrectionsContent";
import { useUser } from '@/hooks/use-user'
import { getStatusLabelNew } from "@/lib/status-labels";


const statusColors: Record<VideoStatus, { bg: string; text: string }> = {
  pending: { bg: "bg-yellow-500/10", text: "text-yellow-500" },
  in_progress: { bg: "bg-blue-500/10", text: "text-blue-500" },
  title_corrections: { bg: "bg-red-500/10", text: "text-red-500" },
  optimize_review: { bg: "bg-pink-500/10", text: "text-pink-500" },
  upload_review: { bg: "bg-indigo-500/10", text: "text-indigo-500" },
  youtube_ready: { bg: "bg-green-500/10", text: "text-green-500" },
  review: { bg: "bg-purple-500/10", text: "text-purple-500" },
  media_corrections: { bg: "bg-red-500/10", text: "text-red-500" },
  completed: { bg: "bg-emerald-500/10", text: "text-emerald-500" }
};


const statusDescriptions: Record<VideoStatus, string> = {
  pending: "Video recién creado, esperando asignación",
  in_progress: "Video en proceso de optimización de título",
  title_corrections: "Se han solicitado correcciones al título",
  optimize_review: "En revisión por el equipo de optimización",
  upload_review: "En revisión de archivos (video y miniatura)",
  youtube_ready: "Listo para subir a YouTube",
  review: "En revisión final antes de publicación",
  media_corrections: "Se han solicitado correcciones al video o miniatura",
  completed: "Video publicado en YouTube"
};

function FinalReviewContent ({ video, userRole, onUpdate }: VideoCardProps) {
  const [isRequestingCorrections, setIsRequestingCorrections] = useState(false);

  return (
    <div className="space-y-6">
      {/* Previsualización de Miniatura */}
      {video.thumbnailUrl && (
        <div className="rounded-lg overflow-hidden border bg-card">
          <div className="aspect-video relative">
            {video.thumbnailUrl ? (
              <img
                src={video.thumbnailUrl}
                alt="Miniatura del video"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                <Layout className="h-4 w-4" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Información del Video */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <List className="h-4 w-4" />
            Contenido Final
          </div>
          <div className="rounded-lg border bg-card p-4 space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Título</h4>
              <p className="text-sm">{video.optimizedTitle || video.title}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1">Descripción</h4>
              <p className="text-sm whitespace-pre-wrap">{video.optimizedDescription || video.description}</p>
            </div>
            {video.tags && (
              <div>
                <h4 className="text-sm font-medium mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {video.tags.split(",").map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lista de Verificación Final */}
      <Alert className="bg-card">
        <CheckCircle2 className="h-4 w-4 text-purple-500" />
        <AlertDescription>
          <h4 className="font-medium mb-2">Revisión Final</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-purple-500" />
              Video optimizado y con formato correcto
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-purple-500" />
              Miniatura personalizada lista
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-purple-500" />
              Título y descripción optimizados
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-purple-500" />
              Tags revisados y optimizados
            </li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Botones de Acción */}
      <div className="flex flex-wrap gap-2">
        {video.videoUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={video.videoUrl} target="_blank" rel="noopener noreferrer">
              <PlayCircle className="mr-2 h-4 w-4" />
              Ver Video
            </a>
          </Button>
        )}

        {video.thumbnailUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={video.thumbnailUrl} target="_blank" rel="noopener noreferrer">
              <Image className="mr-2 h-4 w-4" />
              Ver Miniatura
            </a>
          </Button>
        )}

        {userRole === 'admin' && (
          <>
            <Button
              variant="default"
              size="sm"
              onClick={async () => {
                await onUpdate(video.id, { status: 'youtube_ready' });
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Aprobar Video
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRequestingCorrections(true)}
              className="text-destructive hover:text-destructive"
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              Solicitar Correcciones
            </Button>
          </>
        )}
      </div>

      <MediaCorrectionsDialog
        video={video}
        open={isRequestingCorrections}
        onOpenChange={setIsRequestingCorrections}
        onRequestCorrections={async ({ comments, needsVideoCorrection, needsThumbnailCorrection }) => {
          const currentHistory = video.metadata?.corrections?.history || [];

          const updateData = {
            status: "media_corrections" as const,
            lastReviewComments: comments,
            metadata: {
              corrections: {
                files: {
                  ...(needsVideoCorrection ? {
                    video: {
                      needsCorrection: true,
                      originalUrl: video.videoUrl
                    }
                  } : {}),
                  ...(needsThumbnailCorrection ? {
                    thumbnail: {
                      needsCorrection: true,
                      originalUrl: video.thumbnailUrl
                    }
                  } : {})
                },
                status: "pending",
                requestedAt: new Date().toISOString(),
                history: [
                  ...currentHistory,
                  {
                    files: {
                      videoRequested: needsVideoCorrection,
                      thumbnailRequested: needsThumbnailCorrection
                    },
                    comment: comments,
                    timestamp: new Date().toISOString(),
                    requestedBy: userRole
                  }
                ]
              }
            }
          };

          await onUpdate(video.id, updateData);
        }}
      />
    </div>
  );
};

function YoutubeReadyContent ({ video, userRole }: { video: Video; userRole: string }) {
  return (
    <div className="space-y-6">
      {/* Previsualización de Miniatura */}
      {video.thumbnailUrl && (
        <div className="rounded-lg overflow-hidden border bg-card">
          <div className="aspect-video relative">
            {video.thumbnailUrl ? (
              <img
                src={video.thumbnailUrl}
                alt="Miniatura del video"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                <Layout className="h-4 w-4" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Información Optimizada */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <List className="h-4 w-4" />
            Contenido Optimizado
          </div>
          <div className="rounded-lg border bg-card p-4 space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Título</h4>
              <p className="text-sm">{video.optimizedTitle || video.title}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1">Descripción</h4>
              <p className="text-sm whitespace-pre-wrap">{video.optimizedDescription || video.description}</p>
            </div>
            {video.tags && (
              <div>
                <h4 className="text-sm font-medium mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {video.tags.split(",").map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Verificación Pre-Upload */}
      <Alert className="bg-card">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <AlertDescription>
          <h4 className="font-medium mb-2">Listo para Subir a YouTube</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              Título y descripción optimizados
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              Video en formato correcto
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              Miniatura personalizada lista
            </li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Botones de Acción */}
      <div className="flex flex-wrap gap-2">
        {video.videoUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={video.videoUrl} target="_blank" rel="noopener noreferrer">
              <PlayCircle className="mr-2 h-4 w-4" />
              Ver Video
            </a>
          </Button>
        )}

        {video.thumbnailUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={video.thumbnailUrl} target="_blank" rel="noopener noreferrer">
              <Image className="mr-2 h-4 w-4" />
              Ver Miniatura
            </a>
          </Button>
        )}

        {userRole === 'admin' && (
          <>
            <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
              <Upload className="mr-2 h-4 w-4" />
              Subir a YouTube
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              Solicitar Correcciones
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export function VideoCard({ video, onUpdate }: VideoCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isRequestingCorrections, setIsRequestingCorrections] = useState(false);
  const { user } = useUser();

  // Determinar si el usuario tiene visibilidad usando getRoleStatus
  // const hasVisibility = getRoleStatus(video.status as VideoStatus)[userRole] === 'disponible';
  // TODO
  const hasVisibility = true;

  if (! hasVisibility) {
    return <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        No tienes acceso a ver el contenido de este video en este momento.
      </AlertDescription>
    </Alert>
  }

  const form = useForm<UpdateVideoData>({
    defaultValues: {
      title: video.title,
      description: video.description ?? "",
      optimizedTitle: video.optimizedTitle ?? "",
      optimizedDescription: video.optimizedDescription ?? "",
      tags: video.tags ?? "",
    },
  });

  async function handleAdminEdit (data: UpdateVideoData) {
    await onUpdate(video.id, data);
    setIsEditing(false);
  };

  function renderCardContent () {
    switch (video.status) {
      case 'in_progress':
      case 'title_corrections':
        return <VideoOptimizer
            video={video}
            onUpdate={(videoId, data) => onUpdate(videoId, data)}
          />
      case 'optimize_review':
        return <OptimizeReviewContent
            video={video}
            onUpdate={(videoId, data) => onUpdate(videoId, data)}
          />
      case 'upload_review':
        // Para youtubers, mostrar el formulario de subida si el video está asignado a ellos
        if (user?.role === 'youtuber') {
          return <UploadReviewContent
            video={video}
            onUpdate={(videoId, data) => onUpdate(videoId, data)}
          />
        }
        else { // Para otros roles, mostrar el contenido normal de upload_review
          return <UploadReviewContent
            video={video}
            onUpdate={(videoId, data) => onUpdate(videoId, data)}
          />
        }
      case 'media_corrections':
        return (
          <MediaCorrectionsContent
            video={video}
            onUpdate={onUpdate}
          />
        );
      case 'youtube_ready':
        return <YoutubeReadyContent video={video} userRole={user!.role} />;
      case 'review':
        return <FinalReviewContent video={video} userRole={user!.role} onUpdate={onUpdate} />;
      case 'pending':
        return <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {video.optimizedDescription || video.description}
            </p>

            {video.tags && (
              <div className="flex flex-wrap gap-2">
                {video.tags.split(",").map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag.trim()}
                  </Badge>
                ))}
              </div>
            )}

            {video.lastReviewComments && (
              <Alert variant="destructive" className="bg-destructive/5 border-destructive/10">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-destructive">
                  <p className="font-medium mb-1">Correcciones:</p>
                  <p className="text-sm">{video.lastReviewComments}</p>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {new Date(video.updatedAt || video.createdAt || Date.now()).toLocaleDateString()}
            </div>

            <div className="space-y-4">
              {/* <VideoStatusControl
                videoId={video.id}
                currentStatus={video.status as VideoStatus}
                userRole={userRole}
                onUpdateStatus={(videoId, data) => onUpdate(videoId, data)}
              /> */}

              <div className="flex flex-wrap gap-2">

                <Button
                  size="sm"
                  onClick={async () => {
                    await onUpdate(video.id, {
                      status: 'in_progress',
                      optimizedBy: user?.id,
                    });
                  }}
                >
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Optimizar
                </Button>
                
                { user?.role === 'admin' && 
                  <Dialog open={isEditing} onOpenChange={setIsEditing}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Edit className="mr-2 h-4 w-4" />
                        Editar (Admin)
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Video</DialogTitle>
                      </DialogHeader>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleAdminEdit)} className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Título Original</label>
                            <Input {...form.register("title")} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Descripción Original</label>
                            <Textarea {...form.register("description")} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Título Optimizado</label>
                            <Input {...form.register("optimizedTitle")} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Descripción Optimizada</label>
                            <Textarea {...form.register("optimizedDescription")} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Tags (separados por comas)</label>
                            <Input {...form.register("tags")} />
                          </div>
                          <Button type="submit" className="w-full">
                            Guardar Cambios
                          </Button>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                }
                
                {video.videoUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={video.videoUrl} target="_blank" rel="noopener noreferrer">
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Ver Video
                    </a>
                  </Button>
                )}

                {video.thumbnailUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={video.thumbnailUrl} target="_blank" rel="noopener noreferrer">
                      <Image className="mr-2 h-4 w-4" />
                      Ver Miniatura
                    </a>
                  </Button>
                )}

                {video.youtubeUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={video.youtubeUrl} target="_blank" rel="noopener noreferrer">
                      <Youtube className="mr-2 h-4 w-4" />
                      Ver en YouTube
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
    }
  };

  const statusColor = statusColors[video.status] || statusColors.pending;
  const statusLabel = getStatusLabelNew(user!.role, video)

  return (
    <DialogContent className="w-[95vw] max-w-3xl p-6">
      <DialogHeader >
        <div className="flex justify-between items-start">
          <DialogTitle className="text-xl">
            {hasVisibility ? ( video.optimizedTitle ?? video.title ) : (
              <span className="text-muted-foreground italic">Título no disponible</span>
            )}
            </DialogTitle>
          <div className="pe-6">
            <div className="flex justify-end">
              <Badge variant="outline" className={`${statusColor.bg} ${statusColor.text} border-0 text-lg py-1 px-2`} >
                {statusLabel}
              </Badge>
            </div>
            <p className="text-muted-foreground">{statusDescriptions[video.status]}</p>
          </div>
        </div>
        
      </DialogHeader>


      { renderCardContent() }
      
      </DialogContent>
    // <Card className="transition-all duration-300 ease-in-out">
    //   <CardHeader>
    //     <div className="flex justify-between items-start">
    //       <CardTitle className="text-lg">
            
    //       </CardTitle>
          
    //     </div>
    //   </CardHeader>
    //   <CardContent>
        
    //   </CardContent>
    // </Card>
  );
}

interface VideoCardProps {
  video: Video;
  onUpdate: (videoId: number, data: UpdateVideoData) => Promise<void>;
}



