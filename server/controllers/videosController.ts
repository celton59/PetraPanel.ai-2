import { db } from "@db/index";
import { 
  videos, 
  projects, 
  users, 
  projectAccess 
} from "@db/schema";
import { 
  eq, 
  and, 
  inArray,
  desc,
  sql,
  or,
  ilike,
  gte,
  lte
} from "drizzle-orm";

import { VideoStatus } from "@db/schema";
import { Request, Response } from "express";


export async function getVideos(req: Request, res: Response): Promise<Response> {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const user = req.user;

    // Parámetros de paginación
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

    // Construir la consulta base para el recuento total
    let countQuery = db.select({
      count: sql`count(*)`.mapWith(Number)
    }).from(videos);

    // Construir la consulta principal con paginación
    let videosQuery = db.select()
      .from(videos)
      .orderBy(desc(videos.updatedAt))
      .limit(limit)
      .offset(offset);

    // Aplicar filtros si existen
    const status = req.query.status as string;
    const projectId = req.query.projectId as string;
    const searchTerm = req.query.searchTerm as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const conditions = [];

    if (status && status !== 'all') {
      conditions.push(eq(videos.status, status as VideoStatus));
    }

    if (projectId && projectId !== 'all') {
      conditions.push(eq(videos.projectId, parseInt(projectId)));
    }

    if (searchTerm) {
      conditions.push(or(
        ilike(videos.title, `%${searchTerm}%`),
        ilike(videos.description, `%${searchTerm}%`)
      ));
    }

    if (startDate) {
      conditions.push(gte(videos.createdAt, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(videos.createdAt, new Date(endDate)));
    }

    // If user is not admin, only show videos they have access to based on role
    if (user.role !== "admin") {
      const projectAccessQuery = db.select()
        .from(projectAccess)
        .where(eq(projectAccess.userId, user.id));

      const projectAccesses = await projectAccessQuery;
      const projectIds = projectAccesses.map(access => access.projectId);

      if (projectIds.length > 0) {
        conditions.push(inArray(videos.projectId, projectIds));
      } else {
        // If user has no project access, don't show any videos
        return res.status(200).json({
          videos: [],
          pagination: {
            page,
            limit,
            totalVideos: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false
          }
        });
      }
    }

    // Aplicar condiciones a las consultas si existen
    if (conditions.length > 0) {
      const whereCondition = and(...conditions);
      videosQuery = videosQuery.where(whereCondition);
      countQuery = countQuery.where(whereCondition);
    }

    // Ejecutar la consulta de conteo
    const [countResult] = await countQuery;
    const totalVideos = countResult?.count || 0;

    // Ejecutar la consulta principal
    const videosResult = await videosQuery.execute();

    // Calcular metadata de paginación
    const totalPages = Math.ceil(totalVideos / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return res.status(200).json({
      videos: videosResult,
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
    console.error("Error getting videos:", error);
    return res.status(500).json({ error: "Server error" });
  }
}