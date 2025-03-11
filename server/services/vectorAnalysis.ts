import { OpenAI } from 'openai';
import { sql } from 'drizzle-orm';
import { pgTable, serial, text, timestamp, real, boolean, integer } from 'drizzle-orm/pg-core';
import { db } from '@db';
import { type YoutubeVideo } from '@db/schema';

// Inicializar cliente de OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Definir el esquema para title_embeddings usando un enfoque diferente para PostgreSQL
// No definimos las tablas con drizzle ya que ya las creamos directamente con SQL
// Usamos simplemente el tipo para TypeScript

interface TitleEmbedding {
  id: number;
  video_id: number;
  title: string;
  embedding: unknown;
  is_evergreen: boolean;
  confidence: number;
  created_at: Date;
}

/**
 * Genera un embedding para un texto usando OpenAI
 * @param text Texto para generar el embedding
 * @returns Vector de embeddings
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error al generar embedding:', error);
    throw new Error('Error al generar el embedding del título');
  }
}

/**
 * Obtiene ejemplos de títulos evergreen y no evergreen de la base de datos
 * @param limit Límite de ejemplos a obtener para cada categoría
 * @returns Objeto con arrays de ejemplos
 */
async function getTrainingExamples(limit: number = 10): Promise<{
  evergreenExamples: string[];
  nonEvergreenExamples: string[];
}> {
  try {
    // Obtener ejemplos evergreen con límite
    const evergreenQuery = await db.execute(sql`
      SELECT title 
      FROM training_title_examples 
      WHERE is_evergreen = true
      AND vector_processed = true
      ORDER BY RANDOM()
      LIMIT ${limit}
    `);
    
    // Obtener ejemplos no evergreen con límite
    const nonEvergreenQuery = await db.execute(sql`
      SELECT title 
      FROM training_title_examples 
      WHERE is_evergreen = false
      AND vector_processed = true
      ORDER BY RANDOM()
      LIMIT ${limit}
    `);
    
    // Normalizar resultados para evergreen
    const evergreenRows = Array.isArray(evergreenQuery) ? evergreenQuery : 
                (evergreenQuery.rows && Array.isArray(evergreenQuery.rows) ? evergreenQuery.rows : 
                (typeof evergreenQuery === 'object' ? Object.values(evergreenQuery) : []));
    
    // Normalizar resultados para no evergreen
    const nonEvergreenRows = Array.isArray(nonEvergreenQuery) ? nonEvergreenQuery : 
                (nonEvergreenQuery.rows && Array.isArray(nonEvergreenQuery.rows) ? nonEvergreenQuery.rows : 
                (typeof nonEvergreenQuery === 'object' ? Object.values(nonEvergreenQuery) : []));
    
    // Extraer los títulos
    const evergreenExamples: string[] = evergreenRows.map((row: any) => row.title);
    const nonEvergreenExamples: string[] = nonEvergreenRows.map((row: any) => row.title);
    
    // Si no hay suficientes ejemplos, añadir algunos por defecto
    if (evergreenExamples.length < 3) {
      const defaultExamples = [
        "Cómo hacer pan casero - Tutorial completo",
        "5 ejercicios para fortalecer la espalda",
        "Guía definitiva para aprender a tocar guitarra",
        "Aprende inglés en 10 minutos al día",
        "Tutorial: Cómo configurar WordPress desde cero"
      ];
      
      for (const example of defaultExamples) {
        if (evergreenExamples.length < 5) {
          evergreenExamples.push(example);
        }
      }
    }
    
    if (nonEvergreenExamples.length < 3) {
      const defaultExamples = [
        "Reacción al tráiler de la película que se estrena mañana",
        "Predicciones para tendencias de 2023",
        "Análisis de las elecciones presidenciales",
        "Lo mejor que ha pasado esta semana en YouTube",
        "Novedades para iPhone en el evento de Apple"
      ];
      
      for (const example of defaultExamples) {
        if (nonEvergreenExamples.length < 5) {
          nonEvergreenExamples.push(example);
        }
      }
    }
    
    console.log(`Ejemplos obtenidos: ${evergreenExamples.length} evergreen, ${nonEvergreenExamples.length} no evergreen`);
    return { evergreenExamples, nonEvergreenExamples };
  } catch (error) {
    console.error('Error al obtener ejemplos de entrenamiento:', error);
    
    // Devolver ejemplos por defecto en caso de error
    return {
      evergreenExamples: [
        "Cómo hacer pan casero - Tutorial completo",
        "5 ejercicios para fortalecer la espalda",
        "Guía definitiva para aprender a tocar guitarra",
        "Aprende inglés en 10 minutos al día",
        "Tutorial: Cómo configurar WordPress desde cero"
      ],
      nonEvergreenExamples: [
        "Reacción al tráiler de la película que se estrena mañana",
        "Predicciones para tendencias de 2023",
        "Análisis de las elecciones presidenciales",
        "Lo mejor que ha pasado esta semana en YouTube",
        "Novedades para iPhone en el evento de Apple"
      ]
    };
  }
}

