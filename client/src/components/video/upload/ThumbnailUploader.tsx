import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AlertCircle, Upload } from "lucide-react";
import { useState } from "react";

interface ThumbnailUploaderProps {
  thumbnailUrl: string | null;
  onUploadComplete: (url: string) => void;
}

export function ThumbnailUploader({ thumbnailUrl, onUploadComplete }: ThumbnailUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('thumbnail', selectedFile);

    try {
      const response = await fetch('/api/upload/thumbnail', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al subir la miniatura');
      }

      const data = await response.json();
      if (data.success && data.url) {
        onUploadComplete(data.url);
        setSelectedFile(null);
      } else {
        throw new Error('No se recibió la URL de la miniatura');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir la miniatura');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="thumbnail-upload" className="mb-2 block">
          Subir nueva miniatura
        </Label>
        <div className="flex items-center space-x-2">
          <Input
            id="thumbnail-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          />
          {selectedFile && (
            <Button 
              onClick={handleUpload} 
              disabled={isUploading}
              variant="secondary"
            >
              {isUploading ? (
                <Upload className="h-4 w-4 animate-spin" />
              ) : (
                "Subir"
              )}
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

      {thumbnailUrl && !isUploading && (
        <div className="aspect-video bg-muted rounded-lg overflow-hidden">
          <img
            src={thumbnailUrl}
            alt="Vista previa de la miniatura"
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  );
}