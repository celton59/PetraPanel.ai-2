import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, AlertTriangle, Database } from "lucide-react";

interface DataQualityMetricsProps {
  totalExamples: number;
  evergreenExamples: number;
  nonEvergreenExamples: number;
  processedVectors: number;
  avgConfidence?: number;
}

export function DataQualityMetrics({
  totalExamples,
  evergreenExamples,
  nonEvergreenExamples,
  processedVectors,
  avgConfidence = 0
}: DataQualityMetricsProps) {
  // Calcular porcentajes
  const evergreenPercentage = totalExamples > 0 ? (evergreenExamples / totalExamples) * 100 : 0;
  const nonEvergreenPercentage = totalExamples > 0 ? (nonEvergreenExamples / totalExamples) * 100 : 0;
  const processedPercentage = totalExamples > 0 ? (processedVectors / totalExamples) * 100 : 0;
  
  // Determinar el nivel de calidad de los datos
  const getQualityLevel = () => {
    if (totalExamples < 10) return { level: "critical", text: "Crítico", icon: <AlertCircle className="h-5 w-5 text-destructive" /> };
    if (totalExamples < 50) return { level: "low", text: "Bajo", icon: <AlertTriangle className="h-5 w-5 text-amber-500" /> };
    if (totalExamples < 200) return { level: "medium", text: "Medio", icon: <Database className="h-5 w-5 text-blue-500" /> };
    return { level: "good", text: "Bueno", icon: <CheckCircle className="h-5 w-5 text-green-500" /> };
  };
  
  const qualityLevel = getQualityLevel();
  
  // Calcular el balance de datos
  const getBalanceLevel = () => {
    // Queremos un ratio cercano a 1:1 entre ejemplos evergreen y no evergreen
    const ratio = evergreenExamples / Math.max(nonEvergreenExamples, 1); // Evitar división por cero
    
    if (ratio < 0.5 || ratio > 2) {
      return { level: "unbalanced", text: "Desbalanceado", icon: <AlertTriangle className="h-5 w-5 text-amber-500" /> };
    }
    return { level: "balanced", text: "Balanceado", icon: <CheckCircle className="h-5 w-5 text-green-500" /> };
  };
  
  const balanceLevel = getBalanceLevel();
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center space-x-2">
          <span>Métricas de calidad de datos</span>
          <span className="text-sm font-normal text-muted-foreground">({totalExamples} ejemplos)</span>
        </CardTitle>
        <CardDescription>
          Estado general de la base de datos de entrenamiento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Calidad general de los datos */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Calidad general</span>
            <Badge variant={
                qualityLevel.level === "critical" ? "destructive" : 
                qualityLevel.level === "low" ? "outline" :
                qualityLevel.level === "medium" ? "secondary" : "default"
              }
              className="flex items-center gap-1"
            >
              {qualityLevel.icon}
              <span>{qualityLevel.text}</span>
            </Badge>
          </div>
          
          <div className="text-xs text-muted-foreground">
            {totalExamples < 100 
              ? "Se recomienda tener al menos 100 ejemplos para un análisis preciso" 
              : "La base de datos tiene suficientes ejemplos para un análisis confiable"}
          </div>
        </div>
        
        {/* Balance entre ejemplos evergreen y no evergreen */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Balance de datos</span>
            <Badge 
              variant={balanceLevel.level === "balanced" ? "default" : "outline"}
              className={`flex items-center gap-1 ${balanceLevel.level === "unbalanced" ? "text-amber-500 border-amber-200" : ""}`}
            >
              {balanceLevel.icon}
              <span>{balanceLevel.text}</span>
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Evergreen ({evergreenExamples})</div>
              <Progress value={evergreenPercentage} className="h-2" />
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">No evergreen ({nonEvergreenExamples})</div>
              <Progress value={nonEvergreenPercentage} className="h-2" />
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            {balanceLevel.level === "balanced" 
              ? "Los datos están bien balanceados entre ejemplos evergreen y no evergreen"
              : "Se recomienda añadir más ejemplos del tipo menos representado"}
          </div>
        </div>
        
        {/* Procesamiento de vectores */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Vectorización</span>
            <span className="text-xs font-medium">
              {processedVectors} de {totalExamples} ({Math.round(processedPercentage)}%)
            </span>
          </div>
          
          <Progress value={processedPercentage} className="h-2" />
          
          <div className="text-xs text-muted-foreground">
            {processedPercentage < 100 
              ? "Algunos ejemplos no tienen embeddings generados" 
              : "Todos los ejemplos están vectorizados correctamente"}
          </div>
        </div>
        
        {/* Confianza promedio */}
        {avgConfidence > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Confianza promedio</span>
              <span className="text-xs font-medium">{Math.round(avgConfidence * 100)}%</span>
            </div>
            
            <Progress value={avgConfidence * 100} className="h-2" />
            
            <div className="text-xs text-muted-foreground">
              {avgConfidence < 0.7 
                ? "La confianza promedio es baja, considera añadir ejemplos más claros" 
                : "Buen nivel de confianza en la clasificación de ejemplos"}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}