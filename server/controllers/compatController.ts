/**
 * Controlador para endpoints de compatibilidad
 * 
 * Este controlador proporciona endpoints alternativos para operaciones
 * que pueden tener problemas de permisos o compatibilidad en producción.
 */

import { Request, Response, NextFunction, Express } from "express";
import { updateUserLimits } from "../scripts/update_user_limits_script";
import { z } from "zod";

// Esquema de validación para actualización de límites
const updateLimitsSchema = z.object({
  userId: z.number().positive(),
  maxAssignedVideos: z.number().positive().optional(),
  maxMonthlyVideos: z.number().positive().optional()
}).refine(data => 
  data.maxAssignedVideos !== undefined || data.maxMonthlyVideos !== undefined, {
    message: "Debe proporcionar al menos un límite para actualizar"
  }
);

/**
 * Endpoint para actualizar límites de usuarios usando el script especializado
 * Esta es una alternativa compatible cuando otros métodos fallan por permisos
 */
export async function updateUserLimitsCompat(req: Request, res: Response) {
  try {
    console.log("[Compat] Intentando actualizar límites:", req.body);
    
    // Verificar permisos de administrador
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para realizar esta acción"
      });
    }
    
    // Validar datos de entrada
    const validationResult = updateLimitsSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false, 
        message: validationResult.error.message
      });
    }
    
    const { userId, maxAssignedVideos, maxMonthlyVideos } = validationResult.data;
    
    // Llamar a la función del script para actualizar límites
    const result = await updateUserLimits(userId, maxAssignedVideos, maxMonthlyVideos);
    
    if (!result.success) {
      return res.status(result.data ? 200 : 500).json(result);
    }
    
    return res.json(result);
  } catch (error) {
    console.error("[Compat] Error en actualización de límites:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Error en la actualización de límites"
    });
  }
}

/**
 * Configuración de rutas de compatibilidad
 */
export function setupCompatRoutes(
  app: Express,
  requireAuth: (req: Request, res: Response, next: NextFunction) => void
) {
  // Endpoint alternativo para actualizar límites de usuarios
  app.post("/api/compat/update-limits", requireAuth, updateUserLimitsCompat);
  
  console.log("[Compat] Rutas de compatibilidad configuradas");
}