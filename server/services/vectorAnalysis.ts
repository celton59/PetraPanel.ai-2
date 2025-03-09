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
async function generateEmbedding(text: string): Promise<number[]> {
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
 * @returns Objeto con arrays de ejemplos
 */
async function getTrainingExamples(): Promise<{
  evergreenExamples: string[];
  nonEvergreenExamples: string[];
}> {
  try {
    const examples = await db.execute(sql`
      SELECT title, is_evergreen 
      FROM training_title_examples 
      ORDER BY id
    `);
    
    const rows = Array.isArray(examples) ? examples : 
                (examples.rows && Array.isArray(examples.rows) ? examples.rows : 
                (typeof examples === 'object' ? Object.values(examples) : []));
    
    // Construir arrays separados para títulos evergreen y no evergreen
    const evergreenExamples: string[] = [];
    const nonEvergreenExamples: string[] = [];
    
    if (Array.isArray(rows)) {
      rows.forEach((row: any) => {
        if (row.is_evergreen) {
          evergreenExamples.push(row.title);
        } else {
          nonEvergreenExamples.push(row.title);
        }
      });
    }
    
    // Si no hay ejemplos, usar algunos por defecto
    if (evergreenExamples.length === 0) {
      evergreenExamples.push("Cómo hacer pan casero - Tutorial completo");
      evergreenExamples.push("5 ejercicios para fortalecer la espalda");
      evergreenExamples.push("Guía definitiva para aprender a tocar guitarra");
    }
    
    if (nonEvergreenExamples.length === 0) {
      nonEvergreenExamples.push("Reacción al tráiler de la película que se estrena mañana");
      nonEvergreenExamples.push("Predicciones para tendencias de 2023");
      nonEvergreenExamples.push("Análisis de las elecciones presidenciales");
    }
    
    return { evergreenExamples, nonEvergreenExamples };
  } catch (error) {
    console.error('Error al obtener ejemplos de entrenamiento:', error);
    
    // Devolver ejemplos por defecto en caso de error
    return {
      evergreenExamples: [
        "Cómo hacer pan casero - Tutorial completo",
        "5 ejercicios para fortalecer la espalda",
        "Guía definitiva para aprender a tocar guitarra"
      ],
      nonEvergreenExamples: [
        "Reacción al tráiler de la película que se estrena mañana",
        "Predicciones para tendencias de 2023",
        "Análisis de las elecciones presidenciales"
      ]
    };
  }
}

/**
 * Analiza un título para determinar si es evergreen
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
    // Generar embedding para el título
    const titleEmbedding = await generateEmbedding(title);
    
    // Obtener ejemplos de entrenamiento
    const { evergreenExamples, nonEvergreenExamples } = await getTrainingExamples();
    
    // Construir ejemplos para el prompt
    const evergreenExamplesText = evergreenExamples.map(ex => `- "${ex}"`).join('\n');
    const nonEvergreenExamplesText = nonEvergreenExamples.map(ex => `- "${ex}"`).join('\n');
    
    // Usar GPT para analizar si el título es evergreen
    const prompt = `
    Analiza el siguiente título de YouTube y determina si es "evergreen" (contenido atemporal) o no.
    
    Título: "${title}"
    
    Un título "evergreen" tiene estas características:
    - Aborda temas que son relevantes a lo largo del tiempo, no atados a eventos actuales o modas pasajeras
    - Responde a preguntas o problemas universales que la gente siempre busca
    - No menciona fechas específicas, años, o eventos temporales
    - Suele incluir términos como "cómo", "guía", "tutorial", "tips", etc.
    
    Ejemplos de títulos evergreen:
    ${evergreenExamplesText}
    
    Ejemplos de títulos NO evergreen:
    ${nonEvergreenExamplesText}
    
    Responde en formato JSON con esta estructura exacta:
    {
      "isEvergreen": true/false,
      "confidence": 0.0-1.0,
      "reason": "Explicación de la decisión"
    }
    `;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Eres un asistente de análisis de contenido de YouTube." },
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