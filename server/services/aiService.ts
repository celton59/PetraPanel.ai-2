/**
 * Servicio de inteligencia artificial para análisis de videos
 * 
 * Este servicio proporciona funciones para analizar contenido de YouTube
 * y determinar patrones, tendencias y características específicas como si es evergreen.
 */

import axios from 'axios';
import { db } from '@db';
import { youtube_videos } from '@db/schema';
import { eq } from 'drizzle-orm';

interface AnalysisOptions {
  includeTranscription?: boolean;
  detailedAnalysis?: boolean;
  language?: string;
}

export interface VideoAnalysisResult {
  isEvergreen: boolean;
  confidence: number;
  reason: string;
  detailedInsights?: {
    timelessFactor: number;
    searchabilityScore: number;
    relevanceScore: number;
    engagementPotential: number;
    competitionLevel: string;
    recommendedKeywords?: string[];
    improvementSuggestions?: string[];
  };
}

export class AIService {
  private apiKey: string | undefined;
  
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
  }

  /**
   * Analiza un video de YouTube para determinar si es evergreen
   * 
   * Los contenidos evergreen son aquellos que permanecen relevantes a lo largo del tiempo
   * y continúan generando tráfico y visualizaciones mucho después de su publicación.
   * 
   * @param videoId ID del video en la base de datos
   * @param options Opciones para personalizar el análisis
   * @returns Resultado del análisis
   */
  async analyzeEvergreenContent(videoId: number, options: AnalysisOptions = {}): Promise<VideoAnalysisResult> {
    // Verificar configuración de API
    if (!this.apiKey) {
      throw new Error('API key no configurada. Por favor, configura OPENAI_API_KEY en las variables de entorno.');
    }

    // Obtener información del video desde la base de datos
    const videoData = await db.select()
      .from(youtube_videos)
      .where(eq(youtube_videos.id, videoId))
      .execute();

    if (!videoData || videoData.length === 0) {
      throw new Error('Video no encontrado');
    }

    const video = videoData[0];

    // Preparar datos para el análisis
    const videoContext = {
      title: video.title,
      description: video.description || '',
      tags: video.tags || [],
      viewCount: video.viewCount,
      likeCount: video.likeCount,
      commentCount: video.commentCount,
      publishedAt: video.publishedAt,
      duration: video.duration,
    };

    try {
      // Realizar análisis con IA
      const result = await this.performAIAnalysis(videoContext, options);
      
      // Guardar resultados en la base de datos
      await db.update(youtube_videos)
        .set({
          analyzed: true,
          analysisData: result,
          updatedAt: new Date()
        })
        .where(eq(youtube_videos.id, videoId))
        .execute();

      return result;
    } catch (error) {
      console.error('Error en análisis de IA:', error);
      throw new Error(`Error al analizar el contenido: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Realiza el análisis de IA utilizando OpenAI
   * 
   * @param videoContext Datos del video a analizar
   * @param options Opciones de análisis
   * @returns Resultado del análisis
   */
  private async performAIAnalysis(videoContext: any, options: AnalysisOptions): Promise<VideoAnalysisResult> {
    try {
      // Sistema de análisis basado en reglas si la API no está disponible
      if (!this.apiKey) {
        return this.fallbackRuleBasedAnalysis(videoContext);
      }

      // Crear prompt para el análisis
      const prompt = this.createAnalysisPrompt(videoContext, options);

      // Llamar a la API de OpenAI
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Eres un experto en análisis de contenido de YouTube y marketing digital. Tu tarea es evaluar si un video tiene potencial para ser contenido "evergreen" (perenne) basándote en sus características y métricas.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      // Procesar la respuesta
      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('La API no devolvió contenido válido');
      }

      // Parsear el resultado
      const analysisResult = JSON.parse(content);
      
      // Validar y estructurar el resultado
      return {
        isEvergreen: analysisResult.isEvergreen || false,
        confidence: analysisResult.confidence || 0.5,
        reason: analysisResult.reason || 'No se proporcionó razón',
        detailedInsights: options.detailedAnalysis ? {
          timelessFactor: analysisResult.detailedInsights?.timelessFactor || 0,
          searchabilityScore: analysisResult.detailedInsights?.searchabilityScore || 0,
          relevanceScore: analysisResult.detailedInsights?.relevanceScore || 0,
          engagementPotential: analysisResult.detailedInsights?.engagementPotential || 0,
          competitionLevel: analysisResult.detailedInsights?.competitionLevel || 'Medio',
          recommendedKeywords: analysisResult.detailedInsights?.recommendedKeywords || [],
          improvementSuggestions: analysisResult.detailedInsights?.improvementSuggestions || []
        } : undefined
      };
    } catch (error) {
      console.error('Error en análisis de OpenAI:', error);
      
      // Si falla la API, usar análisis basado en reglas como respaldo
      return this.fallbackRuleBasedAnalysis(videoContext);
    }
  }

  /**
   * Crea el prompt para el análisis de IA
   */
  private createAnalysisPrompt(videoContext: any, options: AnalysisOptions): string {
    const detailedMode = options.detailedAnalysis ? 
      'Proporciona un análisis detallado incluyendo factores de atemporalidad, potencial de búsqueda, relevancia, engagement potencial, nivel de competencia, keywords recomendadas y sugerencias de mejora.' :
      'Proporciona un análisis básico indicando si es evergreen, nivel de confianza y razón principal.';
    
    return `Analiza este video de YouTube y determina si califica como "contenido evergreen" (contenido perenne que mantiene su relevancia y valor a lo largo del tiempo).

DATOS DEL VIDEO:
- Título: "${videoContext.title}"
- Descripción: "${videoContext.description.substring(0, 500)}${videoContext.description.length > 500 ? '...' : ''}"
- Etiquetas: ${JSON.stringify(videoContext.tags)}
- Visualizaciones: ${videoContext.viewCount}
- Me gusta: ${videoContext.likeCount}
- Comentarios: ${videoContext.commentCount}
- Fecha de publicación: ${videoContext.publishedAt}
- Duración: ${videoContext.duration}

INSTRUCCIONES:
${detailedMode}

Considera factores como:
1. Atemporalidad del tema
2. Tipo de contenido (tutorial, informativo, entretenimiento)
3. Potencial de búsqueda continua
4. Calidad del engagement (ratio likes/vistas)
5. Título y palabras clave utilizadas

FORMATO DE RESPUESTA (JSON):
{
  "isEvergreen": boolean,
  "confidence": number (0.0 a 1.0),
  "reason": string,
  ${options.detailedAnalysis ? `"detailedInsights": {
    "timelessFactor": number (0.0 a 1.0),
    "searchabilityScore": number (0.0 a 1.0),
    "relevanceScore": number (0.0 a 1.0),
    "engagementPotential": number (0.0 a 1.0),
    "competitionLevel": string,
    "recommendedKeywords": string[],
    "improvementSuggestions": string[]
  }` : ''}
}`;
  }

  /**
   * Sistema de reglas básico para análisis cuando la API no está disponible
   */
  private fallbackRuleBasedAnalysis(videoContext: any): VideoAnalysisResult {
    // 1. Verificar palabras clave en el título que indican contenido evergreen
    const evergreenKeywords = ['cómo', 'tutorial', 'guía', 'aprende', 'consejos', 'trucos', 'explicado'];
    const nonEvergreenKeywords = ['tendencia', 'noticias', 'actualidad', 'hoy', '2023', '2024', 'temporada', 'evento'];
    
    const titleLower = videoContext.title.toLowerCase();
    const hasEvergreenKeywords = evergreenKeywords.some(keyword => titleLower.includes(keyword));
    const hasNonEvergreenKeywords = nonEvergreenKeywords.some(keyword => titleLower.includes(keyword));
    
    // 2. Verificar ratio de engagement (likes/views)
    const engagementRatio = videoContext.viewCount > 0 ? videoContext.likeCount / videoContext.viewCount : 0;
    const highEngagement = engagementRatio > 0.05; // 5% o más
    
    // 3. Analizar la descripción
    const descriptionLower = videoContext.description.toLowerCase();
    const hasDetailedDescription = videoContext.description.length > 300;
    
    // 4. Verificar si tiene etiquetas
    const hasTags = videoContext.tags && videoContext.tags.length > 3;
    
    // Calcular puntaje evergreen (0-100)
    let evergreenScore = 0;
    
    if (hasEvergreenKeywords) evergreenScore += 30;
    if (!hasNonEvergreenKeywords) evergreenScore += 20;
    if (highEngagement) evergreenScore += 20;
    if (hasDetailedDescription) evergreenScore += 15;
    if (hasTags) evergreenScore += 15;
    
    // Determinar si es evergreen
    const isEvergreen = evergreenScore >= 60;
    const confidence = evergreenScore / 100;
    
    // Determinar razón
    let reason = '';
    if (isEvergreen) {
      if (hasEvergreenKeywords) reason = 'El título contiene palabras clave asociadas a contenido duradero como tutoriales o guías';
      else if (highEngagement) reason = 'Alto nivel de engagement sugiere contenido de valor duradero';
      else reason = 'Combinación de factores positivos indica potencial evergreen';
    } else {
      if (hasNonEvergreenKeywords) reason = 'El título contiene términos temporales como fechas o tendencias actuales';
      else if (!hasDetailedDescription) reason = 'Descripción insuficiente para posicionamiento a largo plazo';
      else reason = 'Combinación de factores indica contenido de relevancia temporal';
    }
    
    return {
      isEvergreen,
      confidence,
      reason
    };
  }
}

// Exportar una instancia del servicio para uso en toda la aplicación
export const aiService = new AIService();