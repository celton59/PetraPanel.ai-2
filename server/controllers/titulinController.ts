import type { Request, Response } from "express";
import { eq, and, getTableColumns } from "drizzle-orm";
import {
  youtube_videos,
  youtube_channels
} from "@db/schema";
import { db } from "@db";
import { type Express } from "express";
import { youtubeService } from "server/services/youtubeService";

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

  if (!req.user?.role || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para obtener videos',
    });
  }

  // Obtener channelId de los params
  const { channelId } = req.params;
  
  try {
    const result = await db.select({
        ...getTableColumns(youtube_videos)
      })
      .from(youtube_videos)
      .where(and(
        channelId ? eq(youtube_videos.channelId, channelId) : undefined,
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

  if (!req.user?.role || req.user.role !== 'admin') {
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
  console.log("CHANNEL ID", channelId)
  
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
    
    console.log("RESPONDIDO")
    return res.status(200)
  } catch (error) {
    console.error('Error al eliminar canal', error);
    return res.status(500).json({ 
      error: 'Error al eliminar canal',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

// Función para sincronizar videos de un canal
async function syncChannelVideos(req: Request, res: Response): Promise<Response> {
  if (!req.user?.role || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para sincronizar canales',
    });
  }

  // Obtener channelId del path
  const { channelId } = req.params;
  
  try {
    console.log(`Iniciando sincronización de canal ID: ${channelId}`);
    
    // Primero buscamos el canal en la base de datos
    const channel = await db.select()
      .from(youtube_channels)
      .where(eq(youtube_channels.id, parseInt(channelId)))
      .limit(1)
      .execute();
    
    if (!channel || channel.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Canal no encontrado' 
      });
    }
    
    // Obtenemos el ID de YouTube del canal
    const youtubeChannelId = channel[0].channelId;
    
    // Ejecutar sincronización
    const result = await youtubeService.updateChannelVideos(youtubeChannelId);
    
    return res.status(200).json({
      success: true,
      message: 'Sincronización completada con éxito',
      data: {
        ...result,
        channelId: parseInt(channelId),
        channelName: channel[0].name
      }
    });
  } catch (error) {
    console.error(`Error al sincronizar canal ${channelId}:`, error);
    return res.status(500).json({ 
      success: false,
      message: 'Error al sincronizar canal',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

// Función para marcar un video como enviado a optimización
async function markVideoAsSent(req: Request, res: Response): Promise<Response> {
  if (!req.user?.role || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para esta acción',
    });
  }

  const { videoId } = req.params;
  const { projectId } = req.body;
  
  try {
    await db.update(youtube_videos)
      .set({
        sentToOptimize: true,
        sentToOptimizeAt: new Date(),
        sentToOptimizeProjectId: projectId,
        updatedAt: new Date()
      })
      .where(eq(youtube_videos.id, parseInt(videoId)))
      .execute();
    
    return res.status(200).json({
      success: true,
      message: 'Video marcado como enviado a optimización'
    });
  } catch (error) {
    console.error(`Error al marcar video ${videoId} como enviado:`, error);
    return res.status(500).json({ 
      success: false,
      message: 'Error al marcar video como enviado',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

// Función para analizar si un video es evergreen
async function analyzeVideo(req: Request, res: Response): Promise<Response> {
  if (!req.user?.role || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para esta acción',
    });
  }

  const { videoId } = req.params;
  
  try {
    // Aquí iría la lógica para analizar si un video es evergreen
    // Por ahora usaremos un ejemplo simple basado en el título y la descripción
    
    const video = await db.select()
      .from(youtube_videos)
      .where(eq(youtube_videos.id, parseInt(videoId)))
      .limit(1)
      .execute();
    
    if (!video || video.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Video no encontrado' 
      });
    }
    
    const videoData = video[0];
    const title = videoData.title?.toLowerCase() || '';
    const description = videoData.description?.toLowerCase() || '';
    
    // Palabras clave que podrían indicar que un video es evergreen
    const evergreenKeywords = [
      'cómo', 'tutorial', 'guía', 'aprende', 'paso a paso',
      'principiantes', 'básico', 'fundamental', 'esencial',
      'completo', 'definitivo', 'masterclass'
    ];
    
    // Palabras que podrían indicar que un video NO es evergreen
    const nonEvergreenKeywords = [
      'actualización', 'noticias', 'novedades', 'tendencia',
      'nuevo lanzamiento', 'última versión', 'predicción',
      'próximamente', 'evento', 'temporada', 'edición limitada'
    ];
    
    // Contamos cuántas palabras clave evergreen aparecen
    let evergreenScore = 0;
    evergreenKeywords.forEach(keyword => {
      if (title.includes(keyword) || description.includes(keyword)) {
        evergreenScore += 1;
      }
    });
    
    // Contamos cuántas palabras clave NO evergreen aparecen
    let nonEvergreenScore = 0;
    nonEvergreenKeywords.forEach(keyword => {
      if (title.includes(keyword) || description.includes(keyword)) {
        nonEvergreenScore += 1;
      }
    });
    
    // Calculamos si es evergreen y la confianza
    const totalKeywords = evergreenKeywords.length + nonEvergreenKeywords.length;
    const isEvergreen = evergreenScore > nonEvergreenScore;
    const confidence = Math.min(
      0.95, 
      Math.max(0.5, (isEvergreen ? evergreenScore : nonEvergreenScore) / (totalKeywords / 2))
    );
    
    // Guardamos el análisis en la base de datos
    await db.update(youtube_videos)
      .set({
        analyzed: true,
        analysisData: JSON.stringify({
          isEvergreen: isEvergreen,
          confidence: confidence,
          reason: isEvergreen 
            ? `Este video contiene ${evergreenScore} palabras clave de contenido evergreen.`
            : `Este video contiene ${nonEvergreenScore} palabras clave de contenido temporal.`
        }),
        updatedAt: new Date()
      })
      .where(eq(youtube_videos.id, parseInt(videoId)))
      .execute();
    
    return res.status(200).json({
      success: true,
      message: 'Análisis completado',
      data: {
        videoId: parseInt(videoId),
        isEvergreen: isEvergreen,
        confidence: confidence
      }
    });
  } catch (error) {
    console.error(`Error al analizar video ${videoId}:`, error);
    return res.status(500).json({ 
      success: false,
      message: 'Error al analizar video',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

export function setUpTitulinRoutes (app: Express) {
  app.post('/api/titulin/channels', addChannel)
  app.get('/api/titulin/channels', getChannels)
  app.delete('/api/titulin/channels/:channelId', deleteChannel)
  app.get('/api/titulin/videos', getVideos)
  
  // Nuevas rutas
  app.post('/api/titulin/channels/:channelId/sync', syncChannelVideos)
  app.post('/api/titulin/videos/:videoId/sent-to-optimize', markVideoAsSent)
  app.post('/api/titulin/videos/:videoId/analyze', analyzeVideo)
}
