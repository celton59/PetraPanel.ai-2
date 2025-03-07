import express, { Request, Response, NextFunction } from 'express';
import { google } from 'googleapis';
import { db } from '@db';
import { youtube_channels } from '@db/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

// Configuración de OAuth2
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.BASE_URL || 'http://localhost:5000'}/api/youtube/callback`
);

// Configuración de la API de YouTube
const youtube = google.youtube({
  version: 'v3',
  auth: oauth2Client
});

// Middleware para verificar si el usuario está autenticado
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ success: false, message: "No autenticado" });
  }
  next();
};

// Ruta para iniciar el proceso de autorización
router.get('/authorize', requireAuth, (req: Request, res: Response) => {
  // Guardar el ID del usuario en la sesión
  if (req.session) {
    req.session.userId = req.user?.id;
  }

  // Generar la URL de autorización
  const scopes = [
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/youtube.force-ssl'
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    include_granted_scopes: true
  });

  res.redirect(authUrl);
});

// Ruta para el callback de autorización
router.get('/callback', async (req: Request, res: Response) => {
  const { code } = req.query;
  
  if (!code) {
    return res.redirect('/settings/youtube?error=no_code');
  }

  try {
    // Intercambiar código por tokens
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);

    // Guardar tokens en la sesión del usuario
    if (req.session) {
      req.session.tokens = tokens;
    }

    // Obtener canales asociados a la cuenta
    const response = await youtube.channels.list({
      part: ['snippet,contentDetails,statistics'],
      mine: true
    });

    if (response.data.items && response.data.items.length > 0) {
      // Para cada canal encontrado, guardar en la base de datos
      for (const channel of response.data.items) {
        if (channel.id) {
          // Verificar si el canal ya existe
          const existingChannel = await db
            .select()
            .from(youtube_channels)
            .where(eq(youtube_channels.channelId, channel.id))
            .limit(1);

          if (existingChannel.length === 0) {
            // Insertar nuevo canal
            await db.insert(youtube_channels).values({
              channelId: channel.id,
              name: channel.snippet?.title || 'Canal sin nombre',
              url: `https://www.youtube.com/channel/${channel.id}`,
              thumbnailUrl: channel.snippet?.thumbnails?.default?.url || null,
              description: channel.snippet?.description || null,
              subscriberCount: parseInt(channel.statistics?.subscriberCount || '0'),
              videoCount: parseInt(channel.statistics?.videoCount || '0'),
              lastVideoFetch: null,
              lastAnalysis: null,
              active: true,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          } else {
            // Actualizar canal existente
            await db
              .update(youtube_channels)
              .set({
                name: channel.snippet?.title || existingChannel[0].name,
                thumbnailUrl: channel.snippet?.thumbnails?.default?.url || existingChannel[0].thumbnailUrl,
                description: channel.snippet?.description || existingChannel[0].description,
                subscriberCount: parseInt(channel.statistics?.subscriberCount || '0'),
                videoCount: parseInt(channel.statistics?.videoCount || '0'),
                active: true,
                updatedAt: new Date()
              })
              .where(eq(youtube_channels.channelId, channel.id));
          }
        }
      }
    }

    // Redireccionar a la configuración con éxito
    res.redirect('/settings/youtube?success=true');
    
  } catch (error) {
    console.error('Error al procesar callback de YouTube:', error);
    res.redirect('/settings/youtube?error=auth_failed');
  }
});

// Ruta para obtener canales autorizados
router.get('/authorized-channels', requireAuth, async (req: Request, res: Response) => {
  try {
    const channels = await db
      .select()
      .from(youtube_channels)
      .where(eq(youtube_channels.active, true));

    res.json({
      success: true,
      data: channels.map(channel => ({
        id: channel.channelId,
        title: channel.name,
        customUrl: channel.url,
        thumbnailUrl: channel.thumbnailUrl,
        subscriberCount: channel.subscriberCount,
        videoCount: channel.videoCount,
        isConnected: true
      }))
    });
  } catch (error) {
    console.error('Error al obtener canales autorizados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener canales autorizados'
    });
  }
});

