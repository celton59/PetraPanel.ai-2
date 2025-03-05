import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Genera iniciales a partir de un nombre completo
 * @param name Nombre completo para generar iniciales
 * @returns Iniciales (máximo 2 caracteres)
 */
export function getInitials(name?: string | null): string {
  if (!name) return "?";
  
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) return "?";
  
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Formatea una fecha con formato inteligente basado en su cercanía al presente
 * @param date Fecha a formatear
 * @param includeTime Indica si incluir la hora en el formato
 * @returns Texto formateado de la fecha
 */
export function formatDate(date: Date | string | number, includeTime: boolean = false): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Si la fecha es hoy
  if (isToday(dateObj)) {
    return includeTime 
      ? `Hoy a las ${format(dateObj, 'HH:mm')}`
      : 'Hoy';
  }
  
  // Si la fecha fue ayer
  if (isYesterday(dateObj)) {
    return includeTime 
      ? `Ayer a las ${format(dateObj, 'HH:mm')}`
      : 'Ayer';
  }
  
  // Si la fecha es menor a 7 días
  const daysDiff = Math.abs(
    (new Date().getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysDiff < 7) {
    return formatDistanceToNow(dateObj, { 
      addSuffix: true,
      locale: es 
    });
  }
  
  // Para el resto de fechas
  if (dateObj.getFullYear() === new Date().getFullYear()) {
    // Si es del año actual
    return includeTime
      ? format(dateObj, "d 'de' MMMM 'a las' HH:mm", { locale: es })
      : format(dateObj, "d 'de' MMMM", { locale: es });
  } else {
    // Si es de otro año
    return includeTime
      ? format(dateObj, "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })
      : format(dateObj, "d 'de' MMMM 'de' yyyy", { locale: es });
  }
}

/**
 * Formatea una fecha específicamente para notificaciones (formato corto)
 */
export function formatNotificationDate(date: Date | string | number): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Si es hoy, muestra la hora
  if (isToday(dateObj)) {
    return format(dateObj, 'HH:mm');
  }
  
  // Si es ayer
  if (isYesterday(dateObj)) {
    return 'ayer';
  }
  
  // Si es de la última semana
  const daysDiff = Math.abs(
    (new Date().getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysDiff < 7) {
    return formatDistanceToNow(dateObj, { 
      addSuffix: true,
      locale: es 
    });
  }
  
  // Para el resto de fechas, formato corto
  return format(dateObj, 'dd MMM', { locale: es });
}
