import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoIcon, DownloadIcon } from "lucide-react";
import { TrainingTitleExample } from "@db/schema";

interface EmbeddingVisualizerProps {
  examples: TrainingTitleExample[];
  className?: string;
}

export function EmbeddingVisualizer({ examples, className = "" }: EmbeddingVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<string>("2d");
  const [selectedPoint, setSelectedPoint] = useState<TrainingTitleExample | null>(null);
  const [hoverPoint, setHoverPoint] = useState<TrainingTitleExample | null>(null);
  
  // Filtramos los ejemplos que tienen embedding
  const processedExamples = examples.filter(ex => ex.embedding && ex.embedding && ex.embedding.length > 0);
  
  // Aplicar PCA de forma simple para reducir los embeddings a 2D/3D
  // Nota: Esta es una implementación muy simple para visualización, 
  // una implementación real usaría bibliotecas como TensorFlow.js o ml.js
  const applySimplePCA = (examples: TrainingTitleExample[], dimensions: 2 | 3 = 2) => {
    if (examples.length === 0 || !examples[0].embedding) return [];
    
    // En un caso real, esta función implementaría PCA o t-SNE apropiadamente
    // Para simplificar, solo usamos las primeras dimensiones del embedding
    
    return examples.map(example => {
      if (!example.embedding) return { ...example, projected: null };
      
      // Por simplicidad, tomamos los primeros "dimensions" valores como coordenadas
      // Esto no es PCA real, solo una simplificación para la visualización
      const projected = example.embedding.slice(0, dimensions);
      
      // Normalizamos para que quede en el rango -1 a 1
      const maxVal = Math.max(...projected.map(Math.abs));
      const normalized = projected.map(val => val / (maxVal || 1));
      
      return {
        ...example,
        projected: normalized
      };
    });
  };
  
  // Dibujar la visualización 2D
  const draw2DVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Limpio el canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Obtengo ejemplos procesados con PCA
    const projectedExamples = applySimplePCA(processedExamples, 2);
    if (projectedExamples.length === 0) return;
    
    // Dibujo ejes
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    // Eje X
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    
    // Eje Y
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    
    // Dibujo puntos
    projectedExamples.forEach((example) => {
      if (!example.projected) return;
      
      const [x, y] = example.projected;
      const pointX = ((x + 1) / 2) * canvas.width;
      const pointY = ((y + 1) / 2) * canvas.height;
      
      // Tamaño del punto basado en hover o selección
      let pointSize = 5;
      if (hoverPoint?.id === example.id) pointSize = 8;
      if (selectedPoint?.id === example.id) pointSize = 10;
      
      // Color basado en si es evergreen o no
      ctx.fillStyle = example.isEvergreen
        ? 'rgba(34, 197, 94, 0.8)' // verde para evergreen
        : 'rgba(249, 115, 22, 0.8)'; // naranja para no evergreen
        
      // Si es el punto seleccionado, añadir borde
      if (selectedPoint?.id === example.id || hoverPoint?.id === example.id) {
        ctx.strokeStyle = example.isEvergreen ? '#16a34a' : '#ea580c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pointX, pointY, pointSize + 2, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // Dibujar punto
      ctx.beginPath();
      ctx.arc(pointX, pointY, pointSize, 0, Math.PI * 2);
      ctx.fill();
    });
  };
  
  // Manejar interacción con el canvas
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Obtener posición relativa al canvas
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convertir a coordenadas normalizadas (-1 a 1)
    const normalizedX = (x / canvas.width) * 2 - 1;
    const normalizedY = (y / canvas.height) * 2 - 1;
    
    // Obtener ejemplos proyectados
    const projectedExamples = applySimplePCA(processedExamples, 2);
    
    // Buscar el punto más cercano
    let closestPoint = null;
    let minDistance = 0.1; // Umbral de detección
    
    for (const example of projectedExamples) {
      if (!example.projected) continue;
      
      const [exX, exY] = example.projected;
      const distance = Math.sqrt(Math.pow(exX - normalizedX, 2) + Math.pow(exY - normalizedY, 2));
      
      if (distance < minDistance) {
        closestPoint = example;
        minDistance = distance;
      }
    }
    
    setHoverPoint(closestPoint);
  };
  
  // Manejar clic en el canvas
  const handleCanvasClick = () => {
    setSelectedPoint(hoverPoint);
  };
  
  // Manejar salida del mouse del canvas
  const handleCanvasMouseOut = () => {
    setHoverPoint(null);
  };
  
  // Generar una imagen de la visualización actual
  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'embedding-visualization.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Actualizar el canvas cuando cambian los ejemplos o la pestaña activa
  useEffect(() => {
    if (activeTab === '2d') {
      draw2DVisualization();
    }
    // En una implementación completa, tendríamos un manejador para la vista 3D
  }, [examples, activeTab, hoverPoint, selectedPoint]);
  
  // Ajustar tamaño del canvas al contenedor
  useEffect(() => {
    const updateCanvasSize = () => {
      const wrapper = canvasWrapperRef.current;
      const canvas = canvasRef.current;
      if (!wrapper || !canvas) return;
      
      canvas.width = wrapper.clientWidth;
      canvas.height = wrapper.clientHeight;
      
      // Redibujar con el nuevo tamaño
      if (activeTab === '2d') {
        draw2DVisualization();
      }
    };
    
    // Actualizar tamaño inicial
    updateCanvasSize();
    
    // Actualizar cuando la ventana cambie de tamaño
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [activeTab]);
  
  const countVectorizedExamples = examples.filter(ex => ex.embedding).length;
  const countEvergreenVectorized = examples.filter(ex => ex.embedding && ex.isEvergreen).length;
  const countNonEvergreenVectorized = examples.filter(ex => ex.embedding && !ex.isEvergreen).length;
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center space-x-2">
            <span>Visualización de embeddings</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <InfoIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Esta visualización muestra una proyección 2D de los vectores de embedding de los ejemplos.
                    Los puntos verdes son ejemplos evergreen y los naranjas son no evergreen.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadImage}>
              <DownloadIcon className="h-4 w-4 mr-1" />
              <span>Exportar</span>
            </Button>
          </div>
        </div>
        <CardDescription>
          {countVectorizedExamples} ejemplos vectorizados ({countEvergreenVectorized} evergreen, {countNonEvergreenVectorized} no evergreen)
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="2d" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6">
            <TabsList className="w-full max-w-xs mx-auto grid grid-cols-2">
              <TabsTrigger value="2d">Vista 2D</TabsTrigger>
              <TabsTrigger value="3d" disabled>Vista 3D (Próximamente)</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="2d" className="mt-0">
            <div className="relative">
              <div 
                ref={canvasWrapperRef} 
                className="w-full h-[400px] overflow-hidden"
              >
                <canvas 
                  ref={canvasRef} 
                  className="w-full h-full cursor-pointer"
                  onMouseMove={handleCanvasMouseMove}
                  onClick={handleCanvasClick}
                  onMouseOut={handleCanvasMouseOut}
                />
              </div>
              
              {/* Leyenda */}
              <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm p-2 rounded-md border shadow-sm">
                <div className="flex flex-col gap-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-green-500"></span>
                    <span>Evergreen</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-orange-500"></span>
                    <span>No evergreen</span>
                  </div>
                </div>
              </div>
              
              {/* Información del punto seleccionado o hover */}
              {(selectedPoint || hoverPoint) && (
                <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm p-3 rounded-md border shadow-sm max-w-[300px]">
                  <div className="space-y-2">
                    <div className="flex gap-2 items-center">
                      <Badge 
                        variant={selectedPoint?.isEvergreen || hoverPoint?.isEvergreen ? "default" : "outline"}
                        className={`${selectedPoint?.isEvergreen || hoverPoint?.isEvergreen ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-orange-100 text-orange-800 hover:bg-orange-100"}`}
                      >
                        {selectedPoint?.isEvergreen || hoverPoint?.isEvergreen ? "Evergreen" : "No Evergreen"}
                      </Badge>
                      {selectedPoint?.confidence !== undefined && (
                        <Badge variant="outline">
                          Confianza: {Math.round(parseFloat(selectedPoint.confidence ?? '0') * 100)}%
                        </Badge>
                      )}
                    </div>
                    <div className="font-medium text-sm">
                      {selectedPoint?.title || hoverPoint?.title}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="3d">
            <div className="flex items-center justify-center h-[400px] text-center text-muted-foreground">
              <div>
                <p>Vista 3D próximamente</p>
                <p className="text-xs">Estamos trabajando en esta función</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {processedExamples.length === 0 && (
          <div className="flex items-center justify-center h-[400px] text-center text-muted-foreground">
            <div>
              <p>No hay suficientes ejemplos vectorizados</p>
              <p className="text-xs">Añade ejemplos y asegúrate de que tengan embeddings generados</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}