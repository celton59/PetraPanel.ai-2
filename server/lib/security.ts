import { z } from 'zod';
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// Constantes de seguridad
export const SECURITY_CONSTANTS = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 64,
  PASSWORD_HASH_LENGTH: 64,
  SALT_LENGTH: 32,
  CSRF_TOKEN_LENGTH: 64,
  SESSION_EXPIRY: 30 * 24 * 60 * 60 * 1000, // 30 días
  FAILED_ATTEMPTS_THRESHOLD: 10, // Aumentado para entorno de desarrollo
  LOCKOUT_TIME: 5 * 60 * 1000, // Reducido a 5 minutos para facilitar las pruebas
};

// Mapa para seguir los intentos fallidos
interface FailedAttempt {
  count: number;
  lastAttempt: number;
  lockedUntil?: number;
}

// Utilizamos un mapa en memoria para almacenar intentos fallidos
// En producción, esto debería estar en Redis o similar para manejar múltiples instancias
const failedLoginAttempts = new Map<string, FailedAttempt>();

// Limpiar todos los bloqueos (solo para desarrollo)
if (process.env.NODE_ENV !== 'production') {
  console.log("🔓 Limpiando todos los bloqueos de cuentas (modo desarrollo)");
  failedLoginAttempts.clear();
}

/**
 * Verifica si una cuenta está bloqueada debido a múltiples intentos fallidos
 * @param identifier Identificador único del usuario (username o email)
 * @returns Objeto con estado de bloqueo y tiempo restante
 */
export function checkAccountLockout(identifier: string): { locked: boolean; remainingTime?: number } {
  const normalizedIdentifier = identifier.toLowerCase();
  const failedAttempt = failedLoginAttempts.get(normalizedIdentifier);
  
  if (!failedAttempt || !failedAttempt.lockedUntil) {
    return { locked: false };
  }
  
  const now = Date.now();
  if (failedAttempt.lockedUntil > now) {
    return { 
      locked: true, 
      remainingTime: Math.ceil((failedAttempt.lockedUntil - now) / 1000) // en segundos
    };
  }
  
  // Si el tiempo de bloqueo ha pasado, eliminamos el registro
  failedLoginAttempts.delete(normalizedIdentifier);
  return { locked: false };
}

/**
 * Registra un intento fallido de login
 * @param identifier Identificador único del usuario (username o email)
 * @returns Información sobre el estado actual de los intentos fallidos
 */
export function recordFailedLoginAttempt(identifier: string): { 
  attempts: number; 
  locked: boolean; 
  lockoutTime?: number 
} {
  const normalizedIdentifier = identifier.toLowerCase();
  const now = Date.now();
  
  let record = failedLoginAttempts.get(normalizedIdentifier) || { count: 0, lastAttempt: now };
  
  // Si el último intento fue hace más de 24 horas, restablecemos el contador
  if (now - record.lastAttempt > 24 * 60 * 60 * 1000) {
    record = { count: 0, lastAttempt: now };
  }
  
  record.count += 1;
  record.lastAttempt = now;
  
  // Si ha excedido el umbral, lo bloqueamos
  if (record.count >= SECURITY_CONSTANTS.FAILED_ATTEMPTS_THRESHOLD) {
    record.lockedUntil = now + SECURITY_CONSTANTS.LOCKOUT_TIME;
  }
  
  failedLoginAttempts.set(normalizedIdentifier, record);
  
  return {
    attempts: record.count,
    locked: !!record.lockedUntil,
    lockoutTime: record.lockedUntil
  };
}

/**
 * Restablece los intentos fallidos cuando el login es exitoso
 * @param identifier Identificador único del usuario (username o email)
 */
export function resetFailedLoginAttempts(identifier: string): void {
  const normalizedIdentifier = identifier.toLowerCase();
  failedLoginAttempts.delete(normalizedIdentifier);
}

/**
 * Esquema de validación reforzado para contraseñas
 * Verifica que la contraseña cumpla con requerimientos mínimos de seguridad:
 * - Longitud mínima y máxima
 * - Incluye mayúsculas y minúsculas
 * - Incluye al menos un número
 * - Incluye al menos un carácter especial
 */
export const strongPasswordSchema = z.string()
  .min(SECURITY_CONSTANTS.PASSWORD_MIN_LENGTH, 
    `La contraseña debe tener al menos ${SECURITY_CONSTANTS.PASSWORD_MIN_LENGTH} caracteres`)
  .max(SECURITY_CONSTANTS.PASSWORD_MAX_LENGTH, 
    `La contraseña debe tener como máximo ${SECURITY_CONSTANTS.PASSWORD_MAX_LENGTH} caracteres`)
  .refine(
    (password) => /[A-Z]/.test(password),
    "La contraseña debe incluir al menos una letra mayúscula"
  )
  .refine(
    (password) => /[a-z]/.test(password),
    "La contraseña debe incluir al menos una letra minúscula"
  )
  .refine(
    (password) => /[0-9]/.test(password),
    "La contraseña debe incluir al menos un número"
  )
  .refine(
    (password) => /[^A-Za-z0-9]/.test(password),
    "La contraseña debe incluir al menos un carácter especial"
  );

/**
 * Versión mejorada de las utilidades de contraseña con más funciones de seguridad
 */
