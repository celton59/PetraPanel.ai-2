import { Express, Request, Response, NextFunction } from "express";
import { db } from "db";
import { and, asc, desc, eq, like, or } from "drizzle-orm";
import { suggestions, users } from "@db/schema";
import { z } from "zod";

/**
 * Esquema de validación para crear una sugerencia
 */
const createSuggestionSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres").max(255, "El título no puede exceder 255 caracteres"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  category: z.string().optional(),
});

/**
 * Esquema de validación para actualizar el estado de una sugerencia
 */
const updateSuggestionStatusSchema = z.object({
  status: z.enum(["pending", "reviewed", "implemented", "rejected"]),
  adminNotes: z.string().optional(),
});

/**
 * Obtiene todas las sugerencias (para administradores)
 */
async function getAllSuggestions(req: Request, res: Response): Promise<Response> {
  try {
    const { status, category, search } = req.query;
    
    // Condiciones para filtrado
    const conditions = [];
    
    if (status) {
      conditions.push(eq(suggestions.status, status as string));
    }
    
    if (category) {
      conditions.push(eq(suggestions.category, category as string));
    }
    
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          like(suggestions.title, searchTerm),
          like(suggestions.description, searchTerm)
        )
      );
    }
    
    // Crear la consulta base
    const query = db.select({
      id: suggestions.id,
      title: suggestions.title,
      description: suggestions.description,
      category: suggestions.category,
      status: suggestions.status,
      adminNotes: suggestions.adminNotes,
      created_at: suggestions.created_at,
      updated_at: suggestions.updated_at,
      userId: suggestions.userId,
      userName: users.fullName,
    })
    .from(suggestions)
    .leftJoin(users, eq(suggestions.userId, users.id));
    
    // Aplicar condiciones si existen
    const queryWithConditions = conditions.length > 0 
      ? query.where(and(...conditions))
      : query;
    
    // Aplicar ordenamiento
    const finalQuery = queryWithConditions.orderBy(desc(suggestions.created_at));

    const result = await finalQuery;
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error al obtener sugerencias:", error);
    return res.status(500).json({ error: "Error al obtener sugerencias" });
  }
}

/**
 * Obtiene las sugerencias de un usuario específico
 */
async function getUserSuggestions(req: Request, res: Response): Promise<Response> {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const result = await db.select()
      .from(suggestions)
      .where(eq(suggestions.userId, req.user.id))
      .orderBy(desc(suggestions.created_at));

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error al obtener sugerencias del usuario:", error);
    return res.status(500).json({ error: "Error al obtener sugerencias del usuario" });
  }
}

/**
 * Crea una nueva sugerencia
 */
async function createSuggestion(req: Request, res: Response): Promise<Response> {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const validation = createSuggestionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.format() });
    }

    const { title, description, category = "general" } = validation.data;

    const [result] = await db.insert(suggestions)
      .values({
        title,
        description,
        category,
        userId: req.user.id,
        status: "pending",
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();

    return res.status(201).json(result);
  } catch (error) {
    console.error("Error al crear sugerencia:", error);
    return res.status(500).json({ error: "Error al crear la sugerencia" });
  }
}

/**
 * Actualiza el estado de una sugerencia (sólo administradores)
 */
async function updateSuggestionStatus(req: Request, res: Response): Promise<Response> {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "No tienes permisos para esta acción" });
    }

    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: "ID de sugerencia inválido" });
    }

    const validation = updateSuggestionStatusSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.format() });
    }

    const { status, adminNotes } = validation.data;

    const [updatedSuggestion] = await db.update(suggestions)
      .set({
        status,
        adminNotes,
        updated_at: new Date(),
      })
      .where(eq(suggestions.id, Number(id)))
      .returning();

    if (!updatedSuggestion) {
      return res.status(404).json({ error: "Sugerencia no encontrada" });
    }

    return res.status(200).json(updatedSuggestion);
  } catch (error) {
    console.error("Error al actualizar sugerencia:", error);
    return res.status(500).json({ error: "Error al actualizar la sugerencia" });
  }
}

/**
 * Obtiene las categorías disponibles para sugerencias
 */
async function getSuggestionCategories(req: Request, res: Response): Promise<Response> {
  try {
    // Lista de categorías predefinidas
    const categories = [
      "general",
      "interfaz",
      "funcionalidad",
      "rendimiento",
      "bug",
      "optimización"
    ];
    
    return res.status(200).json(categories);
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    return res.status(500).json({ error: "Error al obtener categorías" });
  }
}

/**
 * Configura las rutas para el controlador de sugerencias
 */
export function setupSuggestionRoutes(
  app: Express,
  requireAuth: (req: Request, res: Response, next: NextFunction) => void
) {
  // Rutas públicas (requieren autenticación)
  app.get("/api/suggestions/user", requireAuth, getUserSuggestions);
  app.post("/api/suggestions", requireAuth, createSuggestion);
  app.get("/api/suggestions/categories", requireAuth, getSuggestionCategories);
  
  // Rutas de administración (solo para admins)
  app.get("/api/suggestions", requireAuth, getAllSuggestions);
  app.patch("/api/suggestions/:id/status", requireAuth, updateSuggestionStatus);
}