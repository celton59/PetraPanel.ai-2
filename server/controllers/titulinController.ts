import type { Request, Response } from "express";
import { eq, and, or, ilike, getTableColumns, count, desc, sql } from "drizzle-orm";
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

  // Obtener parámetros para paginación y filtrado
  const { channelId, title, firstVowel } = req.query;
  const page = Number(req.query.page || '1');
  const limit = Number(req.query.limit || '20');
  const offset = (page - 1) * limit;
  
  try {
    // Construimos las condiciones de filtrado
    const conditions = [];
    
    if (channelId) {
      conditions.push(eq(youtube_videos.channelId, channelId as string));
    }
    
    // Nuevo sistema de búsqueda basado en primera vocal o búsqueda completa
    if (firstVowel) {
      // Implementación mejorada para búsqueda por primera vocal
      // Buscamos videos donde alguna palabra comience con la vocal especificada
      // Uso de expresión regular para encontrar palabras que comiencen con vocal
      
      // Obtenemos la vocal (asegurándonos que sea minúscula)
      const vowel = (firstVowel as string).toLowerCase();
      
      // Creamos expresión para buscar palabras que empiezan con la vocal
      // Utilizamos SIMILAR TO que soporta expresiones regulares en PostgreSQL
      // El patrón busca cualquier palabra en el título que comience con la vocal indicada
      const regexPattern = `%( |^)${vowel}[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]*%`;
      
      // Añadimos la condición a la consulta
      conditions.push(sql`${youtube_videos.title} SIMILAR TO ${regexPattern}`);
      
      console.log(`Buscando videos con palabras que empiezan con la vocal: ${vowel}`);
    } else if (title) {
      // Búsqueda tradicional por título (búsqueda exacta)
      conditions.push(ilike(youtube_videos.title, `%${title}%`));
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
    console.log(`Iniciando análisis de evergreen para video ${videoId}`);
    
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
    const published = videoData.publishedAt || null;
    const viewCount = videoData.viewCount || 0;
    const likeCount = videoData.likeCount || 0;
    
    // Algoritmo mejorado para análisis de contenido evergreen
    let points = 0;
    let maxPoints = 0;
    let reasons: string[] = [];
    
    // 1. Análisis por palabras clave
    // Palabras clave que podrían indicar que un video es evergreen
    const evergreenKeywords = [
      'cómo', 'tutorial', 'guía', 'aprende', 'paso a paso',
      'principiantes', 'básico', 'fundamental', 'esencial',
      'completo', 'definitivo', 'masterclass', 'tips', 'consejos',
      'trucos', 'secretos', 'resolver', 'solución', 'método',
      'técnica', 'estrategia', 'herramienta', 'recurso', 'receta'
    ];
    
    // Palabras que podrían indicar que un video NO es evergreen
    const nonEvergreenKeywords = [
      'actualización', 'noticias', 'novedades', 'tendencia',
      'nuevo lanzamiento', 'última versión', 'predicción',
      'próximamente', 'evento', 'temporada', 'edición limitada',
      'anuncio', 'estreno', 'revelado', 'hoy', 'esta semana',
      'este mes', 'este año', 'actual', 'breaking', 'última hora',
      'exclusiva', 'reciente', 'acabamos'
    ];
    
    const contentEvaluation = {
      evergreenCount: 0,
      nonEvergreenCount: 0
    };
    
    // Análisis de título
    evergreenKeywords.forEach(keyword => {
      if (title.includes(keyword)) {
        contentEvaluation.evergreenCount += 1;
      }
    });
    
    nonEvergreenKeywords.forEach(keyword => {
      if (title.includes(keyword)) {
        contentEvaluation.nonEvergreenCount += 1;
      }
    });
    
    // Análisis de descripción (con menor peso)
    evergreenKeywords.forEach(keyword => {
      if (description && description.includes(keyword)) {
        contentEvaluation.evergreenCount += 0.5;
      }
    });
    
    nonEvergreenKeywords.forEach(keyword => {
      if (description && description.includes(keyword)) {
        contentEvaluation.nonEvergreenCount += 0.5;
      }
    });
    
    // Evaluación de contenido por palabras clave (máximo 10 puntos)
    const keywordsMax = 10;
    maxPoints += keywordsMax;
    
    if (contentEvaluation.evergreenCount > contentEvaluation.nonEvergreenCount) {
      const keywordPoints = Math.min(keywordsMax, 
        (keywordsMax * (contentEvaluation.evergreenCount - contentEvaluation.nonEvergreenCount)) 
        / Math.max(evergreenKeywords.length / 2, 1)
      );
      points += keywordPoints;
      reasons.push(`Contiene términos de contenido educativo y atemporal (${contentEvaluation.evergreenCount.toFixed(1)} vs ${contentEvaluation.nonEvergreenCount.toFixed(1)}).`);
    } else if (contentEvaluation.nonEvergreenCount > contentEvaluation.evergreenCount) {
      reasons.push(`Contiene términos típicos de contenido temporal o noticioso (${contentEvaluation.nonEvergreenCount.toFixed(1)} vs ${contentEvaluation.evergreenCount.toFixed(1)}).`);
    } else {
      // Análisis de palabras neutral, dar 5 puntos
      points += keywordsMax / 2;
      reasons.push('El análisis de palabras clave no es concluyente.');
    }
    
    // 2. Análisis por antigüedad
    // Los videos más antiguos que siguen recibiendo vistas son potencialmente evergreen
    const ageMax = 10;
    maxPoints += ageMax;
    
    if (published) {
      const ageInMonths = (new Date().getTime() - new Date(published).getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (ageInMonths > 12) {
        points += ageMax;
        reasons.push(`El video tiene más de 1 año de antigüedad (${Math.floor(ageInMonths)} meses).`);
      } else if (ageInMonths > 6) {
        points += ageMax * 0.7;
        reasons.push(`El video tiene más de 6 meses de antigüedad (${Math.floor(ageInMonths)} meses).`);
      } else if (ageInMonths > 3) {
        points += ageMax * 0.4;
        reasons.push(`El video tiene más de 3 meses de antigüedad (${Math.floor(ageInMonths)} meses).`);
      } else {
        reasons.push(`El video es relativamente reciente (${Math.floor(ageInMonths)} meses).`);
      }
    }
    
    // 3. Análisis por engagement
    // Una buena relación de likes/vistas puede indicar contenido de valor duradero
    const engagementMax = 10;
    maxPoints += engagementMax;
    
    if (viewCount > 0) {
      const engagement = (likeCount / viewCount) * 100;
      if (engagement > 10) {
        points += engagementMax;
        reasons.push(`Excelente ratio de engagement (${engagement.toFixed(1)}%).`);
      } else if (engagement > 5) {
        points += engagementMax * 0.7;
        reasons.push(`Buen ratio de engagement (${engagement.toFixed(1)}%).`);
      } else if (engagement > 1) {
        points += engagementMax * 0.4;
        reasons.push(`Ratio de engagement moderado (${engagement.toFixed(1)}%).`);
      } else {
        reasons.push(`Bajo ratio de engagement (${engagement.toFixed(1)}%).`);
      }
    }
    
    // 4. Análisis de estructura del título 
    // Títulos de formato "Cómo hacer X" o "Guía para Y" suelen ser más evergreen
    const titleStructureMax = 5;
    maxPoints += titleStructureMax;
    
    const howToPattern = /^(cómo|como|aprende a|guía para|tutorial de)\s.+/i;
    const listPattern = /^(\d+|diez|veinte|cinco)\s.+/i;
    const guidePattern = /(guía|tutorial|manual|curso)/i;
    
    if (howToPattern.test(title)) {
      points += titleStructureMax;
      reasons.push('El título tiene estructura de tutorial o guía paso a paso.');
    } else if (listPattern.test(title)) {
      points += titleStructureMax * 0.7;
      reasons.push('El título tiene estructura de lista numerada, típico de contenido evergreen.');
    } else if (guidePattern.test(title)) {
      points += titleStructureMax * 0.5;
      reasons.push('El título menciona guía o tutorial.');
    }
    
    // 5. Duración del video
    // Los videos educativos o evergreen suelen ser más largos
    const durationMax = 5;
    maxPoints += durationMax;
    
    if (videoData.duration) {
      try {
        // Convertir duración ISO 8601 a segundos
        const match = videoData.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        const hours = (match && match[1]) ? parseInt(match[1]) : 0;
        const minutes = (match && match[2]) ? parseInt(match[2]) : 0;
        const seconds = (match && match[3]) ? parseInt(match[3]) : 0;
        
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        
        if (totalSeconds > 900) { // Más de 15 minutos
          points += durationMax;
          reasons.push(`Video de larga duración (${Math.floor(totalSeconds/60)} minutos), típico de contenido educativo.`);
        } else if (totalSeconds > 480) { // Más de 8 minutos
          points += durationMax * 0.7;
          reasons.push(`Video de duración media (${Math.floor(totalSeconds/60)} minutos).`);
        } else {
          points += durationMax * 0.3;
          reasons.push(`Video corto (${Math.floor(totalSeconds/60)} minutos), menos probable que sea evergreen.`);
        }
      } catch (e) {
        console.error("Error parsing duration:", e);
      }
    }
    
    // Calculamos el porcentaje final
    const scorePercentage = Math.round((points / maxPoints) * 100);
    const isEvergreen = scorePercentage >= 60; // Umbral del 60%
    const confidence = scorePercentage / 100;
    
    // Generamos un mensaje conciso con las principales razones
    const topReasons = reasons.slice(0, 3);
    const reason = isEvergreen 
      ? `Este video es probablemente evergreen. ${topReasons.join(' ')}`
      : `Este video probablemente no es evergreen. ${topReasons.join(' ')}`;
    
    console.log(`Análisis completado para video ${videoId}: ${scorePercentage}% (${isEvergreen ? 'Evergreen' : 'No evergreen'})`);
    
    // Guardamos el análisis en la base de datos
    try {
      await db.update(youtube_videos)
        .set({
          analyzed: true,
          // Convertimos el objeto JSON a un formato compatible con jsonb
          analysisData: {
            isEvergreen: isEvergreen,
            confidence: confidence,
            reason: reason,
            score: scorePercentage,
            details: reasons
          },
          updatedAt: new Date()
        })
        .where(eq(youtube_videos.id, parseInt(videoId)))
        .execute();
    } catch (error) {
      console.error("Error updating analysis data:", error);
      
      // Si falla por el campo analysisData, intentamos actualizar solo el flag de analyzed
      await db.update(youtube_videos)
        .set({
          analyzed: true,
          updatedAt: new Date()
        })
        .where(eq(youtube_videos.id, parseInt(videoId)))
        .execute();
    }
    
    return res.status(200).json({
      success: true,
      message: 'Análisis completado',
      data: {
        videoId: parseInt(videoId),
        isEvergreen: isEvergreen,
        confidence: confidence,
        score: scorePercentage,
        reason: reason
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

// Función para obtener estadísticas generales de todos los videos
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
}
