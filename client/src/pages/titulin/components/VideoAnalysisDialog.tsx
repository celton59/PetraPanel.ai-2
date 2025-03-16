import React, { useState } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Loader2 } from 'lucide-react';
import { TitulinVideo } from '@/hooks/useTitulin';

interface VideoAnalysisDialogProps {
  video: TitulinVideo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAnalysisComplete?: (data: any) => void;
}

interface SimilarTitle {
  videoId: number;
  title: string;
  similarity: number;
  isEvergreen: boolean;
}

interface AnalysisResult {
  videoId: number;
  title: string;
  isEvergreen: boolean;
  confidence: number;
  reason: string;
  similarTitles: SimilarTitle[];
}

export function VideoAnalysisDialog({ 
  video, 
  open, 
  onOpenChange,
  onAnalysisComplete
}: VideoAnalysisDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const analyzeVideo = async () => {
    if (!video) return;
    
    setIsLoading(true);
    try {
      const response = await axios.post(`/api/titulin/videos/${video.id}/analyze`);
      
      if (response.data.success) {
        setAnalysisResult(response.data.data);
        if (onAnalysisComplete) {
          onAnalysisComplete(response.data.data);
        }
        toast({
          title: "Análisis completado",
          description: "El video ha sido analizado con éxito",
        });
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Error al analizar el video",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.details || error.message || "Error al analizar el video",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.75) return "bg-green-500";
    if (confidence >= 0.5) return "bg-amber-500";
    return "bg-red-500";
  };

  const renderAnalysisState = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-lg font-medium">Analizando título...</p>
          <p className="text-sm text-muted-foreground mt-2">
            Estamos utilizando IA para determinar si este título es evergreen.
          </p>
        </div>
      );
    }

    if (!analysisResult) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="h-10 w-10 text-primary mb-4" />
          <p className="text-lg font-medium">Listo para analizar</p>
          <p className="text-sm text-muted-foreground mt-2 text-center max-w-md">
            El análisis determinará si el título del video es "evergreen" (contenido atemporal) 
            y encontrará títulos similares en la base de datos.
          </p>
          <Button 
            className="mt-6" 
            onClick={analyzeVideo}
            disabled={isLoading}
          >
            Iniciar análisis
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6 py-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Resultado del análisis</CardTitle>
                <CardDescription>Análisis de título con IA</CardDescription>
              </div>
              {analysisResult.isEvergreen ? (
                <Badge className="bg-green-500 hover:bg-green-600">Evergreen</Badge>
              ) : (
                <Badge className="bg-amber-500 hover:bg-amber-600">No Evergreen</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <h4 className="font-medium mb-1">Título</h4>
              <p className="text-sm text-muted-foreground">{analysisResult.title}</p>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <h4 className="font-medium">Confianza</h4>
                <span className="text-sm">{Math.round(analysisResult.confidence * 100)}%</span>
              </div>
              <Progress value={analysisResult.confidence * 100} className={getConfidenceColor(analysisResult.confidence)} />
            </div>
            
            <div className="mb-2">
              <h4 className="font-medium mb-1">Explicación</h4>
              <p className="text-sm text-muted-foreground">{analysisResult.reason}</p>
            </div>
          </CardContent>
        </Card>

        {analysisResult.similarTitles && analysisResult.similarTitles.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Títulos similares</CardTitle>
              <CardDescription>
                Basados en similitud semántica usando embeddings vectoriales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {analysisResult.similarTitles.map((similar, index) => (
                  <li key={index} className="border-b border-border pb-3 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{similar.title}</p>
                        <div className="flex items-center mt-1">
                          <span className="text-xs text-muted-foreground mr-2">
                            Similitud: {Math.round(similar.similarity * 100)}%
                          </span>
                          {similar.isEvergreen ? (
                            <Badge variant="outline" className="border-green-500 text-green-500 text-xs">
                              Evergreen
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-amber-500 text-amber-500 text-xs">
                              No Evergreen
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Análisis de título con IA</DialogTitle>
          <DialogDescription>
            Determina si el título es "evergreen" (contenido atemporal) usando análisis vectorial
          </DialogDescription>
        </DialogHeader>

        {renderAnalysisState()}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}