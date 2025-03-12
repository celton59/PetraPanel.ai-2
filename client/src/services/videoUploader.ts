import { toast } from "sonner";
import axios from "@/lib/axios";

/**
 * Interface para la respuesta de inicialización de carga multiparte
 */
interface InitiateMultipartUploadResponse {
  uploadId: string;
  key: string;
  parts: {
    partNumber: number;
    url: string;
  }[];
  fileUrl: string;
  numParts: number;
  partSize: number;
}

/**
 * Interface para la parte completada en la carga multiparte
 */
interface CompletedPart {
  PartNumber: number;
  ETag: string;
}

/**
 * Interface para el estado del progreso de carga
 * Simplificada para mostrar solo información relevante al usuario
 */
export interface UploadProgressState {
  isUploading: boolean;
  progress: number;
  uploadSpeed: number; // en bytes por segundo
  estimatedTimeRemaining: number; // en segundos
  // Mantenemos estos campos para uso interno, pero no los mostramos al usuario
  uploadedParts: number;
  totalParts: number;
}

export type UploadProgressCallback = (progress: UploadProgressState) => void;

/**
 * Clase para manejar la carga multiparte de videos a S3
 */
export class VideoUploader {
  private projectId: number;
  private videoId: number;
  private file: File;
  private chunkSize: number = 5 * 1024 * 1024; // Tamaño predeterminado de 5MB
  private uploadId: string | null = null;
  private key: string | null = null;
  private parts: { partNumber: number; url: string }[] = [];
  private fileUrl: string | null = null;
  private abortController: AbortController = new AbortController();
  private uploadWorker: Worker | null = null;
  private completedParts: CompletedPart[] = [];
  private onProgressCallback: UploadProgressCallback | null = null;
  private uploadStartTime: number = 0;
  private totalBytesUploaded: number = 0;
  private totalUploadedSize: number = 0;
  private isUploading: boolean = false;

  /**
   * Constructor del VideoUploader
   * @param projectId ID del proyecto
   * @param videoId ID del video
   * @param file Archivo de video a cargar
   */
  constructor(projectId: number, videoId: number, file: File) {
    this.projectId = projectId;
    this.videoId = videoId;
    this.file = file;
  }

  /**
   * Configura el callback para el progreso de la carga
   * @param callback Función de callback para recibir actualizaciones de progreso
   */
  public onProgress(callback: UploadProgressCallback): VideoUploader {
    this.onProgressCallback = callback;
    return this;
  }

  /**
   * Inicia la carga multiparte del video
   * @returns URL del video cargado
   */
  public async upload(): Promise<string> {
    if (this.isUploading) {
      throw new Error("Ya hay una carga en progreso");
    }

    this.isUploading = true;
    this.uploadStartTime = Date.now();
    this.totalBytesUploaded = 0;
    this.completedParts = [];

    try {
      // Paso 1: Iniciar la carga multiparte
      const uploadData = await this.initiateMultipartUpload();
      this.uploadId = uploadData.uploadId;
      this.key = uploadData.key;
      this.parts = uploadData.parts;
      this.fileUrl = uploadData.fileUrl;
      this.chunkSize = uploadData.partSize;

      // Preparamos la función de progreso
      this.updateProgress(0, 0, uploadData.numParts);

      // Verificamos si el navegador soporta Web Workers
      if (window.Worker) {
        // Cargar las partes del archivo usando Web Workers
        await this.uploadPartsWithWorker();
      } else {
        // Fallback para navegadores sin soporte de Web Workers
        await this.uploadPartsSequentially();
      }

      // Paso 3: Completar la carga multiparte
      await this.completeMultipartUpload();

      // Actualizar el progreso al 100%
      this.updateProgress(100, this.completedParts.length, this.completedParts.length);

      this.isUploading = false;
      return this.fileUrl!;
    } catch (error: any) {
      this.isUploading = false;
      // Si hay un error, intentamos abortar la carga
      try {
        if (this.uploadId && this.key) {
          await this.abortMultipartUpload();
        }
      } catch (abortError) {
        console.error("Error al abortar la carga multiparte:", abortError);
      }

      toast.error(`Error al subir el video: ${error.message || "Error desconocido"}`);
      throw error;
    }
  }

  /**
   * Cancela la carga multiparte en progreso
   */
  public async cancel(): Promise<void> {
    if (!this.isUploading) {
      return;
    }

    // Cancelar cualquier solicitud en curso
    this.abortController.abort();
    
    // Detener el Web Worker si está en uso
    if (this.uploadWorker) {
      this.uploadWorker.terminate();
      this.uploadWorker = null;
    }

    // Abortar la carga multiparte en S3
    if (this.uploadId && this.key) {
      await this.abortMultipartUpload();
    }

    this.isUploading = false;
    this.updateProgress(0, 0, 0);
  }