/**
 * Analiza un título para determinar si es evergreen usando un enfoque híbrido
 * que combina similitud de vectores y análisis de GPT cuando es necesario
 * @param title Título del video
 * @param videoId ID del video
 * @returns Objeto con el resultado del análisis
 */
export async function analyzeTitle(title: string, videoId: number): Promise<{
  isEvergreen: boolean;
  confidence: number;
  reason: string;
}> {
  try {
    console.log(`Iniciando análisis de evergreen para video ${videoId} usando vectores`);
    console.log(`Analizando título: "${title}"`);
    
    // Generar embedding para el título
    const titleEmbedding = await generateEmbedding(title);
    
    // PASO 1: Buscar títulos similares en nuestra base de datos
    const similarTitles = await findSimilarTitles(title, 5);
    console.log('Resultados de búsqueda de títulos similares:', JSON.stringify(similarTitles));
    
    // PASO 2: Implementar sistema de votación ponderada si hay suficientes títulos similares
    // Solo consideramos títulos con similaridad >= 0.7
    const validSimilarTitles = similarTitles.filter(t => t.similarity >= 0.7);
    
    // Si tenemos al menos 3 títulos similares válidos, usamos el sistema de votación
    if (validSimilarTitles.length >= 3) {
      let votesEvergreen = 0;
      let votesNonEvergreen = 0;
      
      // Calcular los votos ponderados por similitud
      for (const similarTitle of validSimilarTitles) {
        const weight = similarTitle.similarity; // Peso basado en la similitud
        if (similarTitle.isEvergreen) {
          votesEvergreen += weight;
        } else {
          votesNonEvergreen += weight;
        }
      }
      
      // Determinar resultado y confianza basados en votos
      const totalVotes = votesEvergreen + votesNonEvergreen;
      const isEvergreen = votesEvergreen > votesNonEvergreen;
      const confidence = isEvergreen 
        ? votesEvergreen / totalVotes 
        : votesNonEvergreen / totalVotes;
      
      // Si la confianza es alta (>= 0.7), usar el resultado basado en vectores
      if (confidence >= 0.7) {
        const result = {
          isEvergreen,
          confidence: parseFloat(confidence.toFixed(2)),
          reason: isEvergreen
            ? `Este título es considerado evergreen con ${(confidence * 100).toFixed(0)}% de confianza basado en ${validSimilarTitles.length} títulos similares. La mayoría de títulos similares también son evergreen.`
            : `Este título no es considerado evergreen con ${(confidence * 100).toFixed(0)}% de confianza basado en ${validSimilarTitles.length} títulos similares. La mayoría de títulos similares no son evergreen.`
        };
        
        // Almacenar el resultado en la base de datos
        await db.execute(sql`
          INSERT INTO title_embeddings 
          (video_id, title, embedding, is_evergreen, confidence, created_at) 
          VALUES (
            ${videoId}, 
            ${title}, 
            ${JSON.stringify(titleEmbedding)}::vector, 
            ${result.isEvergreen}, 
            ${result.confidence}, 
            NOW()
          )
        `);
        
        console.log(`Análisis completado para video ${videoId}: Evergreen: ${result.isEvergreen}, Confianza: ${result.confidence}`);
        return result;
      }
    }
    
    // PASO 3: Si no podemos decidir con suficiente confianza basados en vectores, usamos GPT-4
    // Obtener ejemplos de entrenamiento
    const { evergreenExamples, nonEvergreenExamples } = await getTrainingExamples();
    console.log(`Ejemplos obtenidos: ${evergreenExamples.length} evergreen, ${nonEvergreenExamples.length} no evergreen`);
    
    // Construir ejemplos para el prompt
    const evergreenExamplesText = evergreenExamples.map(ex => `- "${ex}"`).join('\n');
    const nonEvergreenExamplesText = nonEvergreenExamples.map(ex => `- "${ex}"`).join('\n');
    
    // Añadir los títulos más similares al prompt para dar contexto específico
    let similarTitlesContext = '';
    if (similarTitles.length > 0) {
      const evergreen = similarTitles.filter(t => t.isEvergreen && t.similarity >= 0.75);
      const nonEvergreen = similarTitles.filter(t => !t.isEvergreen && t.similarity >= 0.75);
      
      if (evergreen.length > 0) {
        similarTitlesContext += '\n# Títulos similares que son evergreen:\n';
        similarTitlesContext += evergreen.map(t => `- "${t.title}" (similaridad: ${(t.similarity * 100).toFixed(0)}%)`).join('\n');
      }
      
      if (nonEvergreen.length > 0) {
        similarTitlesContext += '\n# Títulos similares que NO son evergreen:\n';
        similarTitlesContext += nonEvergreen.map(t => `- "${t.title}" (similaridad: ${(t.similarity * 100).toFixed(0)}%)`).join('\n');
      }
    }
    
    // Usar GPT-4 para analizar si el título es evergreen con un prompt mejorado
    const prompt = `
    Analiza el siguiente título de YouTube y determina si es "evergreen" (contenido atemporal) o no.
    
    Título: "${title}"
    
    # Criterios para contenido evergreen
    Un título "evergreen" debe cumplir LA MAYORÍA de estos criterios:
    1. Abordar temas relevantes a largo plazo que las personas buscan constantemente
    2. Enseñar a usar funciones básicas de aplicaciones populares como WhatsApp, Instagram, etc.
    3. Mostrar cómo hacer algo que seguirá siendo útil por un período prolongado
    4. Proporcionar soluciones a problemas comunes y recurrentes
    5. Generalmente usa términos como "cómo", "guía", "tutorial", "consejos", "activar", etc.
    
    # Criterios para contenido NO evergreen
    Un título probablemente NO es evergreen si cumple VARIOS de estos criterios:
    1. Menciona eventos específicos, noticias, o tendencias de corta duración
    2. Incluye fechas, años específicos, o referencias explícitamente temporales
    3. Se refiere a versiones beta o muy específicas que serán reemplazadas pronto
    4. Contiene reacciones, opiniones o comentarios sobre eventos específicos
    5. Utiliza términos explícitamente temporales como "recién lanzado", "última noticia", etc.
    
    # Consideraciones especiales
    - Los tutoriales sobre funciones específicas de aplicaciones populares como WhatsApp, Facebook, Instagram, etc. generalmente SON evergreen porque estas funciones, aunque cambien ligeramente, siguen siendo buscadas constantemente
    - Los "trucos" o "consejos" para estas aplicaciones también suelen ser evergreen ya que las personas los buscan continuamente
    
    # Ejemplos de títulos evergreen:
    ${evergreenExamplesText}
    
    # Ejemplos de títulos NO evergreen:
    ${nonEvergreenExamplesText}
    ${similarTitlesContext}
    
    # Instrucciones para el análisis
    1. Analiza el título cuidadosamente según los criterios anteriores
    2. Considera especialmente los títulos similares y su clasificación (si se proporcionan)
    3. Determina si es evergreen o no
    4. Asigna un nivel de confianza entre 0.0 y 1.0
    5. Proporciona una explicación clara de tu decisión
    6. Responde EXACTAMENTE en este formato JSON:
    
    {
      "isEvergreen": true/false,
      "confidence": 0.0-1.0,
      "reason": "Explicación detallada de la decisión basada en los criterios anteriores"
    }
    `;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: "Eres un asistente especializado en análisis de contenido de YouTube. Tu tarea es determinar si un título es 'evergreen' (contenido atemporal) o no." },
        { role: "user", content: prompt }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });
    
    const content = completion.choices[0].message.content;
    const analysisResult = content ? JSON.parse(content) : { isEvergreen: false, confidence: 0, reason: "Error al analizar el título" };
    
    // Almacenar el resultado en la base de datos usando SQL directo
    await db.execute(sql`
      INSERT INTO title_embeddings 
      (video_id, title, embedding, is_evergreen, confidence, created_at) 
      VALUES (
        ${videoId}, 
        ${title}, 
        ${JSON.stringify(titleEmbedding)}::vector, 
        ${analysisResult.isEvergreen}, 
        ${analysisResult.confidence}, 
        NOW()
      )
    `);
    
    console.log(`Análisis completado para video ${videoId}: Evergreen: ${analysisResult.isEvergreen}, Confianza: ${analysisResult.confidence}`);
    return analysisResult;
  } catch (error) {
    console.error('Error en el análisis de título:', error);
    return {
      isEvergreen: false,
      confidence: 0,
      reason: "Error en el proceso de análisis"
    };
  }
}

