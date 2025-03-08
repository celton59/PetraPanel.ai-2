import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Upload, UploadCloud, RefreshCw, FileVideo, Image as ImageIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { UploadProgressState } from "@/services/videoUploader";
import { VideoUploadProgress } from "@/components/video/VideoUploadProgress";
import { AdvancedFileUpload } from "@/components/ui/advanced-file-upload";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

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
  // Configuración de las animaciones para los elementos
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Encabezado de correcciones solicitadas */}
      {(needsVideoCorrection || needsThumbnailCorrection) && (
        <motion.div 
          className="flex flex-wrap gap-2 mb-2" 
          variants={itemVariants}
        >
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Correcciones solicitadas:</span>
          </div>
          
          <AnimatePresence>
            {needsVideoCorrection && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 flex items-center gap-1 py-1">
                  <FileVideo className="h-3 w-3" />
                  <span>Video</span>
                </Badge>
              </motion.div>
            )}
            
            {needsThumbnailCorrection && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2, delay: 0.1 }}
              >
                <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 flex items-center gap-1 py-1">
                  <ImageIcon className="h-3 w-3" />
                  <span>Miniatura</span>
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {needsVideoCorrection && (
          <motion.div 
            className="space-y-2"
            variants={itemVariants}
            layout
            transition={{ 
              layout: { duration: 0.3, type: "spring" } 
            }}
          >
            <div className="flex items-center mb-2">
              <FileVideo className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
              <Label className="font-medium text-blue-700 dark:text-blue-300">Video Corregido</Label>
            </div>
            
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
              className="border-blue-200 dark:border-blue-800/40 bg-blue-50/50 dark:bg-blue-900/10"
              hoverClassName="border-blue-300 dark:border-blue-700/60 bg-blue-50/80 dark:bg-blue-900/20"
            />
            
            <AnimatePresence>
              {isUploading && videoFile && uploadProgress && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <VideoUploadProgress 
                    progressState={{
                      ...uploadProgress,
                      isUploading: true
                    }}
                    className="mt-3"
                  />
                </motion.div>
              )}
            </AnimatePresence>
            
            <Alert variant="default" className="border-blue-200 dark:border-blue-800/40 bg-blue-50/50 dark:bg-blue-900/10 text-blue-800 dark:text-blue-300">
              <AlertCircle className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              <AlertDescription className="text-blue-700 dark:text-blue-300">
                Formatos soportados: MP4, MOV, AVI. Tamaño máximo: 1GB
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {needsThumbnailCorrection && (
          <motion.div 
            className="space-y-2"
            variants={itemVariants}
            layout
            transition={{ 
              layout: { duration: 0.3, type: "spring" } 
            }}
          >
            <div className="flex items-center mb-2">
              <ImageIcon className="h-4 w-4 text-purple-600 dark:text-purple-400 mr-2" />
              <Label className="font-medium text-purple-700 dark:text-purple-300">Miniatura Corregida</Label>
            </div>
            
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
              className="border-purple-200 dark:border-purple-800/40 bg-purple-50/50 dark:bg-purple-900/10"
              hoverClassName="border-purple-300 dark:border-purple-700/60 bg-purple-50/80 dark:bg-purple-900/20"
            />
            
            <Alert variant="default" className="border-purple-200 dark:border-purple-800/40 bg-purple-50/50 dark:bg-purple-900/10 text-purple-800 dark:text-purple-300">
              <AlertCircle className="h-4 w-4 text-purple-500 dark:text-purple-400" />
              <AlertDescription className="text-purple-700 dark:text-purple-300">
                Formatos soportados: JPG, PNG. Resolución recomendada: 1280x720
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
      
      {!needsVideoCorrection && !needsThumbnailCorrection && (
        <motion.div 
          className="py-12 text-center flex flex-col items-center justify-center space-y-3"
          variants={itemVariants}
          transition={{ duration: 0.5 }}
        >
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-2">
            <AlertCircle className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-base font-medium text-gray-700 dark:text-gray-300">Sin correcciones pendientes</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md">
            No se han solicitado correcciones para este video. Cuando existan correcciones requeridas, aparecerán aquí.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
