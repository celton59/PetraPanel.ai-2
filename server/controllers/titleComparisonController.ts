import type { Request, Response } from "express";
import { eq, and, or, ilike, count, sql } from "drizzle-orm";
import { youtube_videos, youtube_channels } from "@db/schema";
import { db } from "@db";
import { youtubeService } from "server/services/youtubeService";
import { findSimilarTitles, generateEmbedding } from "server/services/vectorAnalysis";
import type { Express } from "express";

/**
 * Compara un título propuesto con los existentes para verificar similitudes
 * @param req Request con el título propuesto y opcionalmente un channelId
 * @param res Response con resultados de similitud
 */
export async function compareTitleWithExisting(req: Request, res: Response): Promise<Response> {
  try {
    const { proposedTitle, channelId } = req.body;
    
    if (!proposedTitle) {
      return res.status(400).json({ 
        success: false, 
        message: 'Se requiere un título para comparar' 
      });
    }
    
    // Buscar títulos similares en la base de datos
    const similarTitles = await findSimilarTitles(proposedTitle, 5);
    
    // Si se especificó un canal, verificar si el canal existe
    let channelExists = false;
    let channelVideos: Array<{
      id: number;
      videoId: string;
      title: string;
      publishedAt: Date | null;
      thumbnailUrl: string | null;
      viewCount: number | null;
      likeCount: number | null;
    }> = [];
    
    if (channelId) {
      const channel = await db.query.youtube_channels.findFirst({
        where: eq(youtube_channels.channelId, channelId),
      });
      
      channelExists = !!channel;
      
      if (channelExists) {
        // Obtener videos del canal
        const videos = await db.query.youtube_videos.findMany({
          where: eq(youtube_videos.channelId, channelId),
          orderBy: (youtube_videos, { desc }) => [desc(youtube_videos.published_at)],
          limit: 100,
        });
        
        // Preparar datos de videos para enviar al cliente
        channelVideos = videos.map(video => ({
          id: video.id,
          videoId: video.videoId,
          title: video.title,
          publishedAt: video.publishedAt,
          thumbnailUrl: video.thumbnailUrl,
          viewCount: video.viewCount,
          likeCount: video.likeCount
        }));
      }
    }
    
    return res.status(200).json({
      success: true,
      similarTitles,
      channelExists,
      channelVideos,
      proposedTitle
    });
  } catch (error) {
    console.error('Error comparando título:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al comparar el título propuesto con los existentes'
    });
  }
}

/**
 * Compara múltiples títulos propuestos con los existentes
 * @param req Request con array de títulos propuestos y opcionalmente un channelId
 * @param res Response con resultados de similitud para cada título
 */
export async function compareBulkTitles(req: Request, res: Response): Promise<Response> {
  try {
    const { proposedTitles, channelId } = req.body;
    
    if (!proposedTitles || !Array.isArray(proposedTitles) || proposedTitles.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Se requiere un array de títulos para comparar' 
      });
    }
    
    // Limitar a 20 títulos por solicitud para evitar sobrecarga
    const limitedTitles = proposedTitles.slice(0, 20);
    
    // Para cada título, buscar similitudes
    const results = await Promise.all(
      limitedTitles.map(async (title) => {
        const similarTitles = await findSimilarTitles(title, 3);
        
        // Calcular score de similitud promedio
        const avgSimilarity = similarTitles.length > 0
          ? similarTitles.reduce((sum, item) => sum + item.similarity, 0) / similarTitles.length
          : 0;
        
        return {
          proposedTitle: title,
          similarTitles,
          averageSimilarity: avgSimilarity,
          highestSimilarity: similarTitles.length > 0 
            ? Math.max(...similarTitles.map(item => item.similarity)) 
            : 0
        };
      })
    );
    
    // Si se especificó un canal, obtener información
    let channelInfo = null;
    
    if (channelId) {
      const channel = await db.query.youtube_channels.findFirst({
        where: eq(youtube_channels.channelId, channelId),
      });
      
      if (channel) {
        // Contar videos del canal de forma manual
        const videoCountResult = await db.execute(sql`
          SELECT COUNT(*) as count FROM youtube_videos WHERE channel_id = ${channelId}
        `);
        
        const videoCount = videoCountResult && Array.isArray(videoCountResult) && videoCountResult.length > 0
          ? parseInt(videoCountResult[0].count) || 0
          : 0;
            
        channelInfo = {
          id: channel.id,
          channelId: channel.channelId,
          name: channel.name,
          videoCount
        };
      }
    }
    
    return res.status(200).json({
      success: true,
      results,
      channelInfo,
      totalProcessed: results.length
    });
  } catch (error) {
    console.error('Error comparando títulos en bulk:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al comparar los títulos propuestos'
    });
  }
}

