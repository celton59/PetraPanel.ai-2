import type { Request, Response } from "express";
import { eq, and, or, ilike, getTableColumns, count, desc, sql, inArray } from "drizzle-orm";
import {
  youtube_videos,
  youtube_channels
} from "@db/schema";
import { db } from "@db";
import { type Express } from "express";
import { youtubeService } from "server/services/youtubeService";
import { analyzeTitle, updateVideoAnalysisStatus, findSimilarTitles } from "server/services/vectorAnalysis";

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

  // Obtener parámetros para paginación y filtrado
  const { channelId, title } = req.query;
  const page = Number(req.query.page || '1');
  const limit = Number(req.query.limit || '20');
  const offset = (page - 1) * limit;
  
  try {
    // Construimos las condiciones de filtrado
    const conditions = [];
    
    if (channelId) {
      conditions.push(eq(youtube_videos.channelId, channelId as string));
    }
    
    // Búsqueda por título
    if (title) {
      // Búsqueda directa por título
      conditions.push(ilike(youtube_videos.title, `%${title}%`));
      console.log(`Buscando videos con título que contiene: ${title}`);
    }
    
    // Primero obtenemos el total de videos (para la paginación)
    const countQuery = db.select({ count: count() })
      .from(youtube_videos);
    
    // Aplicamos los filtros al contador si hay condiciones
    if (conditions.length > 0) {
      countQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }
    
    const [totalResult] = await countQuery.execute();
    const total = Number(totalResult?.count || 0);
    
    // Consulta principal para obtener los videos paginados
    const query = db.select()
      .from(youtube_videos)
      .orderBy(desc(youtube_videos.publishedAt))
      .limit(limit)
      .offset(offset);
      
    // Aplicamos los mismos filtros a la consulta principal
    if (conditions.length > 0) {
      query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }
    
    const result = await query.execute();

    console.log(`Encontrados ${total} videos en la base de datos (mostrando ${result.length} en página ${page})`);
    
    return res.status(200).json({
      videos: result,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
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
    // Usamos select() sin argumentos para evitar problemas con los nombres de columnas
    const result = await db.select()
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
      // 1. Primero obtener los videos relacionados para obtener sus IDs
      const videos = await trx.query.youtube_videos.findMany({
        where: eq(youtube_videos.channelId, channelId),
        columns: {
          videoId: true
        }
      });
      
      const videoIds = videos.map(v => v.videoId);
      
      // 2. Eliminar los ejemplos de entrenamiento de títulos asociados a estos videos
      if (videoIds.length > 0) {
        // Los ejemplos pueden estar basados en estos videos de YouTube
        await trx.execute(sql`
          DELETE FROM training_title_examples 
          WHERE youtube_video_id IN (${sql.join(videoIds, sql`,`)})
          OR title IN (SELECT title FROM youtube_videos WHERE video_id IN (${sql.join(videoIds, sql`,`)}))
        `);
      }
      
      // 3. Eliminar videos relacionados
      await trx.delete(youtube_videos)
        .where(eq(youtube_videos.channelId, channelId))
        .execute();

      // 4. Eliminar canal
      return await trx.delete(youtube_channels)
        .where(eq(youtube_channels.id, parseInt(channelId)))
        .execute();
    });
    
    console.log("Canal y sus datos asociados eliminados correctamente");
    return res.status(200).json({
      success: true,
      message: 'Canal, videos y ejemplos de entrenamiento relacionados eliminados correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar canal', error);
    return res.status(500).json({ 
      error: 'Error al eliminar canal y sus datos asociados',
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
    // También usamos select directo sin getTableColumns para evitar problemas con los nombres de columnas
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

// Función para analizar si un video es evergreen usando vectores
async function analyzeVideo(req: Request, res: Response): Promise<Response> {
  if (!req.user?.role || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para esta acción',
    });
  }

  const { videoId } = req.params;
  const videoIdNum = parseInt(videoId);
  
  try {
    console.log(`Iniciando análisis de evergreen para video ${videoId} usando vectores`);
    
    const video = await db.select()
      .from(youtube_videos)
      .where(eq(youtube_videos.id, videoIdNum))
      .limit(1)
      .execute();
    
    if (!video || video.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Video no encontrado' 
      });
    }
    
    const videoData = video[0];
    const title = videoData.title || '';
    
    // Usar el servicio de análisis vectorial para analizar el título
    console.log(`Analizando título: "${title}"`);
    const analysisResult = await analyzeTitle(title, videoIdNum);
    
    // Actualizar estado del análisis en la base de datos
    await updateVideoAnalysisStatus(videoIdNum, true, analysisResult);
    
    // Buscar títulos similares
    const similarTitles = await findSimilarTitles(title, 5);
    
    console.log(`Análisis completado para video ${videoId}: Evergreen: ${analysisResult.isEvergreen}, Confianza: ${analysisResult.confidence}`);
    
    return res.status(200).json({
      success: true,
      data: {
        videoId: videoIdNum,
        title: videoData.title,
        isEvergreen: analysisResult.isEvergreen,
        confidence: analysisResult.confidence,
        reason: analysisResult.reason,
        similarTitles: similarTitles.map(st => ({
          videoId: st.videoId,
          title: st.title,
          similarity: st.similarity,
          isEvergreen: st.isEvergreen
        }))
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

// Función para obtener estadísticas de videos
async function getVideoStats(req: Request, res: Response): Promise<Response> {
  if (!req.user?.role || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para obtener estadísticas',
    });
  }
  
  try {
    // Consulta para obtener el total de vistas
    const [viewsResult] = await db.select({
      totalViews: sql`SUM(view_count)`.mapWith(Number),
    })
    .from(youtube_videos)
    .execute();
    
    // Consulta para obtener el total de likes
    const [likesResult] = await db.select({
      totalLikes: sql`SUM(like_count)`.mapWith(Number),
    })
    .from(youtube_videos)
    .execute();
    
    return res.status(200).json({
      totalViews: viewsResult?.totalViews || 0,
      totalLikes: likesResult?.totalLikes || 0
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de videos', error);
    return res.status(500).json({ 
      error: 'Error al obtener estadísticas de videos',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

import { getSuggestions } from './titulinSuggestionsController';

// Función para obtener canales para ejemplos de entrenamiento (sin restricción de rol)
async function getChannelsForTraining(req: Request, res: Response): Promise<Response> {
  try {
    // Obtener lista simplificada de canales para selector
    const result = await db.select({
      id: youtube_channels.id,
      channelId: youtube_channels.channelId,
      name: youtube_channels.name,
      thumbnailUrl: youtube_channels.thumbnailUrl
    })
    .from(youtube_channels)
    .where(eq(youtube_channels.active, true))
    .execute();

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error al obtener canales para training examples:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error al obtener canales',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

export function setUpTitulinRoutes (app: Express) {
  app.post('/api/titulin/channels', addChannel)
  app.get('/api/titulin/channels', getChannels)
  app.delete('/api/titulin/channels/:channelId', deleteChannel)
  app.get('/api/titulin/videos', getVideos)
  app.get('/api/titulin/videos/stats', getVideoStats)
  
  // Nuevas rutas
  app.post('/api/titulin/channels/:channelId/sync', syncChannelVideos)
  app.post('/api/titulin/videos/:videoId/sent-to-optimize', markVideoAsSent)
  app.post('/api/titulin/videos/:videoId/analyze', analyzeVideo)
  
  // Ruta para limpieza de datos huérfanos
  app.post('/api/titulin/cleanup/orphaned-videos', async (req, res) => {
    if (!req.user?.role || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para esta acción',
      });
    }
    
    try {
      // 1. Identificar videos huérfanos (videos cuyo channelId no existe en la tabla de canales)
      const orphanedVideosQuery = await db.execute(sql`
        SELECT y.id, y.video_id, y.title
        FROM youtube_videos y
        LEFT JOIN youtube_channels c ON y.channel_id = c.channel_id
        WHERE c.channel_id IS NULL
        LIMIT 1000
      `);
      
      // Extraer los resultados según el formato de la respuesta
      const orphanedVideos = Array.isArray(orphanedVideosQuery) ? orphanedVideosQuery : 
                           (orphanedVideosQuery.rows ? orphanedVideosQuery.rows : []);
      
      if (orphanedVideos.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'No se encontraron videos huérfanos',
          videosDeleted: 0
        });
      }
      
      // Obtener IDs para eliminar
      const videoIds = orphanedVideos.map((v: any) => v.id);
      const videoIdsYouTube = orphanedVideos.map((v: any) => v.video_id);
      
      // 2. Eliminar ejemplos de entrenamiento relacionados con estos videos
      await db.transaction(async (trx) => {
        // Eliminar primero los ejemplos de entrenamiento basados en estos videos
        if (videoIdsYouTube.length > 0) {
          await trx.execute(sql`
            DELETE FROM training_title_examples 
            WHERE youtube_video_id IN (${sql.join(videoIdsYouTube, sql`,`)})
            OR title IN (SELECT title FROM youtube_videos WHERE id IN (${sql.join(videoIds, sql`,`)}))
          `);
        }
        
        // Luego eliminar los videos huérfanos usando SQL directo
        await trx.execute(sql`
          DELETE FROM youtube_videos
          WHERE id IN (${sql.join(videoIds, sql`,`)})
        `);
      });
      
      return res.status(200).json({
        success: true,
        message: `Se eliminaron ${orphanedVideos.length} videos huérfanos y sus ejemplos de entrenamiento asociados`,
        videosDeleted: orphanedVideos.length,
        videosSample: orphanedVideos.slice(0, 10).map((v: any) => ({ id: v.id, title: v.title }))
      });
    } catch (error) {
      console.error('Error al eliminar videos huérfanos:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al eliminar videos huérfanos',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  })
  
  // API de sugerencias para autocompletado
  app.get('/api/titulin/suggestions', getSuggestions)
  
  // Endpoint público para obtener canales (para ejemplos de entrenamiento)
  app.get('/api/titulin/channels/for-training', getChannelsForTraining)
  
  // Nueva ruta para búsqueda de títulos similares
  app.get('/api/titulin/videos/:videoId/similar', async (req, res) => {
    if (!req.user?.role || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para esta acción',
      });
    }
    
    const { videoId } = req.params;
    const limit = Number(req.query.limit || '5');
    
    try {
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
      
      const title = video[0].title || '';
      const similarTitles = await findSimilarTitles(title, limit);
      
      return res.status(200).json({
        success: true,
        data: {
          videoId: parseInt(videoId),
          title: title,
          similarTitles: similarTitles
        }
      });
    } catch (error) {
      console.error(`Error al buscar títulos similares para ${videoId}:`, error);
      return res.status(500).json({ 
        success: false,
        message: 'Error al buscar títulos similares',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  });
  

}