import { Video } from '@db/schema'
import { Clock, Edit, PlayCircle, Upload, Youtube, AlertCircle, Image, CheckCircle2, List, Layout } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useUser } from '@/hooks/use-user';
import { UpdateVideoData } from '@/hooks/useVideos';
import { useState } from 'react';
import { MediaCorrectionsDialog } from './MediaCorrectionsDialog';

export default function FinalReviewContent({ video, onUpdate }: FinalReviewContentProps) {
  
  const [isRequestingCorrections, setIsRequestingCorrections] = useState(false);
  const { user } = useUser()
  
  return <div className="space-y-6">
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

      {user?.role === 'admin' && (
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

        const updateData = {
          status: "media_corrections" as const,
          lastReviewComments: comments,
        };

        await onUpdate(video.id, updateData);
      }}
    />
  </div>
}

export interface FinalReviewContentProps {
  video: Video
  onUpdate: (videoId: number, data: UpdateVideoData) => Promise<void>;
}