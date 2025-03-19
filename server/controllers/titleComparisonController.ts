import type { Request, Response } from "express";
import { eq, count, desc } from "drizzle-orm";
import { youtubeVideos, youtubeChannels, YoutubeVideo } from "@db/schema";
import { db } from "@db";
import { youtubeService } from "server/services/youtubeService";
import { findSimilarTitles } from "server/services/vectorAnalysis";
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
    const { results: similarTitles } = await findSimilarTitles(proposedTitle, 5);
    
    // Si se especificó un canal, verificar si el canal existe
    let channelExists = false;
    let channelVideos: YoutubeVideo[] = []
    
    if (channelId) {
      const channel = await db.query.youtubeChannels.findFirst({
        where: eq(youtubeChannels.channelId, channelId),
      });
      
      channelExists = !!channel;
      
      if (channelExists) {
        // Obtener videos del canal
        channelVideos = await db.query.youtubeVideos.findMany({
          where: eq(youtubeVideos.channelId, channelId),
          orderBy: desc(youtubeVideos.publishedAt),
          limit: 100,
        });
          
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
        const { results: similarTitles } = await findSimilarTitles(title, 3);
        
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
      const channel = await db.query.youtubeChannels.findFirst({
        where: eq(youtubeChannels.channelId, channelId),
      });
      
      if (channel) {
        // Contar videos del canal de forma manual
        const videoCountResult = await db.select({ count: count() })
        .from(youtubeVideos)
        .where( eq( youtubeVideos.channelId, channelId ));    
            
        channelInfo = {
          id: channel.id,
          channelId: channel.channelId,
          name: channel.name,
          videoCount: videoCountResult?.at(0)?.count ?? 0,
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

    if (!channelUrl && !channelId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Se requiere una URL o ID de canal para verificar'
      });
    }
    
    // Si se proporciona un channelId, es una verificación directa
    if (channelId) {
      // Verificar si el canal ya está en nuestra base de datos
      const existingChannel = await db.query.youtubeChannels.findFirst({
        where: eq(youtubeChannels.channelId, channelId as string)
      });

      if (!existingChannel) {
        return res.status(200).json({
          success: true,
          exists: false
        });
      }
      
      // Obtener algunos detalles del canal
      const videoCountResult = await db.select({ count: count() })
      .from(youtubeVideos)
      .where( eq( youtubeVideos.channelId, channelId as string ));    

      return res.status(200).json({
        success: true,
        exists: true,
        channel: {
          id: existingChannel.id,
          channelId: existingChannel.channelId,
          name: existingChannel.name,
          thumbnailUrl: existingChannel.thumbnailUrl,
          videoCount: videoCountResult?.at(0)?.count ?? 0,
        }
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
    const existingChannel = await db.query.youtubeChannels.findFirst({
      where: eq(youtubeChannels.channelId, channelInfo.channelId)
    });
    
    if (existingChannel) {
      // Obtener algunos detalles del canal
      const videoCountResult = await db.select({ count: count() })
      .from(youtubeVideos)
      .where( eq( youtubeVideos.channelId, channelId as string )); 
      
      const videoCount = videoCountResult && Array.isArray(videoCountResult) && videoCountResult.length > 0
        ? videoCountResult[0].count ?? 0
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
 * Registra las rutas para el comparador de títulos y gestión de canales
 * @param app Express app
 * @param requireAuth Middleware de autenticación
 */
export function setupTitleComparisonRoutes(app: Express, requireAuth: any) {
  // Rutas para comparación de títulos
  app.post('/api/title-comparison/compare', requireAuth, compareTitleWithExisting);
  app.post('/api/title-comparison/bulk', requireAuth, compareBulkTitles);
  app.get('/api/title-comparison/check-channel', requireAuth, checkChannelStatus);  
}