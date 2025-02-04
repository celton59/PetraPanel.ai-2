import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Video, VideoStatus } from "@db/schema";
import { getRoleStatus } from "@/hooks/use-videos";
import { Clock, Edit, PlayCircle, Upload, Youtube, AlertCircle, Image, CheckCircle2, List } from "lucide-react";
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
import { UpdateVideoData } from "@/hooks/use-videos";
import { VideoStatusControl } from "@/components/video/VideoStatusControl";
import { VideoOptimizer } from "@/components/video/VideoOptimizer";
import { OptimizeReviewContent } from "@/components/video/review/OptimizeReviewContent";
import { UploadReviewContent } from "@/components/video/review/UploadReviewContent";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MediaCorrectionsDialog } from "./video/review/MediaCorrectionsDialog";
import { MediaCorrectionsContent } from "./video/review/MediaCorrectionsContent";

interface VideoCardProps {
  video: Video;
  userRole: string;
  onUpdate: (videoId: number, data: UpdateVideoData) => Promise<void>;
}

type Role = 'admin' | 'youtuber' | string;


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

const FinalReviewContent = ({ video, userRole, onUpdate }: VideoCardProps) => {
  const [isRequestingCorrections, setIsRequestingCorrections] = useState(false);

  return (
    <div className="space-y-6">
      {/* Previsualización de Miniatura */}
      {video.thumbnailUrl && (
        <div className="rounded-lg overflow-hidden border bg-card">
          <div className="aspect-video relative">
            <img
              src={video.thumbnailUrl}
              alt="Miniatura del video"
              className="absolute inset-0 w-full h-full object-cover"
            />
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

const YoutubeReadyContent = ({ video, userRole }: { video: Video; userRole: string }) => {
  return (
    <div className="space-y-6">
      {/* Previsualización de Miniatura */}
      {video.thumbnailUrl && (
        <div className="rounded-lg overflow-hidden border bg-card">
          <div className="aspect-video relative">
            <img
              src={video.thumbnailUrl}
              alt="Miniatura del video"
              className="absolute inset-0 w-full h-full object-cover"
            />
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

export function VideoCard({ video, userRole, onUpdate }: VideoCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isRequestingCorrections, setIsRequestingCorrections] = useState(false);

  // Determinar si el usuario tiene visibilidad usando getRoleStatus
  const hasVisibility = getRoleStatus(video.status as VideoStatus)[userRole] === 'disponible';

  const form = useForm<UpdateVideoData>({
    defaultValues: {
      title: video.title,
      description: video.description ?? "",
      optimizedTitle: video.optimizedTitle ?? "",
      optimizedDescription: video.optimizedDescription ?? "",
      tags: video.tags ?? "",
    },
  });

  const handleSubmit = async (data: UpdateVideoData) => {
    await onUpdate(video.id, data);
    setIsEditing(false);
  };

  const renderContent = () => {
    switch (video.status) {
      case 'in_progress':
      case 'title_corrections':
        return (
          <VideoOptimizer
            video={video}
            onUpdate={(videoId, data) => onUpdate(videoId, data)}
          />
        );
      case 'upload_review':
        // Para youtubers, mostrar el formulario de subida si el video está asignado a ellos
        if (userRole === 'youtuber') {
          return (
            <UploadReviewContent
              video={video}
              onUpdate={(videoId, data) => onUpdate(videoId, data)}
            />
          );
        }
        // Para otros roles, mostrar el contenido normal de upload_review
        if (userRole !== 'youtuber') {
          return (
            <UploadReviewContent
              video={video}
              onUpdate={(videoId, data) => onUpdate(videoId, data)}
            />
          );
        }
        return null;
      case 'media_corrections':
        return (
          <MediaCorrectionsContent
            video={video}
            onUpdate={onUpdate}
          />
        );
      case 'optimize_review':
        return (
          <OptimizeReviewContent
            video={video}
            onUpdate={(videoId, data) => onUpdate(videoId, data)}
          />
        );
      case 'youtube_ready':
        return <YoutubeReadyContent video={video} userRole={userRole} />;
      case 'review':
        return <FinalReviewContent video={video} userRole={userRole} onUpdate={onUpdate} />;
      default:
        return (
          <div className="space-y-4">
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
              <VideoStatusControl
                videoId={video.id}
                currentStatus={video.status as VideoStatus}
                userRole={userRole}
                onUpdateStatus={(videoId, data) => onUpdate(videoId, data)}
              />

              <div className="flex flex-wrap gap-2">
                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Editar Video</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
        );
    }
  };

  const statusColor = statusColors[video.status as VideoStatus] || statusColors.pending;
  const getStatusLabel = (status: VideoStatus, role: Role, correctionType?: CorrectionType, video?: Video): string => {
    // Placeholder implementation.  Replace with your actual logic.
    return statusLabels[status] || "Unknown Status";
  };
  const statusLabel = getStatusLabel(video.status as VideoStatus, userRole as Role, undefined, video);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">
            {hasVisibility ? (
              video.optimizedTitle || video.title
            ) : (
              <span className="text-muted-foreground italic">Título no disponible</span>
            )}
          </CardTitle>
          <Badge
            variant="outline"
            className={`${statusColor.bg} ${statusColor.text} border-0`}
          >
            {statusLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {hasVisibility ? (
          renderContent()
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No tienes acceso a ver el contenido de este video en este momento.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

const statusLabels: Record<VideoStatus, string> = {
  pending: "Pendiente",
  in_progress: "En Optimización",
  title_corrections: "Correcciones de Título",
  optimize_review: "Revisión de Optimización",
  upload_review: "Subir Archivos",
  youtube_ready: "Listo para YouTube",
  review: "Rev. Final",
  media_corrections: "Correcciones de Archivos",
  completed: "Completado"
};

type CorrectionType = 'video' | 'thumbnail' | 'both';