import { useState, useEffect } from 'react';

interface ImageSize {
  width: number;
  height: number;
}

// Tipos de tamaños de imagen predefinidos
export type ImageResolutionType = 'thumbnail' | 'small' | 'medium' | 'large' | 'original';

// Mapeo de tipos de resolución a dimensiones reales
const resolutionMap: Record<ImageResolutionType, ImageSize> = {
  thumbnail: { width: 320, height: 180 },
  small: { width: 640, height: 360 },
  medium: { width: 1280, height: 720 },
  large: { width: 1920, height: 1080 },
  original: { width: 0, height: 0 } // Usa las dimensiones originales
};

// Caché de imágenes para evitar recargas innecesarias
const imageCache: Record<string, string> = {};

/**
 * Hook para optimizar el manejo de imágenes con diferentes resoluciones
 * 
 * @param originalUrl URL original de la imagen
 * @param resolution Resolución deseada de la imagen
 * @returns URL optimizada, flags de estados (loading, error)
 */
export function useImageOptimization(
  originalUrl: string | null,
  resolution: ImageResolutionType = 'medium'
) {
  const [optimizedUrl, setOptimizedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!originalUrl) {
      setOptimizedUrl(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsError(false);

    // Generar clave de caché única para esta combinación de URL y resolución
    const cacheKey = `${originalUrl}_${resolution}`;

    // Verificar si la imagen ya está en caché
    if (imageCache[cacheKey]) {
      setOptimizedUrl(imageCache[cacheKey]);
      setIsLoading(false);
      return;
    }

    // Para imágenes de AWS S3, podemos ajustar parámetros en la URL
    if (originalUrl.includes('amazonaws.com')) {
      // En implementación real, agregar lógica para usar redimensionamiento de S3
      // Por ahora, usamos la original para no romper la funcionalidad
      imageCache[cacheKey] = originalUrl;
      setOptimizedUrl(originalUrl);
      setIsLoading(false);
      return;
    }

    // Para otras imágenes, simplemente usar la URL original
    // En un caso real, podríamos implementar un servicio de redimensionamiento
    imageCache[cacheKey] = originalUrl;
    setOptimizedUrl(originalUrl);
    setIsLoading(false);
  }, [originalUrl, resolution]);

  return {
    optimizedUrl,
    isLoading,
    isError,
    resolution: resolutionMap[resolution]
  };
}

/**
 * Función para pre-cargar imágenes en diferentes resoluciones
 * Útil para mejorar la experiencia de usuario en galerías o carruseles
 */
export function preloadImages(urls: string[], resolutions: ImageResolutionType[] = ['thumbnail', 'medium']) {
  urls.forEach(url => {
    if (!url) return;
    
    resolutions.forEach(resolution => {
      const img = new Image();
      const cacheKey = `${url}_${resolution}`;
      
      // Si ya está en caché, no es necesario precargar
      if (imageCache[cacheKey]) return;
      
      img.onload = () => {
        imageCache[cacheKey] = url;
      };
      
      img.src = url;
    });
  });
}