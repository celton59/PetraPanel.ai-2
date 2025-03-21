import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle } from 'lucide-react';

interface AffiliateBadgeProps {
  companyName: string;
  isIncluded?: boolean;
  companyLogo?: string | null;
  companyUrl?: string | null;
}

/**
 * Badge que muestra información sobre un enlace de afiliado requerido
 * Si el enlace ya está incluido, se muestra en verde
 * Si no está incluido, se muestra en rojo con un icono de alerta
 */
export function AffiliateBadge({ companyName, isIncluded = false, companyLogo, companyUrl }: AffiliateBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={isIncluded ? "outline" : "destructive"}
            className={`flex items-center gap-1 text-xs font-medium ${
              isIncluded 
                ? 'border-green-500 text-green-700 bg-green-50 hover:bg-green-100 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800' 
                : 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800'
            }`}
          >
            {/* Imagen del logo, si está disponible */}
            {companyLogo && (
              <img 
                src={companyLogo} 
                alt={`Logo de ${companyName}`} 
                className="w-3.5 h-3.5 object-contain mr-0.5" 
              />
            )}
            
            {/* Icono de alerta sólo si no está incluido y no hay logo */}
            {!isIncluded && !companyLogo && <AlertCircle className="w-3 h-3" />}
            
            <span>{isIncluded ? 'Afiliado: ' : 'Requiere: '}{companyName}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="flex flex-col gap-2">
            <p>
              {isIncluded 
                ? `Enlace de afiliado para ${companyName} incluido correctamente.` 
                : `Se requiere incluir un enlace de afiliado para ${companyName}.`}
            </p>
            
            {companyUrl && (
              <p className="text-xs text-muted-foreground">
                URL: {companyUrl}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Contenedor para múltiples badges de afiliados
 */
interface AffiliatesBadgeContainerProps {
  affiliates: Array<{
    id: number;
    companyName: string;
    isIncluded: boolean;
    companyLogo?: string | null;
    companyUrl?: string | null;
  }>;
  className?: string;
}

export function AffiliatesBadgeContainer({ affiliates, className = '' }: AffiliatesBadgeContainerProps) {
  if (!affiliates || affiliates.length === 0) return null;
  
  // Filtramos para mostrar primero los no incluidos (que requieren acción)
  const pendingAffiliates = affiliates.filter(a => !a.isIncluded);
  const includedAffiliates = affiliates.filter(a => a.isIncluded);
  
  return (
    <div className={`flex flex-wrap gap-2 my-1.5 ${className}`}>
      {/* Mostramos primero los pendientes */}
      {pendingAffiliates.map(affiliate => (
        <AffiliateBadge 
          key={affiliate.id}
          companyName={affiliate.companyName}
          isIncluded={affiliate.isIncluded}
          companyLogo={affiliate.companyLogo}
          companyUrl={affiliate.companyUrl}
        />
      ))}
      
      {/* Luego los ya incluidos */}
      {includedAffiliates.map(affiliate => (
        <AffiliateBadge 
          key={affiliate.id}
          companyName={affiliate.companyName}
          isIncluded={affiliate.isIncluded}
          companyLogo={affiliate.companyLogo}
          companyUrl={affiliate.companyUrl}
        />
      ))}
    </div>
  );
}