export const securityUtils = {
  /**
   * Genera un hash seguro para una contraseña con un salt aleatorio
   * @param password Contraseña en texto plano
   * @returns Hash.salt para almacenar en la base de datos
   */
  hashPassword: async (password: string): Promise<string> => {
    const salt = randomBytes(SECURITY_CONSTANTS.SALT_LENGTH).toString("hex");
    const buf = (await scryptAsync(password, salt, SECURITY_CONSTANTS.PASSWORD_HASH_LENGTH)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  },
  
  /**
   * Compara una contraseña en texto plano con un hash almacenado
   * @param suppliedPassword Contraseña proporcionada por el usuario
   * @param storedPassword Hash.salt almacenado en la base de datos
   * @returns true si la contraseña coincide, false en caso contrario
   */
  comparePassword: async (suppliedPassword: string, storedPassword: string): Promise<boolean> => {
    try {
      // Verificar que tenemos un formato válido de contraseña almacenada
      if (!storedPassword || !storedPassword.includes(".")) {
        console.error("Formato de contraseña almacenada inválido:", 
                     storedPassword ? "Sin separador '.'" : "Contraseña vacía");
        return false;
      }
      
      const [hashedPassword, salt] = storedPassword.split(".");
      
      // Verificaciones adicionales
      if (!hashedPassword || !salt) {
        console.error("Componentes de contraseña inválidos:", 
                     !hashedPassword ? "Hash vacío" : "Salt vacío");
        return false;
      }
      
      // Modo diagnóstico para desarrollo
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Comparando contraseña: '${suppliedPassword}'`);
        console.log(`Con hash almacenado: '${hashedPassword.substring(0, 10)}...' y salt: '${salt.substring(0, 10)}...'`);
      }
      
      const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
      const suppliedPasswordBuf = (await scryptAsync(
        suppliedPassword,
        salt,
        SECURITY_CONSTANTS.PASSWORD_HASH_LENGTH,
      )) as Buffer;
      
      // Comparación segura contra timing attacks
      const isMatch = timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Resultado de la comparación: ${isMatch ? 'Coincide ✓' : 'No coincide ✗'}`);
      }
      
      return isMatch;
    } catch (error) {
      console.error("Error técnico al comparar contraseñas:", error);
      console.trace("Stack trace de error en comparación:");
      // Siempre devolvemos false en caso de error
      return false;
    }
  },
  
  /**
   * Genera un token CSRF seguro
   * @returns Token CSRF generado aleatoriamente
   */
  generateCSRFToken: (): string => {
    return randomBytes(SECURITY_CONSTANTS.CSRF_TOKEN_LENGTH).toString("hex");
  },
  
  /**
   * Evalúa la fortaleza de una contraseña con un sistema de puntuación
   * @param password Contraseña a evaluar
   * @returns Puntuación de 0 (muy débil) a 100 (muy fuerte) y retroalimentación
   */
  evaluatePasswordStrength: (password: string): { score: number; feedback: string[] } => {
    const feedback: string[] = [];
    let score = 0;
    
    // Longitud base - hasta 40 puntos
    const lengthScore = Math.min(password.length * 5, 40);
    score += lengthScore;
    
    // Verificar complejidad - hasta 60 puntos adicionales
    if (/[A-Z]/.test(password)) score += 10;
    if (/[a-z]/.test(password)) score += 10;
    if (/[0-9]/.test(password)) score += 10;
    if (/[^A-Za-z0-9]/.test(password)) score += 15;
    
    // Patrones y variedad
    const uniqueChars = new Set(password.split('')).size;
    const uniqueRatio = uniqueChars / password.length;
    score += Math.floor(uniqueRatio * 15); // Hasta 15 puntos por variedad
    
    // Retroalimentación basada en la puntuación
    if (score < 30) {
      feedback.push("La contraseña es muy débil");
    } else if (score < 50) {
      feedback.push("La contraseña es débil");
    } else if (score < 70) {
      feedback.push("La contraseña es moderadamente segura");
    } else if (score < 90) {
      feedback.push("La contraseña es fuerte");
    } else {
      feedback.push("La contraseña es muy fuerte");
    }
    
    // Retroalimentación específica
    if (password.length < 10) {
      feedback.push("Intenta usar una contraseña más larga");
    }
    if (!/[A-Z]/.test(password)) {
      feedback.push("Incluye letras mayúsculas para mayor seguridad");
    }
    if (!/[0-9]/.test(password)) {
      feedback.push("Incluye números para mayor seguridad");
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      feedback.push("Incluye caracteres especiales para mayor seguridad");
    }
    if (uniqueRatio < 0.5) {
      feedback.push("Evita repetir caracteres frecuentemente");
    }
    
    return {
      score: Math.min(score, 100), // Aseguramos que la puntuación no exceda 100
      feedback
    };
  }
};

/**
 * Middleware para protección contra CSRF
 * Esto debe usarse junto con un token CSRF en formularios y peticiones
 */
export function csrfProtection(req: any, res: any, next: any) {
  // Excluir métodos que no modifican datos
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  const csrfToken = req.headers['x-csrf-token'] || req.body?.csrfToken;
  const sessionToken = req.session?.csrfToken;
  
  if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
    return res.status(403).json({
      success: false,
      message: "Error de validación CSRF"
    });
  }
  
  next();
}