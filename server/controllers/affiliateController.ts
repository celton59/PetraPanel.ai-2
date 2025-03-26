import { Request, Response, NextFunction, Express } from 'express';
import { db } from '../../db';
import { affiliateCompanies, videoAffiliateMatches, videos } from '../../db/schema';
import { eq, and, ilike, inArray, sql } from 'drizzle-orm';
import { getNotificationsService } from '../services/notifications';
import { z } from 'zod';

// Esquema de validación para empresas afiliadas
const affiliateCompanySchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  logo_url: z.string().url("La URL del logo debe ser válida").optional(),
  affiliate_url: z.string().url("La URL de afiliación debe ser válida"),
  keywords: z.array(z.string()).optional(),
  active: z.boolean().optional()
});

// Esquema para creación masiva de empresas (solo nombres)
const bulkCompanySchema = z.object({
  names: z.array(z.string().min(2, "Cada nombre debe tener al menos 2 caracteres"))
});

/**
 * Obtiene todas las empresas afiliadas
 */
async function getAffiliateCompanies(req: Request, res: Response) {
  try {
    const companies = await db.query.affiliateCompanies.findMany({
      orderBy: (companies) => companies.name
    });
    
    return res.json(companies);
  } catch (error) {
    console.error('Error al obtener empresas afiliadas:', error);
    return res.status(500).json({ error: 'Error al obtener empresas afiliadas' });
  }
}

/**
 * Crea una nueva empresa afiliada
 */
async function createAffiliateCompany(req: Request, res: Response) {
  try {
    const result = affiliateCompanySchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        error: 'Datos de empresa inválidos', 
        details: result.error.format() 
      });
    }
    
    const companyData = result.data;
    
    // Verificar si ya existe una empresa con el mismo nombre
    const existingCompany = await db.query.affiliateCompanies.findFirst({
      where: eq(affiliateCompanies.name, companyData.name)
    });
    
    if (existingCompany) {
      return res.status(409).json({ error: 'Ya existe una empresa con este nombre' });
    }
    
    // Crear la empresa
    const [newCompany] = await db.insert(affiliateCompanies).values({
      name: companyData.name,
      description: companyData.description || null,
      logo_url: companyData.logo_url || null,
      affiliate_url: companyData.affiliate_url,
      keywords: companyData.keywords || [],
      active: companyData.active !== undefined ? companyData.active : true
    }).returning();
    
    return res.status(201).json(newCompany);
  } catch (error) {
    console.error('Error al crear empresa afiliada:', error);
    return res.status(500).json({ error: 'Error al crear empresa afiliada' });
  }
}

/**
 * Actualiza una empresa afiliada existente
 */
async function updateAffiliateCompany(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = affiliateCompanySchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        error: 'Datos de empresa inválidos', 
        details: result.error.format() 
      });
    }
    
    const companyData = result.data;
    
    // Verificar si la empresa existe
    const existingCompany = await db.query.affiliateCompanies.findFirst({
      where: eq(affiliateCompanies.id, parseInt(id))
    });
    
    if (!existingCompany) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }
    
    // Actualizar la empresa
    const [updatedCompany] = await db.update(affiliateCompanies)
      .set({
        name: companyData.name,
        description: companyData.description || null,
        logo_url: companyData.logo_url || null,
        affiliate_url: companyData.affiliate_url,
        keywords: companyData.keywords || [],
        active: companyData.active !== undefined ? companyData.active : true,
        updated_at: new Date()
      })
      .where(eq(affiliateCompanies.id, parseInt(id)))
      .returning();
    
    // Ejecutar verificación en videos existentes si la empresa se activó
    if (companyData.active && !existingCompany.active) {
      // Si se activó una empresa que estaba inactiva, escanear videos
      scanVideosForCompany(updatedCompany.id);
    }
    
    return res.json(updatedCompany);
  } catch (error) {
    console.error('Error al actualizar empresa afiliada:', error);
    return res.status(500).json({ error: 'Error al actualizar empresa afiliada' });
  }
}

/**
 * Elimina una empresa afiliada
 */
async function deleteAffiliateCompany(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    // Verificar si la empresa existe
    const existingCompany = await db.query.affiliateCompanies.findFirst({
      where: eq(affiliateCompanies.id, parseInt(id))
    });
    
    if (!existingCompany) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }
    
    // Eliminar la empresa
    await db.delete(affiliateCompanies).where(eq(affiliateCompanies.id, parseInt(id)));
    
    return res.json({ success: true, message: 'Empresa eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar empresa afiliada:', error);
    return res.status(500).json({ error: 'Error al eliminar empresa afiliada' });
  }
}

