import { Router, Request, Response, NextFunction } from 'express';
import { google } from 'googleapis';
import { db } from '@db';
import { youtube_channels } from '@db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Configurar cliente OAuth para YouTube
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/youtube/callback'
);

// Alcances necesarios para acceder a la API de YouTube
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/youtubepartner',
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.force-ssl'
];

// Middleware para verificar autenticación
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      message: 'No autorizado'
    });
  }
  next();
};

// Iniciar flujo de autorización con YouTube
router.get('/authorize', requireAuth, (req: Request, res: Response) => {
  // Almacenar el ID del usuario en la sesión para recuperarlo después del callback
  req.session.userId = req.session.user?.id;
  
  // Generar URL de autorización
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    include_granted_scopes: true,
    prompt: 'consent' // Siempre solicitar consentimiento para recibir refresh_token
  });
  
  // Redirigir a la URL de autorización de Google
  res.redirect(authUrl);
});

// Callback después de la autorización con Google
router.get('/callback', async (req: Request, res: Response) => {
  const { code } = req.query;
  
  if (!code) {
    return res.redirect('/configuracion/youtube?error=no_code');
  }
  
  try {
    // Intercambiar código por tokens
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);
    
    // Obtener el usuario desde la sesión
    const userId = req.session.userId;
    if (!userId) {
      return res.redirect('/configuracion/youtube?error=no_user');
    }
    
    // Guardar tokens en la sesión del usuario
    req.session.tokens = tokens;
    
    // Obtener canales disponibles para este usuario
    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client
    });
    
    // Obtener los canales a los que tiene acceso el usuario
    const channelsResponse = await youtube.channels.list({
      mine: true,
      part: ['snippet', 'statistics', 'contentDetails']
    });
    
    // Almacenar canales en la base de datos
    if (channelsResponse.data.items && channelsResponse.data.items.length > 0) {
      for (const channel of channelsResponse.data.items) {
        // Verificar si el canal ya existe
        const existingChannel = await db.query.youtube_channels.findFirst({
          where: eq(youtube_channels.channelId, channel.id || '')
        });
        
        if (!existingChannel) {
          // Insertar nuevo canal
          await db.insert(youtube_channels).values({
            channelId: channel.id || '',
            name: channel.snippet?.title || 'Canal sin nombre',
            description: channel.snippet?.description || null,
            thumbnailUrl: channel.snippet?.thumbnails?.default?.url || null,
            url: `https://youtube.com/channel/${channel.id}`,
            subscriberCount: Number(channel.statistics?.subscriberCount) || 0,
            videoCount: Number(channel.statistics?.videoCount) || 0,
            uploadsPlaylistId: channel.contentDetails?.relatedPlaylists?.uploads || null,
            userId: userId,
            lastVideoFetch: null,
            active: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        } else {
          // Actualizar canal existente
          await db.update(youtube_channels)
            .set({
              name: channel.snippet?.title || 'Canal sin nombre',
              description: channel.snippet?.description || null,
              thumbnailUrl: channel.snippet?.thumbnails?.default?.url || null,
              subscriberCount: Number(channel.statistics?.subscriberCount) || 0,
              videoCount: Number(channel.statistics?.videoCount) || 0,
              updatedAt: new Date(),
              userId: userId,
              active: true
            })
            .where(eq(youtube_channels.channelId, channel.id || ''));
        }
      }
    }
    
    res.redirect('/configuracion/youtube?success=true');
  } catch (error) {
    console.error('Error en el callback de YouTube:', error);
    res.redirect('/configuracion/youtube?error=auth_failed');
  }
});

// Obtener canales autorizados del usuario actual
router.get('/authorized-channels', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.user?.id;
    
    // Obtener canales del usuario desde la base de datos
    const channels = await db.select({
      id: youtube_channels.id,
      channelId: youtube_channels.channelId,
      title: youtube_channels.name,
      customUrl: youtube_channels.url,
      thumbnailUrl: youtube_channels.thumbnailUrl,
      subscriberCount: youtube_channels.subscriberCount,
      videoCount: youtube_channels.videoCount,
      isConnected: youtube_channels.active
    })
    .from(youtube_channels)
    .where(eq(youtube_channels.userId, userId as number));
    
    return res.json({
      success: true,
      data: channels
    });
  } catch (error) {
    console.error('Error al obtener canales autorizados:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener canales autorizados'
    });
  }
});

