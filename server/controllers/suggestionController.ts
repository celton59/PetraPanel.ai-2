import { Request, Response, Express, NextFunction } from 'express';
import { z } from 'zod';
import { db } from '@db';
import { users, suggestions } from '@db/schema';
import { eq, and, desc, sql, like, or } from 'drizzle-orm';

/**
 * Esquema de validación para crear una sugerencia
 */
const createSuggestionSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().min(10).max(2000),
  category: z.string().min(1).max(50),
});

/**
 * Esquema de validación para actualizar el estado de una sugerencia
 */
const updateSuggestionStatusSchema = z.object({
  status: z.enum(['pending', 'reviewed', 'implemented', 'rejected']),
  adminNotes: z.string().max(1000).optional(),
});

/**
 * Obtiene todas las sugerencias (para administradores)
 */
async function getAllSuggestions(req: Request, res: Response): Promise<Response> {
  try {
    // Parámetros de filtrado opcionales
    const status = req.query.status as string | undefined;
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;

    // Filtros
    let filters = [];
    if (status) {
      filters.push(eq(suggestions.status, status));
    }
    if (category) {
      filters.push(eq(suggestions.category, category));
    }
    if (search) {
      const searchTerm = `%${search}%`;
      filters.push(
        or(
          like(suggestions.title, searchTerm),
          like(suggestions.description, searchTerm)
        )
      );
    }

    // Construir la consulta
    const query = filters.length > 0
      ? db.select({
          ...suggestions,
          userName: users.fullName,
        })
        .from(suggestions)
        .leftJoin(users, eq(suggestions.userId, users.id))
        .where(and(...filters))
        .orderBy(desc(suggestions.created_at))
      : db.select({
          ...suggestions,
          userName: users.fullName,
        })
        .from(suggestions)
        .leftJoin(users, eq(suggestions.userId, users.id))
        .orderBy(desc(suggestions.created_at));

    const results = await query;
    return res.status(200).json(results);
  } catch (error) {
    console.error('Error al obtener sugerencias:', error);
    return res.status(500).json({ message: 'Error al obtener las sugerencias' });
  }
}

/**
 * Obtiene las sugerencias de un usuario específico
 */
async function getUserSuggestions(req: Request, res: Response): Promise<Response> {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const userSuggestions = await db.select()
      .from(suggestions)
      .where(eq(suggestions.userId, req.user.id))
      .orderBy(desc(suggestions.created_at));

    return res.status(200).json(userSuggestions);
  } catch (error) {
    console.error('Error al obtener sugerencias del usuario:', error);
    return res.status(500).json({ message: 'Error al obtener las sugerencias' });
  }
}

/**
 * Crea una nueva sugerencia
 */
async function createSuggestion(req: Request, res: Response): Promise<Response> {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    // Validar datos
    const validation = createSuggestionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        message: 'Datos inválidos', 
        errors: validation.error.format() 
      });
    }

    const { title, description, category } = validation.data;

    // Insertar en la base de datos
    const [newSuggestion] = await db.insert(suggestions)
      .values({
        userId: req.user.id,
        title,
        description,
        category,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();

    return res.status(201).json(newSuggestion);
  } catch (error) {
    console.error('Error al crear sugerencia:', error);
    return res.status(500).json({ message: 'Error al crear la sugerencia' });
  }
}

/**
 * Actualiza el estado de una sugerencia (sólo administradores)
 */
async function updateSuggestionStatus(req: Request, res: Response): Promise<Response> {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    // Verificar si es administrador
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso no autorizado' });
    }

    const suggestionId = parseInt(req.params.id);
    if (isNaN(suggestionId)) {
      return res.status(400).json({ message: 'ID de sugerencia inválido' });
    }

    // Validar datos
    const validation = updateSuggestionStatusSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        message: 'Datos inválidos', 
        errors: validation.error.format() 
      });
    }

    const { status, adminNotes } = validation.data;

    // Verificar si la sugerencia existe
    const existingSuggestion = await db.select()
      .from(suggestions)
      .where(eq(suggestions.id, suggestionId))
      .limit(1);

    if (existingSuggestion.length === 0) {
      return res.status(404).json({ message: 'Sugerencia no encontrada' });
    }

    // Actualizar estado
    const [updatedSuggestion] = await db.update(suggestions)
      .set({
        status,
        adminNotes,
        updated_at: new Date(),
      })
      .where(eq(suggestions.id, suggestionId))
      .returning();

    return res.status(200).json(updatedSuggestion);
  } catch (error) {
    console.error('Error al actualizar estado de sugerencia:', error);
    return res.status(500).json({ message: 'Error al actualizar el estado' });
  }
}

/**
 * Obtiene las categorías disponibles para sugerencias
 */
async function getSuggestionCategories(req: Request, res: Response): Promise<Response> {
  try {
    // En una implementación completa, estas categorías podrían venir de la base de datos
    // Por ahora, devolvemos valores predefinidos
    const categories = [
      'general', 
      'interfaz', 
      'funcionalidad', 
      'rendimiento', 
      'bug', 
      'optimización'
    ];
    
    return res.status(200).json(categories);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    return res.status(500).json({ message: 'Error al obtener categorías' });
  }
}

/**
 * Configura las rutas para el controlador de sugerencias
 */
export function setupSuggestionRoutes(
  app: Express,
  requireAuth: (req: Request, res: Response, next: NextFunction) => void
) {
  // Rutas para todos los usuarios
  app.get('/api/suggestions/user', requireAuth, getUserSuggestions);
  app.post('/api/suggestions', requireAuth, createSuggestion);
  app.get('/api/suggestions/categories', requireAuth, getSuggestionCategories);
  
  // Rutas para administradores
  app.get('/api/suggestions', requireAuth, getAllSuggestions);
  app.patch('/api/suggestions/:id/status', requireAuth, updateSuggestionStatus);
}