  /**
   * Inicia una carga multiparte en S3
   * @returns Datos de la carga multiparte iniciada
   */
  private async initiateMultipartUpload(): Promise<InitiateMultipartUploadResponse> {
    try {

      // Importamos api y refreshCSRFToken de nuestro archivo axios mejorado
      const { refreshCSRFToken } = await import('../lib/axios');
      const api = (await import('../lib/axios')).default;
      
      // Refrescar proactivamente el token CSRF antes de esta operación importante
      await refreshCSRFToken();
      
      // Usar nuestra instancia de axios configurada con manejo CSRF
      const response = await api.post(
        `/api/projects/${this.projectId}/videos/${this.videoId}/initiate-multipart-upload`,
        {
          originalName: this.file.name,
          fileSize: this.file.size,
          contentType: this.file.type,
        }
      );
      
      return response.data.data;
    } catch (error: any) {

      console.error("Error al iniciar la carga multiparte:", error);
      
      // Manejo mejorado de errores de CSRF
      if (error.response?.status === 403 && 
          (error.response?.data?.message?.includes('CSRF') || 
           error.response?.data?.message?.includes('token') || 
           error.response?.data?.message?.includes('Token'))) {
        throw new Error("Error de validación de seguridad. Intente de nuevo.");
      }
      
      throw new Error(error.response?.data?.message || error.message || "Error al iniciar la carga multiparte");
    }
  }

  /**
   * Completa una carga multiparte en S3
   */
  private async completeMultipartUpload(): Promise<void> {
    try {

      // Importamos api y refreshCSRFToken de nuestro archivo axios mejorado
      const { refreshCSRFToken } = await import('../lib/axios');
      const api = (await import('../lib/axios')).default;
      
      // Refrescar proactivamente el token CSRF antes de esta operación importante
      await refreshCSRFToken();
      
      // Usar nuestra instancia de axios configurada con manejo CSRF
      const response = await api.post(
        `/api/projects/${this.projectId}/videos/${this.videoId}/complete-multipart-upload`,
        {
          uploadId: this.uploadId,
          key: this.key,
          parts: this.completedParts,
        }
      );
      
      this.fileUrl = response.data.url;
    } catch (error: any) {

      console.error("Error al completar la carga multiparte:", error);
      
      // Manejo mejorado de errores de CSRF
      if (error.response?.status === 403 && 
          (error.response?.data?.message?.includes('CSRF') || 
           error.response?.data?.message?.includes('token') || 
           error.response?.data?.message?.includes('Token'))) {
        throw new Error("Error de validación de seguridad. Intente de nuevo.");
      }
      
      throw new Error(error.response?.data?.message || error.message || "Error al completar la carga multiparte");
    }
  }

  /**
   * Aborta una carga multiparte en S3
   */
  private async abortMultipartUpload(): Promise<void> {
    try {

      // Importamos api y refreshCSRFToken de nuestro archivo axios mejorado
      const { refreshCSRFToken } = await import('../lib/axios');
      const api = (await import('../lib/axios')).default;
      
      // Refrescar proactivamente el token CSRF antes de esta operación importante
      await refreshCSRFToken();
      
      // Usar nuestra instancia de axios configurada con manejo CSRF
      await api.post(
        `/api/projects/${this.projectId}/videos/${this.videoId}/abort-multipart-upload`,
        {
          uploadId: this.uploadId,
          key: this.key,
        }
      );
    } catch (error: any) {

      console.error("Error al abortar la carga multiparte:", error);
      
      // Manejo mejorado de errores de CSRF
      if (error.response?.status === 403 && 
          (error.response?.data?.message?.includes('CSRF') || 
           error.response?.data?.message?.includes('token') || 
           error.response?.data?.message?.includes('Token'))) {
        throw new Error("Error de validación de seguridad. Intente de nuevo.");
      }
      
      throw new Error(error.response?.data?.message || error.message || "Error al abortar la carga multiparte");
    }
  }

