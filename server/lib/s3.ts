import { 
  S3Client, 
  PutObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  ListPartsCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Cliente de S3 configurado con las credenciales
const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS!,
  },
});

/**
 * Interfaz para representar la configuración de una parte en una carga multiparte
 */
export interface PartConfig {
  partNumber: number;
  url: string;
}

/**
 * Interfaz para representar la respuesta de una carga multiparte iniciada
 */
export interface InitiateMultipartUploadResponse {
  uploadId: string;
  key: string;
  parts: PartConfig[];
  fileUrl: string;
}

/**
 * Interfaz para representar una parte completada en una carga multiparte
 */
export interface CompletedPart {
  PartNumber: number;
  ETag: string;
}

// Exportamos los tipos y funciones para usar en los controladores
export { 
  s3, 
  PutObjectCommand, 
  getSignedUrl,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  ListPartsCommand
};