/**
 * Verifica si un canal específico ya está en la base de datos
 * @param req Request con URL o ID del canal
 * @param res Response con estado del canal
 */
export async function checkChannelStatus(req: Request, res: Response): Promise<Response> {
  try {
    const { channelUrl, channelId } = req.query;
    
    // Si se proporciona un channelId, es una verificación directa
    if (channelId) {
      // Verificar si el canal ya está en nuestra base de datos
      const existingChannel = await db.query.youtube_channels.findFirst({
        where: eq(youtube_channels.channelId, channelId as string)
      });
      
      if (existingChannel) {
        // Obtener algunos detalles del canal
        const videoCountResult = await db.execute(sql`
          SELECT COUNT(*) as count FROM youtube_videos WHERE channel_id = ${channelId}
        `);
        
        const videoCount = videoCountResult && Array.isArray(videoCountResult) && videoCountResult.length > 0
          ? parseInt(videoCountResult[0].count) || 0
          : 0;
        
        return res.status(200).json({
          success: true,
          exists: true,
          channel: {
            id: existingChannel.id,
            channelId: existingChannel.channelId,
            name: existingChannel.name,
            thumbnailUrl: existingChannel.thumbnailUrl,
            videoCount
          }
        });
      } else {
        return res.status(200).json({
          success: true,
          exists: false
        });
      }
    }
    
    // Si no hay channelId, entonces verificamos por URL
    if (!channelUrl) {
      return res.status(400).json({ 
        success: false, 
        message: 'Se requiere la URL o ID del canal' 
      });
    }
    
    // Extraer información del canal de YouTube
    const channelInfo = await youtubeService.getChannelInfo(channelUrl as string);
    
    if (!channelInfo.channelId) {
      return res.status(404).json({
        success: false,
        message: 'No se pudo encontrar el canal en YouTube'
      });
    }
    
    // Verificar si el canal ya está en nuestra base de datos
    const existingChannel = await db.query.youtube_channels.findFirst({
      where: eq(youtube_channels.channelId, channelInfo.channelId)
    });
    
    if (existingChannel) {
      // Obtener algunos detalles del canal
      const videoCountResult = await db.execute(sql`
        SELECT COUNT(*) as count FROM youtube_videos WHERE channel_id = ${channelInfo.channelId}
      `);
      
      const videoCount = videoCountResult && Array.isArray(videoCountResult) && videoCountResult.length > 0
        ? parseInt(videoCountResult[0].count) || 0
        : 0;
      
      return res.status(200).json({
        success: true,
        exists: true,
        channel: {
          id: existingChannel.id,
          channelId: existingChannel.channelId,
          name: existingChannel.name,
          thumbnailUrl: existingChannel.thumbnailUrl,
          videoCount
        }
      });
    }
    
    // El canal no existe en nuestra base de datos
    return res.status(200).json({
      success: true,
      exists: false,
      channelInfo
    });
  } catch (error) {
    console.error('Error verificando estado del canal:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al verificar el estado del canal'
    });
  }
}

/**
 * Agrega un canal de YouTube a la base de datos
 * @param req Request con la URL del canal
 * @param res Response con el resultado
 */
export async function addChannel(req: Request, res: Response): Promise<Response> {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ 
        success: false, 
        message: 'Se requiere la URL del canal' 
      });
    }
    
    // Extraer información del canal de YouTube
    const channelInfo = await youtubeService.getChannelInfo(url);
    
    if (!channelInfo.channelId) {
      return res.status(404).json({
        success: false,
        message: 'No se pudo encontrar el canal en YouTube'
      });
    }
    
    // Verificar si el canal ya existe en la base de datos
    const existingChannel = await db.query.youtube_channels.findFirst({
      where: eq(youtube_channels.channelId, channelInfo.channelId)
    });
    
    if (existingChannel) {
      return res.status(409).json({
        success: false,
        message: 'El canal ya está registrado en el sistema',
        channel: existingChannel
      });
    }
    
    // Insertar el canal en la base de datos
    const result = await db.insert(youtube_channels).values({
      channelId: channelInfo.channelId,
      name: channelInfo.name || 'Canal sin nombre',
      url: url,
      description: channelInfo.description || null,
      thumbnailUrl: channelInfo.thumbnailUrl || null,
      subscriberCount: channelInfo.subscriberCount || null,
      videoCount: channelInfo.videoCount || null,
      lastVideoFetch: null
    }).returning();
    
    if (!result || result.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Error al insertar el canal en la base de datos'
      });
    }
    
    // Empezar a recopilar videos del canal de manera asíncrona
    youtubeService.updateChannelVideos(channelInfo.channelId).catch(error => {
      console.error(`Error cargando videos del canal ${channelInfo.channelId}:`, error);
    });
    
    return res.status(201).json({
      success: true,
      message: 'Canal agregado correctamente',
      channel: result[0]
    });
  } catch (error) {
    console.error('Error agregando canal:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al agregar el canal'
    });
  }
}

