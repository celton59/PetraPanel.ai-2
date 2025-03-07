import { 
  S3Client, 
  PutObjectCommand, 
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

// Exportar para compatibilidad con el código existente
export { 
  PutObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand
};
export { getSignedUrl };

// Variables de configuración de AWS
const AWS_REGION = process.env.AWS_REGION;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

// Verificar que tenemos todas las credenciales necesarias
if (!AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !BUCKET_NAME) {
  console.warn("[AWS S3] Faltan credenciales o configuración de AWS", {
    region: AWS_REGION ? "Configurado" : "Falta",
    accessKey: AWS_ACCESS_KEY_ID ? "Configurado" : "Falta",
    secretKey: AWS_SECRET_ACCESS_KEY ? "Configurado" : "Falta",
    bucket: BUCKET_NAME ? "Configurado" : "Falta",
  });
}

// Crear cliente S3
export const s3 = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID || "",
    secretAccessKey: AWS_SECRET_ACCESS_KEY || "",
  },
  // La API de AWS S3 maneja CORS automáticamente cuando se configura en el bucket
  // No se necesita configuración adicional aquí para pre-signed URLs
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

/**
 * Genera un nombre de archivo único para S3 basado en el nombre original
 * @param originalName Nombre original del archivo
 * @param prefix Prefijo opcional para el nombre
 * @returns Nombre único para S3
 */
export function generateS3Key(originalName: string, prefix: string = ""): string {
  const uuid = randomUUID();
  const extension = originalName.split('.').pop() || "";
  const sanitizedName = originalName
    .split('.')[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .substring(0, 40);
  
  return `${prefix}/${uuid}-${sanitizedName}.${extension}`;
}

/**
 * Genera una URL pública para un objeto en S3
 * @param key Clave del objeto en S3
 * @returns URL pública del objeto
 */
export function getPublicS3Url(key: string): string {
  return `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;
}

/**
 * Obtiene una URL firmada para subir un archivo directamente a S3
 * @param key Nombre del archivo en S3
 * @param contentType Tipo de contenido MIME del archivo
 * @param expiresIn Tiempo de expiración de la URL en segundos
 * @returns Objeto con la URL firmada y la URL pública del archivo
 */
export async function getSignedUploadUrl(key: string, contentType: string, expiresIn: number = 3600): Promise<{uploadUrl: string, fileUrl: string}> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn });
  
  // Generar la URL pública del archivo
  const fileUrl = getPublicS3Url(key);
  
  return { uploadUrl, fileUrl };
}

/**
 * Inicia una carga multiparte en S3
 * @param key Nombre del archivo en S3
 * @param contentType Tipo de contenido MIME del archivo
 * @param fileSize Tamaño del archivo en bytes
 * @param expiresIn Tiempo de expiración de las URLs en segundos
 * @returns Respuesta con datos para la carga multiparte
 */
export async function initiateMultipartUpload(
  key: string,
  contentType: string,
  fileSize: number,
  expiresIn: number = 3600
): Promise<InitiateMultipartUploadResponse> {
  // Crear una carga multiparte
  const createCommand = new CreateMultipartUploadCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });
  
  const { UploadId } = await s3.send(createCommand);
  
  if (!UploadId) {
    throw new Error("No se pudo iniciar la carga multiparte");
  }
  
  // Calculamos el tamaño de cada parte (5MB mínimo)
  const partSize = Math.max(5 * 1024 * 1024, Math.ceil(fileSize / 10000));
  
  // Calculamos el número de partes
  const numParts = Math.ceil(fileSize / partSize);
  
  // Generar URLs firmadas para cada parte
  const partConfigs: PartConfig[] = [];
  for (let i = 1; i <= numParts; i++) {
    const uploadPartCommand = new UploadPartCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      UploadId,
      PartNumber: i,
    });
    
    const url = await getSignedUrl(s3, uploadPartCommand, { expiresIn });
    partConfigs.push({ partNumber: i, url });
  }
  
  // Generar la URL pública del archivo
  const fileUrl = getPublicS3Url(key);
  
  return {
    uploadId: UploadId,
    key,
    parts: partConfigs,
    fileUrl,
  };
}

/**
 * Completa una carga multiparte en S3
 * @param key Nombre del archivo en S3
 * @param uploadId ID de la carga multiparte
 * @param parts Lista de partes completadas
 * @returns URL pública del archivo
 */
export async function completeMultipartUpload(
  key: string,
  uploadId: string,
  parts: CompletedPart[]
): Promise<string> {
  // Ordenar las partes por número
  const sortedParts = [...parts].sort((a, b) => a.PartNumber - b.PartNumber);
  
  const command = new CompleteMultipartUploadCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: sortedParts,
    },
  });
  
  await s3.send(command);
  
  // Devolver la URL pública del archivo
  return getPublicS3Url(key);
}

/**
 * Aborta una carga multiparte en S3
 * @param key Nombre del archivo en S3
 * @param uploadId ID de la carga multiparte
 */
export async function abortMultipartUpload(
  key: string,
  uploadId: string
): Promise<void> {
  const command = new AbortMultipartUploadCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    UploadId: uploadId,
  });
  
  await s3.send(command);
}