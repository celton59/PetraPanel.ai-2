import { Request, Response } from "express";
import * as activityService from "../services/activityService";

export async function getUserActivity(req: Request, res: Response) {
  try {
    const timeRange = req.query.timeRange as string || "week";
    const [stats, sessions] = await Promise.all([
      activityService.getUserActivityStats(timeRange),
      activityService.getRecentSessions(timeRange)
    ]);

    res.json({ stats, sessions });
  } catch (error) {
    console.error("Error getting user activity:", error);
    res.status(500).json({ error: "Error al obtener la actividad de usuarios" });
  }
}

export async function startSession(req: Request, res: Response) {
  try {
    const { userId } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.headers["user-agent"] || "";

    const session = await activityService.startUserSession(userId, ipAddress, userAgent);
    res.json(session);
  } catch (error) {
    console.error("Error starting session:", error);
    res.status(500).json({ error: "Error al iniciar la sesión" });
  }
}

export async function endSession(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    await activityService.endUserSession(parseInt(sessionId));
    res.json({ success: true });
  } catch (error) {
    console.error("Error ending session:", error);
    res.status(500).json({ error: "Error al finalizar la sesión" });
  }
}

export async function updateActivity(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    await activityService.updateLastActivity(parseInt(sessionId));
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating activity:", error);
    res.status(500).json({ error: "Error al actualizar la actividad" });
  }
}
