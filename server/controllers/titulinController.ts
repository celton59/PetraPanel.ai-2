import type { NextFunction, Request, Response } from "express";
import { eq, and, or, ilike, count, sql } from "drizzle-orm";
import {
  youtube_videos,
  youtube_channels,
  videos,
  trainingTitleExamples
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
    console.error("Error getting YouTube videos:", error);
    return res.status(500).json({
      success: false,
      message: "Error obteniendo videos de YouTube",
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

  try {
    // 1. Primero obtener los videos relacionados para obtener sus IDs
    const channelVideos = await db.query.youtube_videos.findMany({
      where: eq(youtube_videos.channelId, channelId),
      columns: { id: true, youtubeId: true }
    });
    
    console.log(`Encontrados ${channelVideos.length} videos asociados al canal ${channelId}`);
    
    // Procesamos por lotes para manejar grandes volúmenes de datos
    const BATCH_SIZE = 1000;
    let processedCount = 0;
    
    // Extraer IDs para utilizarlos en la eliminación
    const youtubeVideoIds = channelVideos.map(v => v.youtubeId);
    const dbVideoIds = channelVideos.map(v => v.id);
    
    // Procesamiento por lotes de la eliminación
    for (let i = 0; i < channelVideos.length; i += BATCH_SIZE) {
      const batchVideoIds = youtubeVideoIds.slice(i, i + BATCH_SIZE);
      const batchDbIds = dbVideoIds.slice(i, i + BATCH_SIZE);
      
      if (batchVideoIds.length === 0) continue;
      
      await db.transaction(async (trx) => {
        // Eliminar los ejemplos de entrenamiento basados en los títulos de estos videos
        await trx.delete(trainingTitleExamples).where(inArray(trainingTitleExamples.youtubeId, batchVideoIds));
        // Eliminar los videos de este lote
        await trx.delete(youtube_videos)
          .where(inArray(youtube_videos.id, batchDbIds))
          .execute();
      });
      
      processedCount += batchVideoIds.length;
      console.log(`Procesado lote ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(channelVideos.length/BATCH_SIZE)}: ${processedCount}/${channelVideos.length} videos eliminados del canal ${channelId}`);
    }
    
    // Finalmente eliminamos el canal
    await db.delete(youtube_channels)
      .where(eq(youtube_channels.id, parseInt(channelId)))
      .execute();
    
    console.log("Canal y sus datos asociados eliminados correctamente");
    return res.status(200).json({
      success: true,
      message: `Canal eliminado correctamente junto con ${channelVideos.length} videos y sus ejemplos de entrenamiento asociados`
    });
  } catch (error) {
    console.error('Error al eliminar canal', error);
    return res.status(500).json({ 
      error: 'Error al eliminar canal y sus datos asociados',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

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
    console.log('Obteniendo estadísticas de videos...');

    // Obtener el total y conteos por estado
    const [stats] = await db.execute(sql`
      WITH video_stats AS (
        SELECT 
          COUNT(*) as total_videos,
          COUNT(CASE WHEN status = 'upload_media' THEN 1 END) as upload_media_count,
          COUNT(CASE WHEN status = 'content_corrections' THEN 1 END) as content_corrections_count,
          COUNT(CASE WHEN status = 'available' THEN 1 END) as available_count,
          COUNT(CASE WHEN status = 'final_review' THEN 1 END) as final_review_count
        FROM videos
      )
      SELECT 
        total_videos,
        upload_media_count,
        content_corrections_count,
        available_count,
        final_review_count
      FROM video_stats;
    `);

    console.log('Estadísticas obtenidas:', stats);

    // Asegurar que los valores son números
    const totalVideos = parseInt(stats.total_videos) || 0;
    const stateCountsObj = {
      'upload_media': parseInt(stats.upload_media_count) || 0,
      'content_corrections': parseInt(stats.content_corrections_count) || 0,
      'available': parseInt(stats.available_count) || 0,
      'final_review': parseInt(stats.final_review_count) || 0
    };

    console.log('Respuesta final:', {
      totalVideos,
      stateCounts: stateCountsObj
    });

    return res.status(200).json({
      totalVideos,
      stateCounts: stateCountsObj
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de videos:', error);
    return res.status(500).json({ 
      error: 'Error al obtener estadísticas de videos',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

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

async function syncChannel (req: Request, res: Response): Promise<Response> {

  if (!req.user?.role || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para sincronizar canales',
    });
  }

  const channelId = req.params.channelId;

  if (!channelId) {
    return res.status(400).json({
      success: false,
      message: 'No se ha especificado el canal',
    });
  }

  try {

    const now = new Date()
    const videos = await youtubeService.getChannelVideos(channelId)

    console.info(`Fetched ${videos.length} videos for batch update for channel ${channelId}`);

    // No videos to process
    if (videos.length === 0) {
      console.info(`No videos to update for channel ${channelId}`);

      // Still update the channel's last fetch time
      ;
      await db
        .update(youtube_channels)
        .set({
          lastVideoFetch: now,
          updatedAt: now
        })
        .where(eq(youtube_channels.channelId, channelId));

    }

    // Use the optimized DbUtils function for batch upsert
    const startTime = Date.now();
    const successCount = await youtubeService.upsertYoutubeVideos(videos);

    const queryTime = Date.now() - startTime;
    if (queryTime > 500) {
      console.debug(`Slow batch operation detected: ${queryTime}ms for ${videos.length} videos`);
    }

    console.info(`Successfully processed ${successCount} videos for channel ${channelId}`);

    // Update channel's last fetch time
    await db
      .update(youtube_channels)
      .set({
        lastVideoFetch: now,
        updatedAt: now
      })
      .where(eq(youtube_channels.channelId, channelId));

    return res.status(200).json({
      success: true
    })

  } catch (error) {
    console.error('Error adding channel:', error);
    return res.status(500).json({ 
      error: 'Error al añadir canal',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

async function sendToOptimize (req: Request, res: Response): Promise<Response> {

  if (!req.user?.role || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para agregar canales',
    });
  }

  try {
    const { videoId } = req.params;
    // Get videoId and projectId from body
    const { projectId } = req.body as { projectId: number }
    // Check if videoId and projectId are provided
    if (!videoId || !projectId) {
      return res.status(400).json({
        success: false,
        message: 'No se ha especificado el videoId o el projectId',
      });
    }

    // Get the youtube video from the database
    const youtubeVideo = await db.select({
      ...getTableColumns(youtube_videos)
    }).from(youtube_videos).where(eq(youtube_videos.id, parseInt(videoId))).execute();

    // Check if the youtube video exists
    if (!youtubeVideo.at(0)) {
      return res.status(404).json({
        success: false,
        message: 'No se ha encontrado el video',
      });
    }
  
    if (youtubeVideo.at(0)?.sentToOptimize) {
      return res.status(400).json({
        success: false,
        message: 'El video ya está optimizado',
      });
    }

    // Insert the video into the database and set the sentToOptimize flag to true
    await db.transaction(async (trx) => {
        await trx.insert(videos)
          .values({
            projectId: projectId,
            createdAt: new Date(),
            updatedAt: new Date(),
            title: youtubeVideo.at(0)!.title,
            createdBy: req.user?.id,
            description: youtubeVideo.at(0)!.description,
            status: 'available',
            tags: youtubeVideo.at(0)!.tags?.toString(),
            thumbnailUrl: youtubeVideo.at(0)!.thumbnailUrl,
            youtubeUrl: `https://www.youtube.com/watch?v=${youtubeVideo.at(0)!.youtubeId}`,
          })
          .returning();

        await trx.update(youtube_videos).set({
          sentToOptimize: true,
          updatedAt: new Date()
        }).where(eq(youtube_videos.id, parseInt(videoId)));
    });

    return res.status(200).json({
      success: true
    })
    
  }
  catch (error) {
    console.error('Error adding channel:', error);
    return res.status(500).json({ 
      error: 'Error al añadir canal',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

async function cleanOrphans (req: Request, res: Response): Promise<Response> {
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
    // Procesar en lotes para manejar grandes volúmenes de datos
    const BATCH_SIZE = 1000;
    let deletedCount = 0;
    const totalCount = orphanedVideos.length;

    for (let i = 0; i < totalCount; i += BATCH_SIZE) {
      const batchIds = videoIds.slice(i, i + BATCH_SIZE);

      if (batchIds.length === 0) continue;

      await db.transaction(async (trx) => {
        // Eliminar los ejemplos de entrenamiento basados en los títulos de estos videos
        await trx.execute(sql`
          DELETE FROM training_title_examples 
          WHERE title IN (SELECT title FROM youtube_videos WHERE id IN (${sql.join(batchIds, sql`,`)}))
        `);

        // Luego eliminar los videos huérfanos usando SQL directo
        await trx.execute(sql`
          DELETE FROM youtube_videos
          WHERE id IN (${sql.join(batchIds, sql`,`)})
        `);
      });

      deletedCount += batchIds.length;
      console.log(`Procesado lote ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(totalCount/BATCH_SIZE)}: ${deletedCount}/${totalCount} videos huérfanos eliminados`);
    }

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
}

async function getSimilarVideos (req: Request, res: Response): Promise<Response> {
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
}

export function setUpTitulinRoutes (requireAuth: any, app: Express) {
  app.post('/api/titulin/channels', requireAuth, addChannel )
  app.get('/api/titulin/channels', requireAuth, getChannels )
  app.delete('/api/titulin/channels/:channelId', requireAuth, deleteChannel )
  app.post('/api/titulin/channels/:channelId/sync', requireAuth, syncChannel )
  app.get('/api/titulin/videos', requireAuth, getVideos )
  app.post('/api/titulin/videos/:videoId/send-to-optimize', requireAuth, sendToOptimize)
  app.post('/api/titulin/channels', requireAuth, addChannel)
  app.get('/api/titulin/channels', requireAuth, getChannels)
  app.delete('/api/titulin/channels/:channelId', requireAuth, deleteChannel)
  app.get('/api/titulin/videos', requireAuth, getVideos)
  app.get('/api/titulin/videos/stats', requireAuth, getVideoStats)
  

  // Nuevas rutas
  app.post('/api/titulin/videos/:videoId/analyze', requireAuth, analyzeVideo)
  
  // Ruta para limpieza de datos huérfanos
  app.post('/api/titulin/cleanup/orphaned-videos', requireAuth, cleanOrphans)
  
  // API de sugerencias para autocompletado
  app.get('/api/titulin/suggestions', requireAuth, getSuggestions)
  
  // Endpoint público para obtener canales (para ejemplos de entrenamiento)
  app.get('/api/titulin/channels/for-training', getChannelsForTraining)
  
  // Nueva ruta para búsqueda de títulos similares
  app.get('/api/titulin/videos/:videoId/similar', requireAuth, getSimilarVideos );
  

}

// Placeholder function - needs to be implemented
function getSuggestions(req: Request, res: Response) {
  res.status(501).json({ message: 'Not implemented' });
}


function getTableColumns(table: any) {
    return Object.fromEntries(Object.entries(table).filter(([key]) => !key.startsWith('_')))
}

function desc(column: any) {
    return column.desc()
}

function inArray(column: any, array: any) {
    return column.in(array)
}