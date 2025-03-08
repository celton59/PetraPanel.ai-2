import { z } from 'zod';
import { strongPasswordSchema } from './security';

/**
 * Regex comunes para validación
 */
const VALIDATION_REGEX = {
  // Valida nombres de usuario alfanuméricos con guiones y guiones bajos
  USERNAME: /^[a-zA-Z0-9_-]{3,30}$/,
  // Valida nombres completos con espacios y caracteres acentuados comunes
  FULLNAME: /^[\p{L}\p{M}' ]{2,50}$/u,
  // Valida teléfonos internacionales con +, espacios y guiones
  PHONE: /^(\+?\d{1,3}[- ]?)?\d{6,14}$/,
  // Valida emails siguiendo el estándar RFC 5322
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  // Valida URLs
  URL: /^https?:\/\/[\w\-]+(\.[\w\-]+)+[/#?]?.*$/,
  // Valida formato de contraseña con al menos una minúscula, una mayúscula, un número y un carácter especial
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,64}$/,
};

/**
 * Esquema de validación para login
 */
export const loginSchema = z.object({
  username: z.string().min(1, "El nombre de usuario es obligatorio"),
  password: z.string().min(1, "La contraseña es obligatoria")
});

/**
 * Esquema de validación para cambio de contraseña
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es obligatoria"),
  newPassword: z.string().min(1, "La nueva contraseña es obligatoria")
});

/**
 * Esquema de validación para perfil de usuario - creación
 */
export const createProfileSchema = z.object({
  username: z.string()
    .min(3, "El nombre de usuario debe tener al menos 3 caracteres")
    .max(30, "El nombre de usuario debe tener como máximo 30 caracteres")
    .regex(VALIDATION_REGEX.USERNAME, "El nombre de usuario solo puede contener letras, números, guiones y guiones bajos"),
  email: z.string()
    .email("El correo electrónico no es válido")
    .regex(VALIDATION_REGEX.EMAIL, "El formato del correo electrónico no es válido"),
  password: strongPasswordSchema,
  fullName: z.string()
    .min(2, "El nombre completo debe tener al menos 2 caracteres")
    .max(50, "El nombre completo debe tener como máximo 50 caracteres")
    .regex(VALIDATION_REGEX.FULLNAME, "El nombre completo contiene caracteres no permitidos"),
  phone: z.string()
    .regex(VALIDATION_REGEX.PHONE, "El número de teléfono no tiene un formato válido")
    .optional()
    .nullable(),
  bio: z.string()
    .max(500, "La biografía no puede exceder los 500 caracteres")
    .optional()
    .nullable(),
  role: z.enum(["admin", "reviewer", "content_reviewer", "media_reviewer", "optimizer", "youtuber"], {
    errorMap: () => ({ message: "El rol seleccionado no es válido" })
  })
});

/**
 * Esquema de validación para perfil de usuario - actualización
 */
export const updateProfileSchema = z.object({
  username: z.string()
    .min(3, "El nombre de usuario debe tener al menos 3 caracteres")
    .max(30, "El nombre de usuario debe tener como máximo 30 caracteres")
    .regex(VALIDATION_REGEX.USERNAME, "El nombre de usuario solo puede contener letras, números, guiones y guiones bajos")
    .optional(),
  email: z.string()
    .email("El correo electrónico no es válido")
    .regex(VALIDATION_REGEX.EMAIL, "El formato del correo electrónico no es válido")
    .optional(),
  fullName: z.string()
    .min(2, "El nombre completo debe tener al menos 2 caracteres")
    .max(50, "El nombre completo debe tener como máximo 50 caracteres")
    .regex(VALIDATION_REGEX.FULLNAME, "El nombre completo contiene caracteres no permitidos")
    .optional(),
  phone: z.string()
    .regex(VALIDATION_REGEX.PHONE, "El número de teléfono no tiene un formato válido")
    .optional()
    .nullable(),
  bio: z.string()
    .max(500, "La biografía no puede exceder los 500 caracteres")
    .optional()
    .nullable(),
  role: z.enum(["admin", "reviewer", "content_reviewer", "media_reviewer", "optimizer", "youtuber"], {
    errorMap: () => ({ message: "El rol seleccionado no es válido" })
  }).optional()
});

/**
 * Esquema de validación para creación de videos
 */
export const createVideoSchema = z.object({
  title: z.string()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(100, "El título debe tener como máximo 100 caracteres"),
  description: z.string()
    .max(5000, "La descripción debe tener como máximo 5000 caracteres")
    .optional()
    .nullable(),
  projectId: z.number({
    required_error: "El proyecto es obligatorio",
    invalid_type_error: "El ID del proyecto debe ser un número"
  }),
  tags: z.string()
    .max(200, "Las etiquetas no pueden exceder los 200 caracteres")
    .optional()
    .nullable(),
  seriesNumber: z.string()
    .max(20, "El número de serie no puede exceder los 20 caracteres")
    .optional()
    .nullable()
});

/**
 * Esquema de validación para actualización de videos
 */
export const updateVideoSchema = z.object({
  title: z.string()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(100, "El título debe tener como máximo 100 caracteres")
    .optional(),
  description: z.string()
    .max(5000, "La descripción debe tener como máximo 5000 caracteres")
    .optional()
    .nullable(),
  projectId: z.number({
    invalid_type_error: "El ID del proyecto debe ser un número"
  }).optional(),
  tags: z.string()
    .max(200, "Las etiquetas no pueden exceder los 200 caracteres")
    .optional()
    .nullable(),
  seriesNumber: z.string()
    .max(20, "El número de serie no puede exceder los 20 caracteres")
    .optional()
    .nullable(),
  status: z.enum(['available', 'content_corrections', 'content_review', 'upload_media', 'media_corrections', 'media_review', 'final_review', 'completed'], {
    errorMap: () => ({ message: "El estado seleccionado no es válido" })
  }).optional(),
  
  // Campos para optimización de contenido
  optimizedTitle: z.string()
    .min(3, "El título optimizado debe tener al menos 3 caracteres")
    .max(100, "El título optimizado debe tener como máximo 100 caracteres")
    .optional()
    .nullable(),
  optimizedDescription: z.string()
    .max(5000, "La descripción optimizada debe tener como máximo 5000 caracteres")
    .optional()
    .nullable(),
  
  // Campos para revisión de contenido
  contentReviewComments: z.array(z.string())
    .optional()
    .nullable(),
  
  // Campos para carga de medios
  videoUrl: z.string()
    .url("La URL del video no es válida")
    .optional()
    .nullable(),
  thumbnailUrl: z.string()
    .url("La URL de la miniatura no es válida")
    .optional()
    .nullable(),
  
  // Campos para revisión de medios
  mediaReviewComments: z.array(z.string())
    .optional()
    .nullable(),
  mediaVideoNeedsCorrection: z.boolean()
    .optional(),
  mediaThumbnailNeedsCorrection: z.boolean()
    .optional(),
  
  // Campos para publicación
  youtubeUrl: z.string()
    .url("La URL de YouTube no es válida")
    .optional()
    .nullable(),
  publishedAt: z.string()
    .datetime({ offset: true })
    .optional()
    .nullable()
});

/**
 * Función de utilidad para validar datos con un esquema Zod
 * @param schema Esquema Zod para validación
 * @param data Datos a validar
 * @returns Objeto con resultado de validación
 */
export function validateWithSchema<T>(schema: z.ZodType<T>, data: unknown): {
  success: boolean;
  data?: T;
  error?: { message: string; path?: string[] };
} {
  try {
    const validatedData = schema.parse(data);
    return {
      success: true,
      data: validatedData
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Extraer el primer error para una respuesta más clara
      const firstError = error.errors[0];
      return {
        success: false,
        error: {
          message: firstError.message,
          path: firstError.path
        }
      };
    }
    // Error desconocido
    return {
      success: false,
      error: {
        message: 'Error de validación desconocido'
      }
    };
  }
}

/**
 * Middleware para validar cuerpos de peticiones con un esquema Zod
 * @param schema Esquema Zod para validación
 * @returns Middleware de Express
 */
export function validateBody<T>(schema: z.ZodType<T>) {
  return (req: any, res: any, next: any) => {
    const validation = validateWithSchema(schema, req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error?.message || 'Error de validación',
        path: validation.error?.path
      });
    }
    
    // Si la validación es exitosa, colocamos los datos validados en req.validatedData
    req.validatedData = validation.data;
    next();
  };
}

/**
 * Middleware para validar parámetros de URL con un esquema Zod
 * @param schema Esquema Zod para validación
 * @returns Middleware de Express
 */
export function validateParams<T>(schema: z.ZodType<T>) {
  return (req: any, res: any, next: any) => {
    const validation = validateWithSchema(schema, req.params);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error?.message || 'Error de validación en parámetros',
        path: validation.error?.path
      });
    }
    
    // Si la validación es exitosa, colocamos los datos validados en req.validatedParams
    req.validatedParams = validation.data;
    next();
  };
}

/**
 * Middleware para validar parámetros de consulta con un esquema Zod
 * @param schema Esquema Zod para validación
 * @returns Middleware de Express
 */
export function validateQuery<T>(schema: z.ZodType<T>) {
  return (req: any, res: any, next: any) => {
    const validation = validateWithSchema(schema, req.query);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error?.message || 'Error de validación en consulta',
        path: validation.error?.path
      });
    }
    
    // Si la validación es exitosa, colocamos los datos validados en req.validatedQuery
    req.validatedQuery = validation.data;
    next();
  };
}