/**
 * Obtiene las empresas afiliadas detectadas en un video específico
 */
async function getVideoAffiliateMatches(req: Request, res: Response) {
  try {
    const { videoId } = req.params;
    
    // Obtener coincidencias con relaciones
    const matches = await db.query.videoAffiliateMatches.findMany({
      where: eq(videoAffiliateMatches.video_id, parseInt(videoId)),
      with: {
        company: true
      }
    });
    
    // Registrar lo que estamos devolviendo para depuración
    console.log(`Coincidencias de afiliados para video ${videoId}:`, 
      matches.length > 0 ? matches : "No se encontraron coincidencias");
    
    return res.json({
      success: true,
      data: matches
    });
  } catch (error) {
    console.error('Error al obtener coincidencias de afiliados:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Error al obtener coincidencias de afiliados' 
    });
  }
}

/**
 * Actualiza el estado de inclusión de un enlace de afiliado en un video
 */
async function updateAffiliateInclusion(req: Request, res: Response) {
  try {
    const { matchId } = req.params;
    const { included } = req.body;
    
    if (typeof included !== 'boolean') {
      return res.status(400).json({ error: 'El parámetro included debe ser un booleano' });
    }
    
    // Actualizar el registro
    const [updatedMatch] = await db.update(videoAffiliateMatches)
      .set({
        included_by_youtuber: included,
        updated_at: new Date()
      })
      .where(eq(videoAffiliateMatches.id, parseInt(matchId)))
      .returning();
    
    if (!updatedMatch) {
      return res.status(404).json({ 
        success: false,
        error: 'Coincidencia no encontrada'
      });
    }
    
    return res.json({
      success: true,
      data: updatedMatch
    });
  } catch (error) {
    console.error('Error al actualizar inclusión de afiliado:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Error al actualizar inclusión de afiliado'
    });
  }
}

/**
 * Escanea títulos de videos para detectar menciones de empresas afiliadas
 * - Se ejecuta cuando se crea un nuevo video
 * - Se ejecuta cuando se actualiza el título de un video
 * - Se ejecuta cuando se activa una empresa anteriormente inactiva
 */
export async function scanVideoForAffiliates(videoId: number, title: string): Promise<boolean> {
  try {
    console.log(`🔍 INICIANDO ESCANEO DE AFILIADOS para video ${videoId} con título "${title}"`);
    
    // Verificar parámetros de entrada
    if (!videoId || !title) {
      console.error(`❌ Error en parámetros de scanVideoForAffiliates - videoId: ${videoId}, title: ${title || 'vacío'}`);
      return false;
    }
    
    // Obtener todas las empresas activas
    const activeCompanies = await db.query.affiliateCompanies.findMany({
      where: eq(affiliateCompanies.active, true)
    });
    
    console.log(`📋 Empresas activas encontradas: ${activeCompanies.length}`);
    if (activeCompanies.length === 0) {
      console.log('⚠️ No hay empresas afiliadas activas para verificar');
      return false;
    }
    
    let matchesFound = false;
    
    // Analizar el título para cada empresa
    for (const company of activeCompanies) {
      const titleLower = title.toLowerCase();
      const nameLower = company.name.toLowerCase();
      
      // Comprobar si el nombre de la empresa está en el título
      const nameMatch = titleLower.includes(nameLower);
      
      // Comprobar si alguna palabra clave está en el título
      const keywordMatch = company.keywords?.some(keyword => 
        titleLower.includes(keyword.toLowerCase())
      ) || false;
      
      console.log(`🔍 Verificando empresa "${company.name}": nameMatch=${nameMatch}, keywordMatch=${keywordMatch}`);
      console.log(`   Keywords: ${JSON.stringify(company.keywords)}`);
      
      // Si hay coincidencia, registrar
      if (nameMatch || keywordMatch) {
        console.log(`✅ COINCIDENCIA ENCONTRADA para empresa "${company.name}" en video ${videoId}`);
        
        // Verificar si ya existe un registro para esta combinación de video y empresa
        const existingMatch = await db.query.videoAffiliateMatches.findFirst({
          where: and(
            eq(videoAffiliateMatches.video_id, videoId),
            eq(videoAffiliateMatches.company_id, company.id)
          )
        });
        
        if (existingMatch) {
          console.log(`ℹ️ Ya existe un registro para esta combinación video-empresa`);
        } else {
          console.log(`➕ Creando nuevo registro de coincidencia para video ${videoId} y empresa ${company.id}`);
          
          // Crear un nuevo registro
          const [newMatch] = await db.insert(videoAffiliateMatches).values({
            video_id: videoId,
            company_id: company.id,
            notified: false,
            included_by_youtuber: false
          }).returning();
          
          console.log(`✅ Nuevo registro creado con ID: ${newMatch?.id || 'error'}`);
          
          matchesFound = true;
          
          // Enviar notificación al youtuber asignado al video
          await notifyYoutuberAboutAffiliate(videoId, company);
        }
      }
    }
    
    console.log(`🏁 FINALIZADO escaneo de afiliados para video ${videoId}: matchesFound=${matchesFound}`);
    return matchesFound;
  } catch (error) {
    console.error('❌ ERROR CRÍTICO al escanear video para afiliados:', error);
    return false;
  }
}