// Ruta para conectar un canal manualmente
router.post('/connect-channel', requireAuth, async (req: Request, res: Response) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({
      success: false,
      message: 'URL del canal es requerida'
    });
  }

  try {
    // Extraer ID o username del canal de la URL
    const channelIdentifier = extractChannelIdentifier(url);
    
    if (!channelIdentifier) {
      return res.status(400).json({
        success: false,
        message: 'URL de canal inválida'
      });
    }

    let channelId: string;
    const apiKey = process.env.YOUTUBE_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'API Key de YouTube no configurada'
      });
    }

    // Configurar YouTube API con API Key
    const youtubeApi = google.youtube({
      version: 'v3',
      auth: apiKey
    });

    // Si es username, buscar ID por username
    if (channelIdentifier.type === 'username') {
      const searchResponse = await youtubeApi.search.list({
        part: ['snippet'],
        q: channelIdentifier.value,
        type: ['channel'],
        maxResults: 1
      });

      if (!searchResponse.data.items?.length) {
        return res.status(404).json({
          success: false,
          message: 'Canal no encontrado'
        });
      }

      channelId = searchResponse.data.items[0].snippet!.channelId!;
    } else {
      channelId = channelIdentifier.value;
    }

    // Obtener detalles del canal
    const response = await youtubeApi.channels.list({
      part: ['snippet,contentDetails,statistics'],
      id: [channelId]
    });

    if (!response.data.items?.length) {
      return res.status(404).json({
        success: false,
        message: 'Canal no encontrado'
      });
    }

    const channel = response.data.items[0];

    // Verificar si el canal ya existe
    const existingChannel = await db
      .select()
      .from(youtube_channels)
      .where(eq(youtube_channels.channelId, channelId))
      .limit(1);

    if (existingChannel.length === 0) {
      // Insertar nuevo canal
      await db.insert(youtube_channels).values({
        channelId: channelId,
        name: channel.snippet?.title || 'Canal sin nombre',
        url: `https://www.youtube.com/channel/${channelId}`,
        thumbnailUrl: channel.snippet?.thumbnails?.default?.url || null,
        description: channel.snippet?.description || null,
        subscriberCount: parseInt(channel.statistics?.subscriberCount || '0'),
        videoCount: parseInt(channel.statistics?.videoCount || '0'),
        lastVideoFetch: null,
        lastAnalysis: null,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } else {
      // Actualizar canal existente
      await db
        .update(youtube_channels)
        .set({
          name: channel.snippet?.title || existingChannel[0].name,
          thumbnailUrl: channel.snippet?.thumbnails?.default?.url || existingChannel[0].thumbnailUrl,
          description: channel.snippet?.description || existingChannel[0].description,
          subscriberCount: parseInt(channel.statistics?.subscriberCount || '0'),
          videoCount: parseInt(channel.statistics?.videoCount || '0'),
          active: true,
          updatedAt: new Date()
        })
        .where(eq(youtube_channels.channelId, channelId));
    }

    res.json({
      success: true,
      data: {
        id: channelId,
        title: channel.snippet?.title,
        customUrl: channel.snippet?.customUrl,
        thumbnailUrl: channel.snippet?.thumbnails?.default?.url,
        subscriberCount: parseInt(channel.statistics?.subscriberCount || '0'),
        videoCount: parseInt(channel.statistics?.videoCount || '0'),
        isConnected: true
      },
      message: 'Canal conectado correctamente'
    });
  } catch (error) {
    console.error('Error al conectar canal:', error);
    res.status(500).json({
      success: false,
      message: 'Error al conectar canal'
    });
  }
});

// Función para extraer identificador de canal de una URL
function extractChannelIdentifier(url: string): { type: 'id' | 'username', value: string } | null {
  try {
    url = url.replace(/\/$/, '');
    
    // Caso: ID directo (UC...)
    if (url.startsWith('UC')) {
      return { type: 'id', value: url };
    }
    
    // Caso: @username
    if (url.includes('@')) {
      const username = url.split('@').pop()!;
      return { type: 'username', value: username };
    }
    
    // Caso: /channel/UC...
    if (url.includes('/channel/')) {
      const id = url.split('/channel/').pop()!.split('?')[0];
      return { type: 'id', value: id };
    }
    
    // Caso: /c/customName
    if (url.includes('/c/')) {
      const customUrl = url.split('/c/').pop()!.split('?')[0];
      return { type: 'username', value: customUrl };
    }
    
    // Caso: URL de canal simple
    const parts = url.split('/');
    return { type: 'username', value: parts[parts.length - 1].split('?')[0] };
  } catch (error) {
    console.error('Error al extraer identificador de canal:', error);
    return null;
  }
}

export default router;