import { Express, Request, Response, NextFunction } from 'express';
import { db } from '@db';
import { sql } from 'drizzle-orm';

/**
 * Configuración de rutas para gestionar los ejemplos de entrenamiento
 * @param app Express app
 * @param requireAuth Middleware de autenticación
 */
export function setupTrainingExamplesRoutes(
  app: Express, 
  requireAuth: (req: Request, res: Response, next: NextFunction) => void
) {
  // Obtener todos los ejemplos de títulos
  app.get('/api/titulin/training-examples', requireAuth, async (req: Request, res: Response) => {
    try {
      const examples = await db.execute(sql`
        SELECT id, title, is_evergreen, created_at, created_by
        FROM training_title_examples
        ORDER BY id
      `);
      
      // Manejar diferentes formatos de resultados
      let rows = Array.isArray(examples) ? examples : 
                (examples.rows && Array.isArray(examples.rows) ? examples.rows : 
                (typeof examples === 'object' ? Object.values(examples) : []));
      
      return res.status(200).json({
        success: true,
        data: rows
      });
    } catch (error: any) {
      console.error('Error al obtener ejemplos de entrenamiento:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener ejemplos de entrenamiento',
        details: error.message
      });
    }
  });
  
  // Añadir un nuevo ejemplo de título
  app.post('/api/titulin/training-examples', requireAuth, async (req: Request, res: Response) => {
    try {
      const { title, isEvergreen } = req.body;
      
      if (!title) {
        return res.status(400).json({
          success: false,
          message: 'El título es obligatorio'
        });
      }
      
      // Obtener usuario actual
      const userId = req.user?.id;
      
      // Insertar ejemplo
      const result = await db.execute(sql`
        INSERT INTO training_title_examples 
        (title, is_evergreen, created_by) 
        VALUES (${title}, ${!!isEvergreen}, ${userId})
        RETURNING id, title, is_evergreen, created_at, created_by
      `);
      
      // Manejar diferentes formatos de resultados
      let rows = Array.isArray(result) ? result[0] : 
                (result.rows && Array.isArray(result.rows) ? result.rows[0] : 
                (typeof result === 'object' && Object.keys(result).length > 0 ? result : null));
      
      return res.status(201).json({
        success: true,
        data: rows
      });
    } catch (error: any) {
      console.error('Error al crear ejemplo de entrenamiento:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al crear ejemplo de entrenamiento',
        details: error.message
      });
    }
  });
  
  // Eliminar un ejemplo de título
  app.delete('/api/titulin/training-examples/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Verificar que el ejemplo existe
      const example = await db.execute(sql`
        SELECT id FROM training_title_examples WHERE id = ${parseInt(id)}
      `);
      
      // Manejar diferentes formatos de resultados
      let rows = Array.isArray(example) ? example : 
                (example.rows && Array.isArray(example.rows) ? example.rows : 
                (typeof example === 'object' ? Object.values(example) : []));
      
      if (!rows.length) {
        return res.status(404).json({
          success: false,
          message: 'Ejemplo no encontrado'
        });
      }
      
      // Eliminar ejemplo
      await db.execute(sql`
        DELETE FROM training_title_examples WHERE id = ${parseInt(id)}
      `);
      
      return res.status(200).json({
        success: true,
        message: 'Ejemplo eliminado correctamente'
      });
    } catch (error: any) {
      console.error('Error al eliminar ejemplo de entrenamiento:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al eliminar ejemplo de entrenamiento',
        details: error.message
      });
    }
  });
}