/**
 * Escanea todos los videos existentes para una empresa específica
 * - Se utiliza cuando se activa una empresa previamente inactiva
 */
async function scanVideosForCompany(companyId: number): Promise<void> {
  try {
    // Obtener detalles de la empresa
    const company = await db.query.affiliateCompanies.findFirst({
      where: eq(affiliateCompanies.id, companyId)
    });
    
    if (!company || !company.active) {
      return;
    }
    
    // Obtener videos relevantes (aquellos que no han sido escaneados para esta empresa)
    const allVideos = await db.query.videos.findMany();
    
    // Escanear cada video
    for (const video of allVideos) {
      if (video.title) {
        const titleLower = video.title.toLowerCase();
        const nameLower = company.name.toLowerCase();
        
        // Comprobar coincidencias
        const nameMatch = titleLower.includes(nameLower);
        const keywordMatch = company.keywords?.some(keyword => 
          titleLower.includes(keyword.toLowerCase())
        ) || false;
        
        if (nameMatch || keywordMatch) {
          // Verificar si ya existe un registro
          const existingMatch = await db.query.videoAffiliateMatches.findFirst({
            where: and(
              eq(videoAffiliateMatches.video_id, video.id),
              eq(videoAffiliateMatches.company_id, company.id)
            )
          });
          
          if (!existingMatch) {
            // Crear un nuevo registro
            await db.insert(videoAffiliateMatches).values({
              video_id: video.id,
              company_id: company.id,
              notified: false,
              included_by_youtuber: false
            });
            
            // Enviar notificación
            await notifyYoutuberAboutAffiliate(video.id, company);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error al escanear videos para empresa:', error);
  }
}

/**
 * Envía una notificación al youtuber asignado al video
 * sobre la necesidad de incluir un enlace de afiliado
 */
async function notifyYoutuberAboutAffiliate(videoId: number, company: any): Promise<void> {
  try {
    // Obtener detalles del video, incluyendo el youtuber asignado
    const video = await db.query.videos.findFirst({
      where: eq(videos.id, videoId)
    });
    
    if (!video || !video.contentUploadedBy) {
      return;
    }
    
    const notificationsService = getNotificationsService();
    
    if (!notificationsService) {
      console.error('Servicio de notificaciones no disponible');
      return;
    }
    
    // Crear notificación
    await notificationsService.createNotification({
      userId: video.contentUploadedBy,
      title: 'Enlace de afiliado requerido',
      message: `El video "${video.title}" menciona a ${company.name}. Recuerda incluir el enlace de afiliado en la descripción y tarjetas del video.`,
      type: 'info',
      actionUrl: `/videos?id=${videoId}`,
      actionLabel: 'Ver video',
      relatedEntityType: 'video',
      relatedEntityId: videoId
    });
    
    // Marcar como notificado
    await db.update(videoAffiliateMatches)
      .set({ notified: true })
      .where(and(
        eq(videoAffiliateMatches.video_id, videoId),
        eq(videoAffiliateMatches.company_id, company.id)
      ));
    
  } catch (error) {
    console.error('Error al notificar al youtuber sobre afiliado:', error);
  }
}

/**
 * Crea múltiples empresas afiliadas a partir de una lista de nombres
 */
async function createBulkAffiliateCompanies(req: Request, res: Response) {
  try {
    const result = bulkCompanySchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        success: false,
        error: 'Datos inválidos', 
        details: result.error.format() 
      });
    }
    
    const { names } = result.data;
    
    // Si no hay nombres, devolver error
    if (names.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'No se proporcionaron nombres de empresas'
      });
    }
    
    // Limitar a un máximo razonable para evitar sobrecarga
    const limitedNames = names.slice(0, 100);
    console.log(`Procesando ${limitedNames.length} nombres de empresas`);
    
    // Obtener empresas existentes para verificar duplicados
    const existingCompanies = await db.query.affiliateCompanies.findMany({
      columns: { name: true }
    });
    const existingNames = new Set(existingCompanies.map(c => c.name.toLowerCase()));
    
    // Filtrar solo los nombres que no existen
    const newNames = limitedNames.filter(name => !existingNames.has(name.toLowerCase()));
    const duplicateNames = limitedNames.filter(name => existingNames.has(name.toLowerCase()));
    
    // Si todos los nombres ya existen, devolver error
    if (newNames.length === 0) {
      return res.status(409).json({
        success: false,
        message: 'Todas las empresas proporcionadas ya existen',
        totalDuplicates: duplicateNames.length,
        duplicateNames
      });
    }
    
    // Insertamos las nuevas empresas
    const companiesToInsert = newNames.map(name => ({
      name,
      description: null,
      logo_url: null,
      affiliate_url: 'https://pendiente.com', // URL temporal - se deberá actualizar posteriormente
      keywords: [name], // La primera palabra clave es el nombre de la empresa
      active: true // Por defecto activas como solicitado por el usuario
    }));
    
    // Insertar en lotes para evitar problemas con grandes cantidades
    const BATCH_SIZE = 20;
    let insertedCount = 0;
    const newCompanies = [];
    
    for (let i = 0; i < companiesToInsert.length; i += BATCH_SIZE) {
      const batch = companiesToInsert.slice(i, i + BATCH_SIZE);
      const result = await db.insert(affiliateCompanies).values(batch).returning();
      insertedCount += result.length;
      newCompanies.push(...result);
    }
    
    return res.status(201).json({
      success: true,
      message: `${insertedCount} empresas afiliadas creadas correctamente`,
      totalProcessed: limitedNames.length,
      newCompanies,
      skippedCount: duplicateNames.length,
      skippedNames: duplicateNames
    });
    
  } catch (error) {
    console.error('Error al crear empresas afiliadas en masa:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Error al crear empresas afiliadas en masa'
    });
  }
}

