import type { Request, Response } from "express";
import {  db } from "@/db";
import { videos } from "@/db/schema";
import { getTableColumns, eq, desc, sql } from "drizzle-orm";

async function getVideos(req: Request, res: Response) {

  try {
    // Parámetros de paginación (obligatorios)
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Validar parámetros de paginación
    if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
      return res.status(400).json({
        success: false,
        message: "Los parámetros de paginación son inválidos. 'page' y 'limit' son requeridos y deben ser números positivos."
      });
    }

    // Calcular el offset
    const offset = (page - 1) * limit;

    // Consulta para obtener el total de videos (para metadata de paginación)
    const [countResult] = await db.select({
      count: sql`count(*)`.mapWith(Number)
    }).from(videos);

    const totalVideos = countResult?.count || 0;

    // Consulta principal con paginación
    const videosData = await db.select({
        ...getTableColumns(videos),
      })
      .from(videos)
      .orderBy(desc(videos.updatedAt))
      .limit(limit)
      .offset(offset)
      .execute();

    // Calcular metadata de paginación
    const totalPages = Math.ceil(totalVideos / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return res.status(200).json({
      videos: videosData,
      pagination: {
        page,
        limit,
        totalVideos,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Error al obtener videos', error);
    return res.status(500).json({ 
      error: 'Error al obtener videos',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}
export default getVideos;