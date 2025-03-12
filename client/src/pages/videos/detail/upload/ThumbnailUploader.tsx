import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AlertCircle, Upload, Crop } from "lucide-react";
import { IoImageOutline } from "react-icons/io5";
import { useRef, useState } from "react";
import { ImagePreview } from '@/components/ui/image-preview';
import { useImageOptimization } from '@/hooks/use-image-optimization';
import { cn } from '@/lib/utils';

interface ThumbnailUploaderProps {
  thumbnailUrl: string | null;
  onUploadComplete: (url: string) => void;
  projectId?: number;
  videoId?: number;
}

export function ThumbnailUploader({ 
  thumbnailUrl, 
  onUploadComplete,
  projectId,
  videoId
}: ThumbnailUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Usar el hook de optimización para la previsualización y miniatura existente
  const { optimizedUrl } = useImageOptimization(
    previewUrl || thumbnailUrl,
    'medium'
  );

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validar tamaño y tipo de archivo
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('La imagen es demasiado grande. El tamaño máximo es 5MB.');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecciona un archivo de imagen válido (JPG, PNG).');
      return;
    }
    
    setSelectedFile(file);
    
    // Generar URL para previsualización
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    
    // Limpiar error si existía
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    // Construir la URL con projectId y videoId si están disponibles
    let uploadUrl = '/api/upload/thumbnail';
    if (projectId && videoId) {
      uploadUrl = `/api/projects/${projectId}/videos/${videoId}/uploadThumbnail`;
    }

    try {
      // Importamos api y refreshCSRFToken de nuestro archivo axios mejorado
      const { refreshCSRFToken } = await import('../../../../lib/axios');
      const api = (await import('../../../../lib/axios')).default;
      
      // Refrescar proactivamente el token CSRF antes de esta operación importante
      await refreshCSRFToken();
      
      // Usar nuestra instancia de axios configurada con manejo CSRF
      const response = await api.post(
        uploadUrl,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      // Procesar la respuesta
      const data = response.data;
      if (data.success && data.url) {
        onUploadComplete(data.url);
        setSelectedFile(null);
        
        // Limpiar la previsualización
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
      } else {
        throw new Error('No se recibió la URL de la miniatura');
      }
    } catch (error: any) {
      // Manejo mejorado de errores de CSRF
      if (error.response?.status === 403 && 
          (error.response?.data?.message?.includes('CSRF') || 
           error.response?.data?.message?.includes('token') || 
           error.response?.data?.message?.includes('Token'))) {
        setError("Error de validación de seguridad. Intente de nuevo.");
      } else {
        setError(error.response?.data?.message || error.message || 'Error al subir la miniatura');
      }
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
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Input
              id="thumbnail-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isUploading}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              ref={fileInputRef}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <IoImageOutline className="h-4 w-4" />
              <span className="hidden sm:inline">Elegir</span>
            </Button>
            {selectedFile && (
              <Button 
                onClick={handleUpload} 
                disabled={isUploading}
                variant="secondary"
                size="sm"
                className="flex items-center gap-1"
              >
                {isUploading ? (
                  <>
                    <Upload className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Subiendo...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span className="hidden sm:inline">Subir</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="group relative">
        <ImagePreview
          src={optimizedUrl}
          alt="Vista previa de la miniatura"
          aspectRatio="video"
          enableZoom={true}
          previewTitle="Vista previa de la miniatura"
        />
        
        {/* Overlay informativo */}
        {previewUrl && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white p-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-xs">
              Resolución recomendada: 1280x720 (16:9)
            </p>
          </div>
        )}
      </div>
      
      <div className="text-xs text-muted-foreground">
        <p className="flex items-center gap-1 mb-1">
          <AlertCircle className="h-3 w-3" />
          Formatos soportados: JPG, PNG
        </p>
        <p className="ml-4">
          Las miniaturas se optimizan automáticamente al tamaño ideal para YouTube.
        </p>
      </div>
    </div>
  );
}