/**
 * Elimina todas las empresas afiliadas
 */
async function deleteAllAffiliateCompanies(req: Request, res: Response) {
  try {
    // Esta es una operación potencialmente peligrosa, así que verificamos que sea un administrador
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        error: 'Solo los administradores pueden realizar esta operación' 
      });
    }
    
    // Eliminar registros de coincidencias primero para mantener integridad referencial
    await db.delete(videoAffiliateMatches);
    
    // Eliminar todas las empresas
    const deleteResult = await db.delete(affiliateCompanies).returning({ deletedId: affiliateCompanies.id });
    
    const deletedCount = deleteResult.length;
    
    return res.json({
      success: true,
      message: `${deletedCount} empresas afiliadas eliminadas correctamente`,
      deletedCount
    });
  } catch (error) {
    console.error('Error al eliminar todas las empresas afiliadas:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Error al eliminar empresas afiliadas' 
    });
  }
}

/**
 * Configura las rutas para el controlador de afiliados
 */
export function setupAffiliateRoutes(
  app: Express, 
  requireAuth: (req: Request, res: Response, next: NextFunction) => void
) {
  // Rutas para gestión de empresas afiliadas
  app.get('/api/affiliates/companies', requireAuth, getAffiliateCompanies);
  app.post('/api/affiliates/companies', requireAuth, createAffiliateCompany);
  app.post('/api/affiliates/companies/bulk', requireAuth, createBulkAffiliateCompanies);
  app.put('/api/affiliates/companies/:id', requireAuth, updateAffiliateCompany);
  app.delete('/api/affiliates/companies/:id', requireAuth, deleteAffiliateCompany);
  app.delete('/api/affiliates/companies', requireAuth, deleteAllAffiliateCompanies);
  
  // Rutas para coincidencias de afiliados en videos
  app.get('/api/affiliates/videos/:videoId/matches', requireAuth, getVideoAffiliateMatches);
  app.put('/api/affiliates/matches/:matchId/inclusion', requireAuth, updateAffiliateInclusion);
}