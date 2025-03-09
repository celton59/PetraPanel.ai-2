import { Express, Request, Response, NextFunction } from 'express';
import { db } from '@db';
import { sql } from 'drizzle-orm';
import multer from 'multer';
import { promises as fs } from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

/**
 * Configuración de rutas para gestionar los ejemplos de entrenamiento
 * @param app Express app
 * @param requireAuth Middleware de autenticación
 */
interface BulkOperation {
  ids: number[];
  operation: 'delete' | 'update';
  data?: {
    is_evergreen?: boolean;
  };
}

// Configuración para la carga de archivos CSV
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'temp');
    // Asegurarse de que el directorio existe
    fs.mkdir(uploadsDir, { recursive: true })
      .then(() => cb(null, uploadsDir))
      .catch(err => cb(err, ''));
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'csv-import-' + uniqueSuffix + '.csv');
  }
});

// Filtro para solo permitir archivos CSV
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos CSV'));
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB máximo
});

export function setupTrainingExamplesRoutes(
  app: Express, 
  requireAuth: (req: Request, res: Response, next: NextFunction) => void
) {
  // Obtener ejemplos de títulos con paginación y filtros
  app.get('/api/titulin/training-examples', requireAuth, async (req: Request, res: Response) => {
    try {
      // Parámetros de paginación
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;
      
      // Parámetros de filtrado
      const search = (req.query.search as string) || '';
      const type = (req.query.type as string) || 'all';
      const sortBy = (req.query.sortBy as string) || 'id';
      const sortDir = (req.query.sortDir as string) === 'desc' ? 'DESC' : 'ASC';
      const createdBy = parseInt(req.query.createdBy as string) || null;
      
      // Construir la consulta de filtrado
      let whereClause = '';
      const params: any[] = [];
      
      // Añadir filtros a la consulta
      if (search) {
        whereClause += ' AND title ILIKE ?';
        params.push(`%${search}%`);
      }
      
      if (type === 'evergreen') {
        whereClause += ' AND is_evergreen = true';
      } else if (type === 'not-evergreen') {
        whereClause += ' AND is_evergreen = false';
      }
      
      if (createdBy) {
        whereClause += ' AND created_by = ?';
        params.push(createdBy);
      }
      
      // Obtener el total de registros
      // Construcción segura de la consulta SQL
      const whereClauseSql = whereClause ? sql.raw(whereClause) : sql.raw('');
      
      const countResult = await db.execute(sql`
        SELECT COUNT(*) as total
        FROM training_title_examples
        WHERE 1=1 ${whereClauseSql}
      `);
      
      // Extraer el total de la consulta
      let totalRows = 0;
      if (Array.isArray(countResult) && countResult.length > 0) {
        totalRows = parseInt(String(countResult[0].total));
      } else if (countResult.rows && countResult.rows.length > 0) {
        totalRows = parseInt(String(countResult.rows[0].total));
      }
      
      // Consulta paginada con filtros
      // Construcción segura de la consulta SQL
      const orderBySql = sortBy ? sql.raw(sortBy) : sql.raw('id');
      const sortDirSql = sortDir ? sql.raw(sortDir) : sql.raw('ASC');
      
      const examples = await db.execute(sql`
        SELECT id, title, is_evergreen, created_at, created_by
        FROM training_title_examples
        WHERE 1=1 ${whereClauseSql}
        ORDER BY ${orderBySql} ${sortDirSql}
        LIMIT ${limit} OFFSET ${offset}
      `);
      
      // Manejar diferentes formatos de resultados
      let rows = Array.isArray(examples) ? examples : 
                (examples.rows && Array.isArray(examples.rows) ? examples.rows : 
                (typeof examples === 'object' ? Object.values(examples) : []));
      
      // Calcular metadatos de paginación
      const totalPages = Math.ceil(totalRows / limit);
      
      return res.status(200).json({
        success: true,
        data: rows,
        pagination: {
          total: totalRows,
          page,
          limit,
          totalPages
        }
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

  // Operaciones en lote para ejemplos de entrenamiento (eliminar múltiples, actualizar múltiples)
  app.post('/api/titulin/training-examples/bulk', requireAuth, async (req: Request, res: Response) => {
    try {
      const { operation, ids, data } = req.body as BulkOperation;
      
      if (!operation || !ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Operación inválida o lista de IDs vacía'
        });
      }
      
      // Validar que todos los IDs sean numéricos
      const numericIds = ids.map(id => parseInt(String(id), 10))
                            .filter(id => !isNaN(id));
      
      if (numericIds.length !== ids.length) {
        return res.status(400).json({
          success: false,
          message: 'Algunos IDs no son válidos'
        });
      }
      
      // Formatear los IDs para la consulta SQL
      const idsString = numericIds.join(',');
      
      let result;
      
      if (operation === 'delete') {
        // Eliminar múltiples ejemplos
        result = await db.execute(sql`
          DELETE FROM training_title_examples 
          WHERE id IN (${sql.raw(idsString)})
          RETURNING id
        `);
      } else if (operation === 'update' && data) {
        // Actualizar múltiples ejemplos
        // Solo actualizamos is_evergreen por ahora
        if (data.is_evergreen !== undefined) {
          result = await db.execute(sql`
            UPDATE training_title_examples 
            SET is_evergreen = ${!!data.is_evergreen} 
            WHERE id IN (${sql.raw(idsString)})
            RETURNING id, title, is_evergreen
          `);
        } else {
          return res.status(400).json({
            success: false,
            message: 'No se proporcionaron datos para actualizar'
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: 'Operación no soportada'
        });
      }
      
      // Manejar diferentes formatos de resultados
      let rows = Array.isArray(result) ? result : 
                (result.rows && Array.isArray(result.rows) ? result.rows : 
                (typeof result === 'object' ? Object.values(result) : []));
      
      return res.status(200).json({
        success: true,
        message: `Operación ${operation} completada exitosamente`,
        affectedCount: rows.length,
        data: rows
      });
    } catch (error: any) {
      console.error(`Error en operación masiva de ejemplos:`, error);
      return res.status(500).json({
        success: false,
        message: 'Error al realizar la operación masiva',
        details: error.message
      });
    }
  });
  
  // Exportar ejemplos de entrenamiento (CSV)
  app.get('/api/titulin/training-examples/export', requireAuth, async (req: Request, res: Response) => {
    try {
      // Parámetros de filtrado para la exportación
      const type = (req.query.type as string) || 'all';
      
      // Construir la consulta de filtrado
      let whereClause = '';
      
      if (type === 'evergreen') {
        whereClause += ' WHERE is_evergreen = true';
      } else if (type === 'not-evergreen') {
        whereClause += ' WHERE is_evergreen = false';
      }
      
      // Obtener todos los ejemplos que coincidan con el filtro
      const examples = await db.execute(sql`
        SELECT id, title, is_evergreen, created_at
        FROM training_title_examples
        ${sql.raw(whereClause)}
        ORDER BY id
      `);
      
      // Manejar diferentes formatos de resultados
      let rows = Array.isArray(examples) ? examples : 
                (examples.rows && Array.isArray(examples.rows) ? examples.rows : 
                (typeof examples === 'object' ? Object.values(examples) : []));
      
      // Formatear para CSV
      const csvHeader = 'ID,Título,Evergreen,Fecha de Creación\n';
      const csvRows = rows.map(row => {
        return `${row.id},"${row.title.replace(/"/g, '""')}",${row.is_evergreen ? 'Sí' : 'No'},"${new Date(row.created_at).toISOString()}"`;
      }).join('\n');
      
      const csvContent = csvHeader + csvRows;
      
      // Configurar cabeceras para descarga
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=ejemplos-entrenamiento-${new Date().toISOString().split('T')[0]}.csv`);
      
      return res.status(200).send(csvContent);
    } catch (error: any) {
      console.error('Error al exportar ejemplos:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al exportar ejemplos de entrenamiento',
        details: error.message
      });
    }
  });

  // Importar ejemplos de entrenamiento desde un canal de YouTube
  app.post('/api/titulin/training-examples/import-from-channel', requireAuth, async (req: Request, res: Response) => {
    try {
      const { channelId, isEvergreen = true } = req.body;
      
      if (!channelId) {
        return res.status(400).json({
          success: false,
          message: 'El ID del canal es obligatorio'
        });
      }
      
      // Obtener usuario actual
      const userId = req.user?.id;
      
      // Obtener videos del canal desde la base de datos
      const videos = await db.execute(sql`
        SELECT yt.id, yt.title, yt.video_id, yt.channel_id
        FROM youtube_videos yt
        JOIN youtube_channels ch ON yt.channel_id = ch.channel_id
        WHERE ch.channel_id = ${channelId}
        LIMIT 100
      `);
      
      // Manejar diferentes formatos de resultados
      let rows = Array.isArray(videos) ? videos : 
                (videos.rows && Array.isArray(videos.rows) ? videos.rows : 
                (typeof videos === 'object' ? Object.values(videos) : []));
      
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No se encontraron videos para este canal'
        });
      }
      
      // Preparar los títulos para inserción
      const titles = rows.map(video => video.title);
      
      // Insertar en lotes
      let insertedCount = 0;
      const batchSize = 50;
      
      for (let i = 0; i < titles.length; i += batchSize) {
        const batch = titles.slice(i, i + batchSize);
        
        // Generar SQL para inserción en lote
        const valuesSql = batch.map(title => 
          `('${title.replace(/'/g, "''")}', ${!!isEvergreen}, ${userId})`
        ).join(',');
        
        const result = await db.execute(sql`
          INSERT INTO training_title_examples 
          (title, is_evergreen, created_by)
          VALUES ${sql.raw(valuesSql)}
          ON CONFLICT (title) DO NOTHING
          RETURNING id
        `);
        
        // Manejar diferentes formatos de resultados
        let insertedRows = Array.isArray(result) ? result : 
                (result.rows && Array.isArray(result.rows) ? result.rows : 
                (typeof result === 'object' ? Object.values(result) : []));
        
        insertedCount += insertedRows.length;
      }
      
      return res.status(200).json({
        success: true,
        message: `${insertedCount} títulos importados como ${isEvergreen ? 'evergreen' : 'no evergreen'} desde el canal de YouTube`,
        totalProcessed: rows.length,
        totalImported: insertedCount
      });
    } catch (error: any) {
      console.error('Error al importar desde canal:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al importar títulos desde el canal de YouTube',
        details: error.message
      });
    }
  });
  
  // Importar ejemplos de entrenamiento desde CSV
  app.post('/api/titulin/training-examples/import', requireAuth, upload.single('file'), async (req: Request, res: Response) => {
    try {
      // Verificar que se subió un archivo
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionó ningún archivo'
        });
      }

      // Obtener usuario actual
      const userId = req.user?.id;
      
      // Leer el archivo
      const fileContent = await fs.readFile(req.file.path, 'utf8');
      
      // Procesar el CSV
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
        skip_records_with_empty_values: true
      });
      
      // Verificar que hay registros
      if (!records || !Array.isArray(records) || records.length === 0) {
        await fs.unlink(req.file.path);  // Eliminar el archivo temporal
        return res.status(400).json({
          success: false,
          message: 'El archivo no contiene registros válidos'
        });
      }
      
      // Preparar datos para inserción en lotes
      const insertData: { title: string, isEvergreen: boolean }[] = [];
      const expectedColumns = ['Título', 'Evergreen'];
      
      // Validar y transformar registros
      for (const record of records) {
        // Determinar las columnas reales
        const columns = Object.keys(record);
        
        // Verificar que al menos están las columnas mínimas necesarias
        const hasTitle = columns.some(col => 
          col.toLowerCase() === 'título' || 
          col.toLowerCase() === 'titulo' || 
          col.toLowerCase() === 'title'
        );
        
        const hasEvergreen = columns.some(col => 
          col.toLowerCase() === 'evergreen' || 
          col.toLowerCase() === 'es_evergreen' || 
          col.toLowerCase() === 'is_evergreen'
        );
        
        if (!hasTitle || !hasEvergreen) {
          continue; // Saltamos este registro
        }
        
        // Obtener los valores
        const titleKey = columns.find(col => 
          col.toLowerCase() === 'título' || 
          col.toLowerCase() === 'titulo' || 
          col.toLowerCase() === 'title'
        ) || '';
        
        const evergreenKey = columns.find(col => 
          col.toLowerCase() === 'evergreen' || 
          col.toLowerCase() === 'es_evergreen' || 
          col.toLowerCase() === 'is_evergreen'
        ) || '';
        
        const title = record[titleKey];
        let isEvergreen = record[evergreenKey];
        
        // Validar título
        if (!title || typeof title !== 'string' || title.trim() === '') {
          continue;
        }
        
        // Normalizar el valor de evergreen
        if (typeof isEvergreen === 'string') {
          isEvergreen = isEvergreen.toLowerCase();
          isEvergreen = isEvergreen === 'true' || 
                        isEvergreen === 'sí' || 
                        isEvergreen === 'si' ||
                        isEvergreen === 'yes' || 
                        isEvergreen === '1' ||
                        isEvergreen === 'verdadero';
        } else {
          isEvergreen = !!isEvergreen;
        }
        
        // Añadir a los datos de inserción
        insertData.push({
          title: title.trim(),
          isEvergreen: !!isEvergreen
        });
      }
      
      // Verificar que hay datos para importar
      if (insertData.length === 0) {
        await fs.unlink(req.file.path);  // Eliminar el archivo temporal
        return res.status(400).json({
          success: false,
          message: 'No se encontraron registros válidos para importar'
        });
      }
      
      // Insertar los registros en lotes
      let insertedCount = 0;
      const batchSize = 100;
      
      for (let i = 0; i < insertData.length; i += batchSize) {
        const batch = insertData.slice(i, i + batchSize);
        
        // Generar consulta SQL para inserción en lote
        const valuesSql = batch.map(item => `('${item.title.replace(/'/g, "''")}', ${item.isEvergreen}, ${userId})`).join(',');
        
        const result = await db.execute(sql`
          INSERT INTO training_title_examples 
          (title, is_evergreen, created_by)
          VALUES ${sql.raw(valuesSql)}
          ON CONFLICT (title) DO NOTHING
          RETURNING id
        `);
        
        // Manejar diferentes formatos de resultados
        let rows = Array.isArray(result) ? result : 
                  (result.rows && Array.isArray(result.rows) ? result.rows : 
                  (typeof result === 'object' ? Object.values(result) : []));
        
        insertedCount += rows.length;
      }
      
      // Eliminar el archivo temporal
      await fs.unlink(req.file.path);
      
      return res.status(200).json({
        success: true,
        message: `${insertedCount} ejemplos importados correctamente de ${insertData.length} registros procesados`,
        totalProcessed: insertData.length,
        totalImported: insertedCount
      });
    } catch (error: any) {
      console.error('Error al importar ejemplos:', error);
      
      // Intentar eliminar el archivo temporal en caso de error
      if (req.file?.path) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Error al eliminar archivo temporal:', unlinkError);
        }
      }
      
      return res.status(500).json({
        success: false,
        message: 'Error al importar ejemplos de entrenamiento',
        details: error.message
      });
    }
  });
}