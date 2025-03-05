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

export function setUpTitulinRoutes (app: Express) {
  app.post('/api/titulin/channels', addChannel )
  app.get('/api/titulin/channels', getChannels )
  app.delete('/api/titulin/channels/:channelId', deleteChannel )
  app.get('/api/titulin/videos', getVideos )
}
