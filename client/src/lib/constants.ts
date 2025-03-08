// Constantes para estados de videos
export const VIDEO_STATUSES = [
  'available',
  'content_corrections',
  'content_review',
  'upload_media',
  'media_corrections',
  'media_review',
  'final_review',
  'completed'
] as const;

// Tipos para los estados de videos
export type VideoStatus = typeof VIDEO_STATUSES[number];

// Constantes para APIs 
export const API_BASE_URL = '/api';
export const API_TIMEOUT = 30000; // 30 segundos

// Constantes para tamaños de paginación
export const PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Constantes para manejar archivos
export const MAX_FILE_SIZE = 1024 * 1024 * 500; // 500MB
export const SUPPORTED_VIDEO_FORMATS = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];
export const SUPPORTED_THUMBNAIL_FORMATS = ['.jpg', '.jpeg', '.png', '.webp'];

// Constantes para la UI
export const TOAST_DURATION = 3000;
export const ANIMATION_DURATION = 200;

// Configuración predeterminada para elementos paginados
export const DEFAULT_PAGINATION = {
  page: 1,
  pageSize: PAGE_SIZE,
  totalPages: 1,
  totalItems: 0
};