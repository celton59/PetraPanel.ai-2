import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge Tailwind classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date string into a localized date-time format.
 * Example: "2023-01-15T10:30:00Z" -> "15 Jan 2023 10:30"
 * 
 * @param dateString The ISO date string to format
 * @param includeTime Whether to include time in the formatted string
 * @returns Formatted date string
 */
export function formatDate(dateString: string, includeTime: boolean = false): string {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '-';
    }
    
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      ...(includeTime && { hour: '2-digit', minute: '2-digit' })
    };
    
    return date.toLocaleDateString('es-ES', options);
  } catch (error) {
    console.error("Error formatting date:", error);
    return '-';
  }
}

/**
 * Truncates a string to a specified length and adds ellipsis if truncated
 * 
 * @param str The string to truncate
 * @param maxLength Maximum length of the resulting string
 * @returns Truncated string
 */
export function truncateString(str: string, maxLength: number): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  
  return str.substring(0, maxLength) + '...';
}

/**
 * Debounces a function call by a specified delay
 * 
 * @param fn The function to debounce
 * @param delay Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return function (...args: Parameters<T>): void {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Generates a random ID string
 * 
 * @param length Length of the ID to generate (default: 8)
 * @returns Random ID string
 */
export function generateId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Formats a number of bytes into a readable file size string
 * Example: 1024 -> "1 KB"
 * 
 * @param bytes Number of bytes
 * @param decimals Number of decimal places in the result
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}