/**
 * Elimina un canal de YouTube de la base de datos
 * @param req Request con el ID del canal
 * @param res Response con el resultado
 */
export async function deleteChannel(req: Request, res: Response): Promise<Response> {
  try {
    const { channelId } = req.params;
    
    if (!channelId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Se requiere el ID del canal' 
      });
    }
    
    // Verificar si el canal existe
    const existingChannel = await db.query.youtube_channels.findFirst({
      where: eq(youtube_channels.channelId, channelId)
    });
    
    if (!existingChannel) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró el canal especificado'
      });
    }
    
    // Primero eliminar todos los videos asociados al canal
    await db.delete(youtube_videos).where(eq(youtube_videos.channelId, channelId));
    
    // Luego eliminar el canal
    const result = await db.delete(youtube_channels).where(eq(youtube_channels.channelId, channelId)).returning();
    
    return res.status(200).json({
      success: true,
      message: 'Canal eliminado correctamente',
      deletedChannel: existingChannel
    });
  } catch (error) {
    console.error('Error eliminando canal:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar el canal'
    });
  }
}

/**
 * Obtiene todos los canales de YouTube registrados
 * @param req Request
 * @param res Response con la lista de canales
 */
export async function getChannels(req: Request, res: Response): Promise<Response> {
  try {
    // Obtener todos los canales de la base de datos
    const channels = await db.query.youtube_channels.findMany({
      orderBy: (youtube_channels, { desc }) => [desc(youtube_channels.lastVideoFetch)]
    });
    
    return res.status(200).json(channels);
  } catch (error) {
    console.error('Error obteniendo canales:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener los canales'
    });
  }
}

/**
 * Sincroniza los videos de un canal específico
 * @param req Request con el ID del canal
 * @param res Response con el resultado
 */
export async function syncChannelVideos(req: Request, res: Response): Promise<Response> {
  try {
    const { channelId } = req.params;
    
    if (!channelId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Se requiere el ID del canal' 
      });
    }
    
    // Verificar si el canal existe
    const existingChannel = await db.query.youtube_channels.findFirst({
      where: eq(youtube_channels.channelId, channelId)
    });
    
    if (!existingChannel) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró el canal especificado'
      });
    }
    
    // Actualizar videos del canal (esta función ya está implementada en youtubeService)
    await youtubeService.updateChannelVideos(channelId);
    
    // Obtener la cantidad de videos después de la sincronización
    const videoCountResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM youtube_videos WHERE channel_id = ${channelId}
    `);
    
    const videoCount = videoCountResult && Array.isArray(videoCountResult) && videoCountResult.length > 0
      ? parseInt(videoCountResult[0].count) || 0
      : 0;
    
    // Actualizar la fecha de última sincronización
    await db.update(youtube_channels)
      .set({ lastVideoFetch: new Date() })
      .where(eq(youtube_channels.channelId, channelId));
    
    return res.status(200).json({
      success: true,
      message: 'Videos del canal sincronizados correctamente',
      channelId,
      videoCount
    });
  } catch (error) {
    console.error('Error sincronizando videos del canal:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al sincronizar los videos del canal'
    });
  }
}

/**
 * Registra las rutas para el comparador de títulos y gestión de canales
 * @param app Express app
 * @param requireAuth Middleware de autenticación
 */
export function setupTitleComparisonRoutes(app: Express, requireAuth: any) {
  // Rutas para comparación de títulos
  app.post('/api/title-comparison/compare', requireAuth, compareTitleWithExisting);
  app.post('/api/title-comparison/bulk', requireAuth, compareBulkTitles);
  app.get('/api/title-comparison/check-channel', requireAuth, checkChannelStatus);
  
  // Rutas para gestión de canales de YouTube
  app.get('/api/titulin/channels', requireAuth, getChannels);
  app.post('/api/titulin/channels', requireAuth, addChannel);
  app.delete('/api/titulin/channels/:channelId', requireAuth, deleteChannel);
  app.post('/api/titulin/channels/sync/:channelId', requireAuth, syncChannelVideos);
}