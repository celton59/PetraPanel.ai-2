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
          orderBy: (youtube_videos, { desc }) => [desc(youtube_videos.publishedAt)],
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
    const { channelUrl } = req.query;
    
    if (!channelUrl) {
      return res.status(400).json({ 
        success: false, 
        message: 'Se requiere la URL del canal' 
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
 * Registra las rutas para el comparador de títulos
 * @param app Express app
 * @param requireAuth Middleware de autenticación
 */
export function setupTitleComparisonRoutes(app: Express, requireAuth: any) {
  app.post('/api/title-comparison/compare', requireAuth, compareTitleWithExisting);
  app.post('/api/title-comparison/bulk', requireAuth, compareBulkTitles);
  app.get('/api/title-comparison/check-channel', requireAuth, checkChannelStatus);
}