/**
 * Busca títulos similares usando embeddings
 * @param title Título para buscar similitudes
 * @param limit Número máximo de resultados
 * @returns Array de títulos similares con su puntuación
 */
export async function findSimilarTitles(title: string, limit: number = 5): Promise<Array<{
  videoId: number;
  title: string;
  similarity: number;
  isEvergreen: boolean;
}>> {
  try {
    const titleEmbedding = await generateEmbedding(title);
    
    const results = await db.execute<{
      video_id: number;
      title: string;
      similarity: number;
      is_evergreen: boolean;
    }>(sql`
      SELECT 
        video_id, 
        title, 
        1 - (embedding <=> ${JSON.stringify(titleEmbedding)}::vector) as similarity,
        is_evergreen
      FROM title_embeddings
      ORDER BY similarity DESC
      LIMIT ${limit}
    `);
    
    // Aseguramos de siempre obtener un array para procesar
    if (!results) return [];
    
    // Manejar diferentes formatos de resultados que podría devolver Drizzle
    let rows: any[] = [];
    if (Array.isArray(results)) {
      rows = results;
    } else if (results.rows && Array.isArray(results.rows)) {
      rows = results.rows;
    } else if (typeof results === 'object') {
      // Intenta convertir a array si es posible
      rows = Object.values(results);
    }
    
    console.log('Resultados de búsqueda de títulos similares:', JSON.stringify(rows));
    
    if (!Array.isArray(rows) || rows.length === 0) {
      return [];
    }
    
    return rows.map((row: any) => ({
      videoId: row.video_id,
      title: row.title,
      similarity: parseFloat(row.similarity) || 0,
      isEvergreen: !!row.is_evergreen
    }));
  } catch (error) {
    console.error('Error al buscar títulos similares:', error);
    return [];
  }
}

