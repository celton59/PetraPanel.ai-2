import type { Request, Response } from "express";
import { eq, and, getTableColumns } from "drizzle-orm";
import {
  youtube_videos,
  youtube_channels
} from "@db/schema";
import { db } from "@db";
import { type Express } from "express";
import { youtubeService } from "server/services/youtubeService";
import { aiService } from "server/services/aiService";

async function addChannel (req: Request, res: Response): Promise<Response> {

  if (!req.user?.role || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para agregar canales',
    });
  }
  
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL requerida' });
    }

    const channelInfo = await youtubeService.getChannelInfo(url);

    const [newChannel] = await db.insert(youtube_channels)
      .values({
        channelId: channelInfo.channelId!,
        name: channelInfo.name || 'Sin nombre',
        url: url,
        description: channelInfo.description || null,
        thumbnailUrl: channelInfo.thumbnailUrl || null,
        subscriberCount: channelInfo.subscriberCount || 0,
        videoCount: channelInfo.videoCount || 0,
        active: true,
        lastVideoFetch: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return res.json(newChannel);
  } catch (error) {
    console.error('Error adding channel:', error);
    return res.status(500).json({ 
      error: 'Error al añadir canal',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

async function getVideos (req: Request, res: Response): Promise<Response> {

  if (!req.user?.role || (req.user.role !== 'admin' && req.user.role !== 'curator')) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para obtener videos',
    });
  }

  // Obtener channelId de los query params
  const { channelId } = req.query;
  
  try {
    const result = await db.select({
        ...getTableColumns(youtube_videos)
      })
      .from(youtube_videos)
      .where(and(
        channelId ? eq(youtube_videos.channelId, channelId as string) : undefined,
      ))
      .execute()

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error al obtener youtube videos', error);
    return res.status(500).json({ 
      error: 'Error al obtener youtube videos',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

async function getChannels (req: Request, res: Response): Promise<Response> {

  if (!req.user?.role || (req.user.role !== 'admin' && req.user.role !== 'curator')) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para obtener canales',
    });
  }

  try {
    const result = await db.select({
        ...getTableColumns(youtube_channels)
      })
      .from(youtube_channels)
      .execute()

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error al obtener canales', error);
    return res.status(500).json({ 
      error: 'Error al obtener canales',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

async function deleteChannel (req: Request, res: Response): Promise<Response> {
  if (!req.user?.role || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para eliminar canales',
    });
  }

  // Obtener channelId del path
  const { channelId } = req.params;
  
  try {
    await db.transaction(async (trx) => {
      // Eliminar videos relacionados
      await trx.delete(youtube_videos)
        .where(eq(youtube_videos.channelId, channelId))
        .execute();

      // Eliminar canal
      return await trx.delete(youtube_channels)
        .where(eq(youtube_channels.id, parseInt(channelId)))
        .execute();
    });
    
    return res.status(200).json({ success: true, message: 'Canal eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar canal', error);
    return res.status(500).json({ 
      error: 'Error al eliminar canal',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

/**
 * Analiza un video de YouTube para determinar si es evergreen
 */
async function analyzeVideo(req: Request, res: Response): Promise<Response> {
  if (!req.user?.role || (req.user.role !== 'admin' && req.user.role !== 'curator')) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para analizar videos',
    });
  }

  // Obtener videoId del path
  const { videoId } = req.params;
  
  try {
    // Verificar si el video existe
    const video = await db.select()
      .from(youtube_videos)
      .where(eq(youtube_videos.id, parseInt(videoId)))
      .execute();

    if (!video || video.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Video no encontrado',
      });
    }

    // Determinar opciones de análisis (desde query params o cuerpo)
    const detailedAnalysis = req.query.detailed === 'true' || (req.body && req.body.detailed === true);
    
    // Ejecutar análisis
    const analysisResult = await aiService.analyzeEvergreenContent(parseInt(videoId), {
      detailedAnalysis,
    });

    return res.status(200).json({
      success: true,
      data: analysisResult,
    });
  } catch (error) {
    console.error('Error al analizar video:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Error al analizar video',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

/**
 * Obtiene información detallada de un video específico
 */
async function getVideoDetail(req: Request, res: Response): Promise<Response> {
  if (!req.user?.role || (req.user.role !== 'admin' && req.user.role !== 'curator')) {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para ver detalles de videos',
    });
  }

  // Obtener videoId del path
  const { videoId } = req.params;
  
  try {
    const video = await db.select()
      .from(youtube_videos)
      .where(eq(youtube_videos.id, parseInt(videoId)))
      .execute();

    if (!video || video.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Video no encontrado',
      });
    }

    return res.status(200).json({
      success: true,
      data: video[0],
    });
  } catch (error) {
    console.error('Error al obtener detalle del video:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Error al obtener detalle del video',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

/**
 * Actualiza los videos de un canal específico
 */
async function updateChannelVideos(req: Request, res: Response): Promise<Response> {
  if (!req.user?.role || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para actualizar videos de canales',
    });
  }

  // Obtener channelId del path
  const { channelId } = req.params;
  
  try {
    // Buscar el canal en la base de datos
    const channel = await db.select()
      .from(youtube_channels)
      .where(eq(youtube_channels.id, parseInt(channelId)))
      .execute();

    if (!channel || channel.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Canal no encontrado',
      });
    }

    // Actualizar videos del canal
    await youtubeService.updateChannelVideos(channel[0].channelId);

    // Actualizar fecha de última actualización
    await db.update(youtube_channels)
      .set({
        lastVideoFetch: new Date(),
        updatedAt: new Date()
      })
      .where(eq(youtube_channels.id, parseInt(channelId)))
      .execute();

    return res.status(200).json({
      success: true,
      message: 'Videos del canal actualizados correctamente',
    });
  } catch (error) {
    console.error('Error al actualizar videos del canal:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Error al actualizar videos del canal',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

export function setUpTitulinRoutes (app: Express) {
  // Rutas de canales
  app.post('/api/titulin/channels', addChannel);
  app.get('/api/titulin/channels', getChannels);
  app.delete('/api/titulin/channels/:channelId', deleteChannel);
  app.post('/api/titulin/channels/:channelId/update', updateChannelVideos);
  
  // Rutas de videos
  app.get('/api/titulin/videos', getVideos);
  app.get('/api/titulin/videos/:videoId', getVideoDetail);
  app.post('/api/titulin/videos/:videoId/analyze', analyzeVideo);
}