  /**
   * Carga las partes del archivo secuencialmente (fallback para navegadores sin soporte de Web Workers)
   */
  private async uploadPartsSequentially(): Promise<void> {
    for (let i = 0; i < this.parts.length; i++) {
      const { partNumber, url } = this.parts[i];
      const start = (partNumber - 1) * this.chunkSize;
      const end = Math.min(start + this.chunkSize, this.file.size);
      const chunk = this.file.slice(start, end);

      // Cargar la parte
      const response = await fetch(url, {
        method: "PUT",
        body: chunk,
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Error al cargar la parte ${partNumber}`);
      }

      // Obtener el ETag de la respuesta
      const ETag = response.headers.get("ETag")?.replace(/"/g, "") || "";
      this.completedParts.push({ PartNumber: partNumber, ETag });

      // Actualizar el progreso
      this.totalBytesUploaded += chunk.size;
      this.updateProgress(
        (this.totalBytesUploaded / this.file.size) * 100,
        this.completedParts.length,
        this.parts.length
      );
    }
  }

  /**
   * Carga las partes del archivo usando Web Workers
   */
  private async uploadPartsWithWorker(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Creamos el worker inline para mayor compatibilidad
      const workerCode = `
        self.onmessage = async function(e) {
          const { parts, file, chunkSize, maxConcurrent } = e.data;
          const completedParts = [];
          let activeTasks = 0;
          let nextPartIndex = 0;
          let totalUploaded = 0;
          
          function uploadPart(partConfig) {
            return new Promise(async (resolve, reject) => {
              try {
                const { partNumber, url } = partConfig;
                const start = (partNumber - 1) * chunkSize;
                const end = Math.min(start + chunkSize, file.size);
                const chunk = file.slice(start, end);
                
                const response = await fetch(url, {
                  method: 'PUT',
                  body: chunk
                });
                
                if (!response.ok) {
                  throw new Error(\`Error al cargar la parte \${partNumber}\`);
                }
                
                const ETag = response.headers.get('ETag')?.replace(/"/g, '') || '';
                
                totalUploaded += chunk.size;
                self.postMessage({
                  type: 'progress',
                  progress: (totalUploaded / file.size) * 100,
                  partNumber: partNumber,
                  size: chunk.size
                });
                
                resolve({ PartNumber: partNumber, ETag });
              } catch (error) {
                reject(error);
              }
            });
          }
          
          function startNextUpload() {
            if (nextPartIndex >= parts.length) return;
            
            const partConfig = parts[nextPartIndex++];
            activeTasks++;
            
            uploadPart(partConfig)
              .then(result => {
                completedParts.push(result);
                activeTasks--;
                
                if (completedParts.length === parts.length) {
                  // Todas las partes completadas
                  self.postMessage({ type: 'complete', parts: completedParts });
                } else {
                  // Iniciar la siguiente carga
                  startNextUpload();
                }
              })
              .catch(error => {
                self.postMessage({ type: 'error', message: error.message });
              });
          }
          
          // Iniciar uploads en paralelo (limitado por maxConcurrent)
          for (let i = 0; i < Math.min(maxConcurrent, parts.length); i++) {
            startNextUpload();
          }
        };
      `;

      // Crear el Web Worker con el código inline
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      this.uploadWorker = new Worker(URL.createObjectURL(blob));

      // Configurar los manejadores de eventos del Worker
      this.uploadWorker.onmessage = (event) => {
        const data = event.data;

        if (data.type === 'progress') {
          this.totalUploadedSize += data.size;
          this.updateProgress(
            data.progress,
            this.completedParts.length + 1, // +1 porque esta parte está en progreso
            this.parts.length
          );
        } else if (data.type === 'complete') {
          this.completedParts = data.parts.sort((a: CompletedPart, b: CompletedPart) => a.PartNumber - b.PartNumber);
          resolve();
        } else if (data.type === 'error') {
          reject(new Error(data.message));
        }
      };

      this.uploadWorker.onerror = (error) => {
        reject(new Error(`Worker error: ${error.message}`));
      };

      // Iniciar el Worker con los datos necesarios
      this.uploadWorker.postMessage({
        parts: this.parts,
        file: this.file,
        chunkSize: this.chunkSize,
        maxConcurrent: navigator.hardwareConcurrency ? Math.min(navigator.hardwareConcurrency, 4) : 3
      });
    });
  }

  /**
   * Actualiza el progreso de la carga
   * @param progressPercent Porcentaje de progreso (0-100)
   * @param uploadedParts Número de partes cargadas
   * @param totalParts Número total de partes
   */
  private updateProgress(progressPercent: number, uploadedParts: number, totalParts: number): void {
    if (!this.onProgressCallback) return;

    const elapsedTime = (Date.now() - this.uploadStartTime) / 1000; // en segundos
    const uploadSpeed = elapsedTime > 0 ? this.totalUploadedSize / elapsedTime : 0;
    
    // Calcular tiempo restante estimado
    const remainingBytes = this.file.size - this.totalUploadedSize;
    const estimatedTimeRemaining = uploadSpeed > 0 ? remainingBytes / uploadSpeed : 0;

    this.onProgressCallback({
      isUploading: this.isUploading,
      progress: progressPercent,
      uploadedParts,
      totalParts,
      uploadSpeed,
      estimatedTimeRemaining
    });
  }
}