import type { NextFunction, Request, Response } from "express";
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

export function setUpTitulinRoutes (requireAuth: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined, app: Express) {
  app.post('/api/titulin/channels', requireAuth, addChannel )
  app.get('/api/titulin/channels', requireAuth, getChannels )
  app.delete('/api/titulin/channels/:channelId', requireAuth, deleteChannel )
  app.post('/api/titulin/channels/:channelId/sync', requireAuth, syncChannel )
  app.get('/api/titulin/videos', requireAuth, getVideos )
}
