import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Genera iniciales a partir de un nombre completo
 * @param name Nombre completo para generar iniciales
 * @returns Iniciales (máximo 2 caracteres)
 */
export function getInitials(name?: string | null): string {
  if (!name) return "?";
  
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Formatea una fecha con formato inteligente basado en su cercanía al presente
 * @param date Fecha a formatear
 * @param includeTime Indica si incluir la hora en el formato
 * @returns Texto formateado de la fecha
 */
export function formatDate(date: Date | string | number | null, includeTime: boolean = false): string {
  if (!date) return "";
  
  const dateObj = new Date(date);
  
  if (isToday(dateObj)) {
    return includeTime 
      ? `Hoy a las ${format(dateObj, "HH:mm")}`
      : "Hoy";
  }
  
  if (isYesterday(dateObj)) {
    return includeTime 
      ? `Ayer a las ${format(dateObj, "HH:mm")}`
      : "Ayer";
  }
  
  // Si es menos de 7 días, mostramos "hace X días"
  if (new Date().getTime() - dateObj.getTime() < 7 * 24 * 60 * 60 * 1000) {
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: es });
  }
  
  // Para fechas más antiguas, formato completo
  return includeTime
    ? format(dateObj, "d MMM yyyy, HH:mm", { locale: es })
    : format(dateObj, "d MMM yyyy", { locale: es });
}

/**
 * Formatea una fecha específicamente para notificaciones (formato corto)
 */
export function formatNotificationDate(date: Date | string | number | null): string {
  if (!date) return "";
  
  const dateObj = new Date(date);
  
  if (isToday(dateObj)) {
    return format(dateObj, "HH:mm");
  }
  
  if (isYesterday(dateObj)) {
    return "Ayer";
  }
  
  // Si es menos de 7 días, mostramos el día
  if (new Date().getTime() - dateObj.getTime() < 7 * 24 * 60 * 60 * 1000) {
    return format(dateObj, "EEE", { locale: es });
  }
  
  // Para fechas más antiguas, formato corto
  return format(dateObj, "d MMM", { locale: es });
}