import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Upload, UploadCloud, RefreshCw } from "lucide-react";
import { Label } from "@/components/ui/label";
import { UploadProgressState } from "@/services/videoUploader";
import { VideoUploadProgress } from "@/components/video/VideoUploadProgress";
import { AdvancedFileUpload } from "@/components/ui/advanced-file-upload";
import { motion } from "framer-motion";

interface CorrectionUploadFieldsProps {
  videoFile: File | null;
  thumbnailFile: File | null;
  onVideoFileChange: (file: File | null) => void;
  onThumbnailFileChange: (file: File | null) => void;
  isUploading?: boolean;
  uploadProgress?: UploadProgressState;
  needsVideoCorrection?: boolean;
  needsThumbnailCorrection?: boolean;
}

// Estado inicial de progreso vacío para usar como valor por defecto
const emptyProgressState: UploadProgressState = {
  isUploading: false,
  progress: 0,
  uploadedParts: 0,
  totalParts: 0,
  uploadSpeed: 0,
  estimatedTimeRemaining: 0
};

export function CorrectionUploadFields({
  videoFile,
  thumbnailFile,
  onVideoFileChange,
  onThumbnailFileChange,
  isUploading,
  uploadProgress = emptyProgressState,
  needsVideoCorrection = false,
  needsThumbnailCorrection = false
}: CorrectionUploadFieldsProps) {
  return (
    <div className="space-y-6">
      {needsVideoCorrection && (
        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Label className="mb-2 block">Video Corregido</Label>
          <AdvancedFileUpload
            initialFile={videoFile}
            onChange={onVideoFileChange}
            fileType="video"
            accept="video/*"
            maxSize={1024 * 1024 * 1000} // 1GB
            label="Arrastra y suelta tu video corregido aquí"
            sublabel="o haz clic para seleccionar un archivo"
            loading={isUploading}
            disabled={!needsVideoCorrection || isUploading}
            fileTypeDescription="Formatos soportados: MP4, MOV, AVI. Tamaño máximo: 1GB."
            actionLabel={isUploading ? "Subiendo..." : "Preparado"}
            actionIcon={isUploading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
          />
          
          {isUploading && videoFile && uploadProgress && (
            <VideoUploadProgress 
              progressState={{
                ...uploadProgress,
                isUploading: true
              }}
              className="mt-3"
            />
          )}
          
          <Alert variant="default" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Formatos soportados: MP4, MOV, AVI. Tamaño máximo: 1GB
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {needsThumbnailCorrection && (
        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Label className="mb-2 block">Miniatura Corregida</Label>
          <AdvancedFileUpload
            initialFile={thumbnailFile}
            onChange={onThumbnailFileChange}
            fileType="image"
            accept="image/*"
            maxSize={1024 * 1024 * 10} // 10MB
            label="Arrastra y suelta tu miniatura corregida aquí"
            sublabel="o haz clic para seleccionar un archivo"
            loading={isUploading}
            disabled={!needsThumbnailCorrection || isUploading}
            fileTypeDescription="Formatos soportados: JPG, PNG, WEBP. Resolución recomendada: 1280x720."
            actionLabel={isUploading ? "Procesando..." : "Lista"}
            actionIcon={isUploading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          />
          
          <Alert variant="default" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Formatos soportados: JPG, PNG. Resolución recomendada: 1280x720
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
      
      {!needsVideoCorrection && !needsThumbnailCorrection && (
        <motion.div 
          className="py-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-gray-500 text-sm">No se han solicitado correcciones para este video.</p>
        </motion.div>
      )}
    </div>
  );
}