// Conectar canal manualmente por URL
router.post('/connect-channel', requireAuth, async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'La URL del canal es requerida'
      });
    }
    
    // Extraer identificador del canal desde la URL
    const channelIdentifier = extractChannelIdentifier(url);
    if (!channelIdentifier) {
      return res.status(400).json({
        success: false,
        message: 'URL de canal no válida'
      });
    }
    
    // Inicializar API de YouTube
    const youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY
    });
    
    // Obtener información del canal
    let channelResponse;
    if (channelIdentifier.type === 'id') {
      channelResponse = await youtube.channels.list({
        id: [channelIdentifier.value],
        part: ['snippet', 'statistics', 'contentDetails']
      });
    } else { // username o custom URL
      channelResponse = await youtube.channels.list({
        forUsername: channelIdentifier.value,
        part: ['snippet', 'statistics', 'contentDetails']
      });
      
      // Si no se encuentra por username, intentar búsqueda por término
      if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
        const searchResponse = await youtube.search.list({
          q: channelIdentifier.value,
          type: ['channel'],
          part: ['snippet'],
          maxResults: 1
        });
        
        if (searchResponse.data.items && searchResponse.data.items.length > 0) {
          const channelId = searchResponse.data.items[0].id?.channelId;
          if (channelId) {
            channelResponse = await youtube.channels.list({
              id: [channelId],
              part: ['snippet', 'statistics', 'contentDetails']
            });
          }
        }
      }
    }
    
    // Verificar si se encontró el canal
    if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró el canal de YouTube'
      });
    }
    
    const channel = channelResponse.data.items[0];
    const userId = req.session.user?.id;
    
    // Verificar si el canal ya existe
    const existingChannel = await db.query.youtube_channels.findFirst({
      where: eq(youtube_channels.channelId, channel.id || '')
    });
    
    if (existingChannel) {
      // Actualizar canal existente
      await db.update(youtube_channels)
        .set({
          name: channel.snippet?.title || 'Canal sin nombre',
          description: channel.snippet?.description || null,
          thumbnailUrl: channel.snippet?.thumbnails?.default?.url || null,
          subscriberCount: Number(channel.statistics?.subscriberCount) || 0,
          videoCount: Number(channel.statistics?.videoCount) || 0,
          updatedAt: new Date(),
          userId: userId as number,
          active: true
        })
        .where(eq(youtube_channels.channelId, channel.id || ''));
    } else {
      // Insertar nuevo canal
      await db.insert(youtube_channels).values({
        channelId: channel.id || '',
        name: channel.snippet?.title || 'Canal sin nombre',
        description: channel.snippet?.description || null,
        thumbnailUrl: channel.snippet?.thumbnails?.default?.url || null,
        url: `https://youtube.com/channel/${channel.id}`,
        subscriberCount: Number(channel.statistics?.subscriberCount) || 0,
        videoCount: Number(channel.statistics?.videoCount) || 0,
        uploadsPlaylistId: channel.contentDetails?.relatedPlaylists?.uploads || null,
        userId: userId as number,
        lastVideoFetch: null,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    return res.json({
      success: true,
      message: 'Canal conectado correctamente'
    });
  } catch (error) {
    console.error('Error al conectar canal:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al conectar canal'
    });
  }
});

// Función auxiliar para extraer identificador de canal desde URL
function extractChannelIdentifier(url: string): { type: 'id' | 'username', value: string } | null {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    
    // Formato: youtube.com/channel/UC...
    if (path.includes('/channel/')) {
      const channelId = path.split('/channel/')[1].split('/')[0];
      return { type: 'id', value: channelId };
    }
    
    // Formato: youtube.com/c/NombreCanal
    if (path.includes('/c/')) {
      const username = path.split('/c/')[1].split('/')[0];
      return { type: 'username', value: username };
    }
    
    // Formato: youtube.com/@usuario
    if (path.includes('/@')) {
      const username = path.split('/@')[1].split('/')[0];
      return { type: 'username', value: username };
    }
    
    // Formato: youtube.com/user/NombreUsuario
    if (path.includes('/user/')) {
      const username = path.split('/user/')[1].split('/')[0];
      return { type: 'username', value: username };
    }
    
    return null;
  } catch (error) {
    console.error('Error al extraer identificador de canal:', error);
    return null;
  }
}

export default router;