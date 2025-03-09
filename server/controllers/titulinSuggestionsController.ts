import { Request, Response } from "express";
import { db } from "../../db";
import { sql } from "drizzle-orm";

/**
 * Obtiene sugerencias de títulos de videos basados en el término de búsqueda
 * Devuelve una lista de sugerencias y la cantidad de videos que coinciden con cada sugerencia
 */
export async function getSuggestions(req: Request, res: Response) {
  try {
    const query = req.query.query as string;
    
    if (!query || query.length < 2) {
      return res.status(400).json({
        message: "El término de búsqueda debe tener al menos 2 caracteres",
        suggestions: []
      });
    }

    // Limpiamos y normalizamos la consulta para la búsqueda
    const normalizedQuery = query.trim().toLowerCase();
    
    // Consulta SQL para encontrar sugerencias basadas en palabras comunes en los títulos
    // que coincidan con el término de búsqueda
    const wordResults = await db.execute(sql`
      WITH words AS (
        SELECT DISTINCT
          word,
          COUNT(*) OVER (PARTITION BY word) as count
        FROM
          youtube_videos,
          LATERAL unnest(string_to_array(lower(title), ' ')) as word
        WHERE
          word LIKE ${`%${normalizedQuery}%`}
          AND length(word) >= 3
      )
      SELECT word as title, count
      FROM words
      WHERE count > 1
      ORDER BY count DESC, word
      LIMIT 10
    `);

    // Convertir el resultado a un array de sugerencias
    const suggestions = Array.isArray(wordResults) ? wordResults : [];

    // Si no hay suficientes resultados por palabras individuales, buscar en títulos completos
    if (suggestions.length < 5) {
      const titleResults = await db.execute(sql`
        SELECT 
          title,
          COUNT(*) as count
        FROM youtube_videos
        WHERE lower(title) LIKE ${`%${normalizedQuery}%`}
        GROUP BY title
        ORDER BY count DESC, title
        LIMIT ${10 - suggestions.length}
      `);
      
      // Combinar resultados
      const titleSuggestions = Array.isArray(titleResults) ? titleResults : [];
      suggestions.push(...titleSuggestions);
    }

    return res.json({
      suggestions
    });
  } catch (error) {
    console.error("Error getting title suggestions:", error);
    return res.status(500).json({
      message: "Error al obtener sugerencias",
      error: (error as Error).message
    });
  }
}