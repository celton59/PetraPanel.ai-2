import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AffiliateBadge } from "./AffiliateBadge";
import { useVideoAffiliates } from "@/hooks/useVideoAffiliates";
import { AlertCircle, CheckCircle, ExternalLink, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AffiliateManagerProps {
  videoId: number;
  videoTitle?: string;
  className?: string;
}

export function AffiliateManager({ videoId, videoTitle, className = '' }: AffiliateManagerProps) {
  const { 
    affiliates, 
    isLoading, 
    error,
    updateAffiliateStatus,
    pendingAffiliates,
    hasAffiliates
  } = useVideoAffiliates(videoId);

  const [updating, setUpdating] = useState<Record<number, boolean>>({});

  if (isLoading) {
    return (
      <Card className={`border shadow-sm ${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-gray-200 animate-pulse"></div>
            Cargando afiliados...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error al cargar afiliados: {error instanceof Error ? error.message : 'Error desconocido'}
        </AlertDescription>
      </Alert>
    );
  }

  if (!hasAffiliates) {
    return null; // No mostrar nada si no hay afiliados
  }

  const handleToggleAffiliate = async (affiliateId: number, currentStatus: boolean) => {
    setUpdating(prev => ({ ...prev, [affiliateId]: true }));
    try {
      await updateAffiliateStatus(affiliateId, !currentStatus);
    } finally {
      setUpdating(prev => ({ ...prev, [affiliateId]: false }));
    }
  };

  return (
    <Card className={`border shadow-sm ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <ExternalLink className="h-4 w-4 text-primary" />
          Enlaces de Afiliado Requeridos
        </CardTitle>
        <CardDescription>
          Este video menciona empresas que requieren incluir enlaces de afiliado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {affiliates.map(affiliate => (
            <div key={affiliate.id} className={`p-3 rounded-md border ${
              affiliate.included_by_youtuber 
                ? 'bg-green-50 border-green-100 dark:bg-green-900/10 dark:border-green-900/30' 
                : 'bg-amber-50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30'
            } transition-colors`}>
              <div className="flex justify-between items-center">
                <div className="flex items-start gap-3">
                  <div className="flex items-center h-5 pt-0.5">
                    <Checkbox 
                      id={`affiliate-${affiliate.id}`}
                      checked={affiliate.included_by_youtuber}
                      onCheckedChange={() => handleToggleAffiliate(affiliate.id, affiliate.included_by_youtuber)}
                      disabled={updating[affiliate.id]}
                      className={`${
                        affiliate.included_by_youtuber 
                          ? 'text-green-500 border-green-500 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500' 
                          : ''
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <label 
                      htmlFor={`affiliate-${affiliate.id}`}
                      className={`text-sm font-medium ${
                        affiliate.included_by_youtuber 
                          ? 'text-green-700 dark:text-green-400' 
                          : 'text-amber-700 dark:text-amber-400'
                      } mb-1 block cursor-pointer`}
                    >
                      {affiliate.included_by_youtuber ? 'Incluido' : 'Pendiente'}: Enlace de {affiliate.company.name}
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {affiliate.included_by_youtuber
                        ? `Enlace de afiliado para ${affiliate.company.name} incluido correctamente.`
                        : `Se debe incluir un enlace de afiliado para ${affiliate.company.name} en el video.`
                      }
                    </p>
                  </div>
                </div>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`h-8 w-8 ${
                          affiliate.included_by_youtuber 
                            ? 'text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' 
                            : 'text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                        }`}
                      >
                        {affiliate.included_by_youtuber 
                          ? <CheckCircle className="h-5 w-5" /> 
                          : <Info className="h-5 w-5" />
                        }
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {affiliate.included_by_youtuber
                        ? 'Este enlace de afiliado ya está incluido'
                        : 'Este enlace de afiliado debe ser incluido'
                      }
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          ))}
        </div>

        {pendingAffiliates > 0 && (
          <div className="mt-4">
            <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30">
              <Info className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              <AlertDescription className="text-blue-600 dark:text-blue-300 text-xs">
                Después de incluir los enlaces de afiliado, marca cada uno como completado para evitar advertencias.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
}