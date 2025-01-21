import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AlertCircle, Upload } from "lucide-react";
import { useState } from "react";

interface VideoUploaderProps {
  videoUrl: string | null;
  onUploadComplete: (url: string) => void;
}

export function VideoUploader({ videoUrl, onUploadComplete }: VideoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('video', file);

    try {
      const response = await fetch('/api/upload/video', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Error al subir el video');
      }

      const { url } = await response.json();
      onUploadComplete(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el video');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="video-upload" className="mb-2 block">
          Subir nuevo video
        </Label>
        <div className="flex items-center space-x-2">
          <Input
            id="video-upload"
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            disabled={isUploading}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          />
          {isUploading && (
            <Button disabled variant="outline" size="icon">
              <Upload className="h-4 w-4 animate-spin" />
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {videoUrl && !isUploading && (
        <div className="aspect-video bg-muted rounded-lg overflow-hidden">
          <video src={videoUrl} className="w-full h-full object-cover" controls />
        </div>
      )}
    </div>
  );
}
