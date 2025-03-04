import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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
