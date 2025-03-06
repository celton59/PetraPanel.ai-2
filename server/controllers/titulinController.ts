import type { NextFunction, Request, Response } from "express";
import { eq, getTableColumns, desc, sql } from "drizzle-orm";
import {
  youtube_videos,
  youtube_channels,
  videos
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

async function getVideos(req: Request, res: Response): Promise<Response> {
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

    // Filtro opcional por canal
    const channelId = req.query.channelId as string;

    // Consulta para obtener el total de videos (para metadata de paginación)
    const countQuery = db.select({
      count: sql`count(*)`.mapWith(Number)
    }).from(youtube_videos);

    if (channelId) {
      countQuery.where(eq(youtube_videos.channelId, channelId));
    }

    const [countResult] = await countQuery;
    const totalVideos = countResult?.count || 0;

    // Consulta principal con paginación
    const videosQuery = db
      .select()
      .from(youtube_videos)
      .orderBy(desc(youtube_videos.publishedAt))
      .limit(limit)
      .offset(offset);

    if (channelId) {
      videosQuery.where(eq(youtube_videos.channelId, channelId));
    }

    const videos = await videosQuery;

    // Calcular metadata de paginación
    const totalPages = Math.ceil(totalVideos / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return res.status(200).json({
      videos,
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

    return res.status(200).json({
      success: true
    })
  } catch (error) {
    console.error('Error al eliminar canal', error);
    return res.status(500).json({ 
      error: 'Error al eliminar canal',
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

export function setUpTitulinRoutes (requireAuth: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined, app: Express) {
  app.post('/api/titulin/channels', requireAuth, addChannel )
  app.get('/api/titulin/channels', requireAuth, getChannels )
  app.delete('/api/titulin/channels/:channelId', requireAuth, deleteChannel )
  app.post('/api/titulin/channels/:channelId/sync', requireAuth, syncChannel )
  app.get('/api/titulin/videos', requireAuth, getVideos )
  app.post('/api/titulin/videos/:videoId/send-to-optimize', requireAuth, sendToOptimize)
}