/**
 * Actualiza el estado de análisis de un video en youtube_videos
 * @param videoId ID del video
 * @param analyzed Estado de análisis
 * @param analysisData Datos del análisis
 */
export async function updateVideoAnalysisStatus(
  videoId: number, 
  analyzed: boolean, 
  analysisData: { isEvergreen: boolean; confidence: number; reason: string } | null
): Promise<void> {
  try {
    await db.execute(sql`
      UPDATE youtube_videos
      SET analyzed = ${analyzed}, analysis_data = ${analysisData ? JSON.stringify(analysisData) : null}
      WHERE id = ${videoId}
    `);
  } catch (error) {
    console.error('Error al actualizar estado de análisis:', error);
    throw new Error('Error al actualizar el estado de análisis del video');
  }
}

/**
 * Obtiene un lote de videos sin analizar
 * @param limit Tamaño del lote
 * @returns Array de videos sin analizar
 */
export async function getUnanalyzedVideos(limit: number = 10): Promise<YoutubeVideo[]> {
  try {
    const videos = await db.execute(sql`
      SELECT *
      FROM youtube_videos
      WHERE analyzed = false
      LIMIT ${limit}
    `);
    
    return videos as unknown as YoutubeVideo[];
  } catch (error) {
    console.error('Error al obtener videos sin analizar:', error);
    return [];
  }
}

/**
 * Procesa los embeddings para ejemplos de entrenamiento con mejor manejo de lotes
 * y reintento de operaciones fallidas
 * @param ids IDs de los ejemplos a procesar
 * @returns Número de ejemplos procesados
 */
