import type { NextFunction, Request, Response } from "express";
import { type Express } from "express";
import { getAllMonthlyLimits, getYoutuberVideoLimits, setMonthlyLimit } from "server/utils/youtuber-utils";


export async function getVideoLimits(req: Request, res: Response): Promise<Response> {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "No autenticado"
      });
    }


    // Permitir consultas con userId cuando el usuario es admin o está consultando sus propios datos
    let userId: number;


    if (req.query.userId) {
      // Si se proporciona un userId en la consulta, verificar que el usuario sea admin
      if (req.user.role === 'admin') {
        userId = Number(req.query.userId);
      } else if (req.user.id === Number(req.query.userId)) {
        // O que esté consultando sus propios datos
        userId = req.user.id;
      } else {
        return res.status(403).json({
          message: "No tienes permisos para consultar datos de otros usuarios"
        });
      }
    } else {
      // Si no se proporciona userId, usar el ID del usuario autenticado
      userId = req.user.id as number;


      // Si no es youtuber y no proporcionó un ID específico, error
      if (req.user.role !== 'youtuber' && req.user.role !== 'admin') {
        return res.status(403).json({
          message: "Esta información solo está disponible para usuarios con rol youtuber o admin"
        });
      }
    }


    console.log(`Consultando límites para usuario ID: ${userId}, por usuario ${req.user.username} (${req.user.role})`);


    // Usar la nueva función que incluye tanto los límites de asignación como los mensuales
    const allLimits = await getYoutuberVideoLimits(userId);


    // Respuesta completa para incluir información de límites específicos por mes
    const responseData = {
      currentAssignedCount: allLimits.currentAssignedCount,
      maxAssignedAllowed: allLimits.maxAssignedAllowed,
      currentMonthlyCount: allLimits.currentMonthCount,
      monthlyLimit: allLimits.monthlyLimit,
      canTakeMore: allLimits.canTakeMoreVideos,
      reachedMonthlyLimit: allLimits.reachedMonthlyLimit,
      // Nueva información para gestión de límites específicos
      specificMonthlyLimit: allLimits.specificMonthlyLimit || false,
      monthlyLimits: allLimits.monthlyLimits || []
    };


    console.log("Enviando respuesta:", JSON.stringify(responseData));
    return res.json(responseData);
  } catch (error) {
    console.error("Error obteniendo límites de videos:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener información de límites de videos"
    });
  }
}

export async function setYoutuberMonthlyLimit(req: Request, res: Response): Promise<Response> {
  try {
    // Verificar que el usuario es administrador
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Solo los administradores pueden establecer límites mensuales específicos"
      });
    }


    // Validar datos requeridos
    const { userId, year, month, maxVideos } = req.body;


    if (!userId || !maxVideos || maxVideos < 0) {
      return res.status(400).json({
        success: false,
        message: "Datos incompletos o inválidos. Se requiere userId y maxVideos"
      });
    }


    // Valores por defecto para año y mes (mes actual si no se especifican)
    const targetYear = year || new Date().getFullYear();
    const targetMonth = month || (new Date().getMonth() + 1);


    console.log(`Estableciendo límite mensual para usuario ${userId}: ${maxVideos} videos para ${targetMonth}/${targetYear}`);


    // Establecer el límite mensual
    const result = await setMonthlyLimit(
      userId,
      maxVideos,
      targetYear,
      targetMonth,
      req.user.id // ID del administrador que establece el límite
    );


    if (result) {
      return res.json({
        success: true,
        message: `Límite mensual establecido correctamente: ${maxVideos} videos para ${targetMonth}/${targetYear}`
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Error al establecer límite mensual"
      });
    }
  } catch (error) {
    console.error("Error estableciendo límite mensual:", error);
    return res.status(500).json({
      success: false,
      message: "Error al establecer límite mensual específico"
    });
  }
}

export async function getUserMonthlyLimits(req: Request, res: Response): Promise<Response> {
  try {
    // Verificar permisos: solo el propio usuario (youtuber) o administradores pueden consultar
    const userId = parseInt(req.params.userId);


    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "ID de usuario no especificado"
      });
    }


    if (req.user?.id !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "No tienes permiso para consultar los límites de este usuario"
      });
    }


    const limits = await getAllMonthlyLimits(userId);


    return res.json({
      success: true,
      data: limits
    });
  } catch (error) {
    console.error("Error obteniendo límites mensuales:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener límites mensuales específicos"
    });
  }
}

export function setUpYoutuberRoutes (requireAuth: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined, app: Express) {
  // Ruta para obtener información sobre el límite de videos para youtuber
  app.get("/api/youtuber/video-limits", requireAuth, getVideoLimits);

  // Endpoint para establecer límite mensual específico para un youtuber
  app.post("/api/youtuber/monthly-limit", requireAuth, setYoutuberMonthlyLimit);


  // Endpoint para obtener todos los límites mensuales específicos de un youtuber
  app.get("/api/youtuber/monthly-limits/:userId", requireAuth, getUserMonthlyLimits);
}