export async function processTrainingExamplesVectors(ids: number[]): Promise<number> {
  if (!ids || ids.length === 0) {
    return 0;
  }
  
  try {
    // Configuración de procesamiento
    let processedCount = 0;
    let failedCount = 0;
    const totalCount = ids.length;
    
    // Procesar en lotes más grandes para la consulta inicial
    const queryBatchSize = 50; // Lotes más grandes para la consulta inicial
    const processBatchSize = 5; // Lotes más pequeños para el procesamiento de embeddings
    
    console.log(`Iniciando procesamiento de vectores para ${totalCount} ejemplos de entrenamiento`);
    
    // 1. Procesar por lotes más grandes para la consulta inicial
    for (let i = 0; i < ids.length; i += queryBatchSize) {
      const queryBatch = ids.slice(i, i + queryBatchSize);
      
      console.log(`Obteniendo ejemplos del lote ${Math.floor(i/queryBatchSize) + 1}/${Math.ceil(totalCount/queryBatchSize)} (IDs ${queryBatch[0]}-${queryBatch[queryBatch.length-1]})`);
      
      // Obtener los ejemplos a procesar en este lote
      const examples = await db.execute(sql`
        SELECT id, title, is_evergreen 
        FROM training_title_examples 
        WHERE id IN (${sql.raw(queryBatch.join(','))})
          AND (vector_processed IS NULL OR vector_processed = false)
      `);
      
      // Normalizar el formato de resultados
      let rows: any[] = [];
      if (Array.isArray(examples)) {
        rows = examples;
      } else if (examples.rows && Array.isArray(examples.rows)) {
        rows = examples.rows;
      } else if (typeof examples === 'object') {
        rows = Object.values(examples);
      }
      
      if (rows.length === 0) {
        console.log(`No se encontraron ejemplos sin procesar en el lote ${Math.floor(i/queryBatchSize) + 1}`);
        continue;
      }
      
      console.log(`Encontrados ${rows.length} ejemplos para procesar en el lote actual`);
      
      // 2. Procesar cada sub-lote para la generación de embeddings (evitar sobrecargar la API)
      for (let j = 0; j < rows.length; j += processBatchSize) {
        const processBatch = rows.slice(j, j + processBatchSize);
        
        console.log(`Procesando sub-lote ${Math.floor(j/processBatchSize) + 1}/${Math.ceil(rows.length/processBatchSize)} de vectores`);
        
        // Crear una cola de promesas para procesar cada elemento en paralelo
        const promises = processBatch.map(async (example) => {
          try {
            // Intentar generar embedding para el título con reintento
            let embedding = null;
            let retryCount = 0;
            const maxRetries = 2;
            
            while (retryCount <= maxRetries) {
              try {
                embedding = await generateEmbedding(example.title);
                break; // Si tiene éxito, salir del bucle
              } catch (embeddingError) {
                retryCount++;
                if (retryCount > maxRetries) throw embeddingError;
                // Esperar antes de reintentar (backoff exponencial)
                const delay = 1000 * Math.pow(2, retryCount);
                console.log(`Reintento ${retryCount}/${maxRetries} para ejemplo ${example.id} en ${delay}ms`);
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            }
            
            if (!embedding) throw new Error("No se pudo generar el embedding después de reintentos");
            
            // Actualizar el ejemplo con el embedding
            await db.execute(sql`
              UPDATE training_title_examples 
              SET embedding = ${JSON.stringify(embedding)}::vector,
                  vector_processed = true,
                  updated_at = NOW()
              WHERE id = ${example.id}
            `);
            
            return { success: true, id: example.id };
          } catch (error) {
            console.error(`Error al procesar vector para ejemplo ${example.id}:`, error);
            return { success: false, id: example.id, error };
          }
        });
        
        // Esperar a que todas las promesas se resuelvan
        const results = await Promise.all(promises);
        
        // Contabilizar éxitos y fallos
        const subBatchSuccess = results.filter(r => r.success).length;
        const subBatchFailed = results.filter(r => !r.success).length;
        
        processedCount += subBatchSuccess;
        failedCount += subBatchFailed;
        
        console.log(`Resultados del sub-lote: ${subBatchSuccess} procesados, ${subBatchFailed} fallidos. Total acumulado: ${processedCount}/${totalCount}`);
      }
    }
    
    console.log(`Procesamiento de vectores completado. Total: ${processedCount} procesados, ${failedCount} fallidos`);
    return processedCount;
  } catch (error) {
    console.error('Error al procesar vectores de ejemplos:', error);
    throw new Error('Error al procesar vectores de ejemplos de entrenamiento');
  }
}