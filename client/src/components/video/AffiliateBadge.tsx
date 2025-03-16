import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AffiliateBadgeProps {
  companyName: string;
  isIncluded: boolean;
  className?: string;
}

/**
 * Componente para mostrar un badge de empresa afiliada con su estado
 */
export function AffiliateBadge({ 
  companyName, 
  isIncluded, 
  className = '' 
}: AffiliateBadgeProps) {
  return (
    <Badge 
      variant={isIncluded ? "secondary" : "outline"} 
      className={cn(
        "gap-1 items-center flex py-1", 
        isIncluded ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400 border border-green-200 dark:border-green-800" : 
                    "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border border-amber-200 dark:border-amber-800",
        className
      )}
    >
      {isIncluded ? (
        <ShieldCheck className="h-3 w-3" />
      ) : (
        <AlertCircle className="h-3 w-3" />
      )}
      <span className="text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">
        {companyName}
      </span>
    </Badge>
  );
}

interface AffiliateInfo {
  id: number;
  companyName: string;
  isIncluded: boolean;
}

interface AffiliatesBadgeContainerProps {
  affiliates: AffiliateInfo[];
  className?: string;
  limit?: number;
}

/**
 * Contenedor para mostrar múltiples badges de afiliados con límite opcional
 */
export function AffiliatesBadgeContainer({ 
  affiliates, 
  className = '',
  limit = 3
}: AffiliatesBadgeContainerProps) {
  if (!affiliates || affiliates.length === 0) {
    return null;
  }
  
  // Obtener el total de afiliados incluidos y pendientes
  const includedCount = affiliates.filter(a => a.isIncluded).length;
  const pendingCount = affiliates.length - includedCount;
  
  // Determinar si mostrar el badge de contador
  const showCounter = affiliates.length > limit;
  
  // Limitar la cantidad de badges a mostrar
  const visibleAffiliates = showCounter ? affiliates.slice(0, limit) : affiliates;
  
  // Número de badges adicionales que no se muestran
  const hiddenCount = affiliates.length - visibleAffiliates.length;
  
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {visibleAffiliates.map(affiliate => (
        <AffiliateBadge
          key={affiliate.id}
          companyName={affiliate.companyName}
          isIncluded={affiliate.isIncluded}
        />
      ))}
      
      {showCounter && (
        <Badge 
          variant="outline" 
          className="bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-400 border-gray-200 dark:border-gray-800"
        >
          +{hiddenCount} más
        </Badge>
      )}
    </div>
  );
}

/**
 * Componente para mostrar un indicador compacto del estado de afiliados
 */
export function AffiliateStatusIndicator({ 
  pendingCount, 
  isCompact = false 
}: { 
  pendingCount: number, 
  isCompact?: boolean 
}) {
  if (pendingCount === 0) return null;
  
  return (
    <div 
      className={cn(
        "flex items-center gap-1 px-1.5 py-0.5 rounded-full",
        isCompact 
          ? "text-xs bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30" 
          : "text-sm bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 px-2 py-1"
      )}
    >
      <AlertCircle className={isCompact ? "w-3 h-3" : "w-4 h-4"} />
      {!isCompact && (
        <span>{pendingCount} afiliado{pendingCount !== 1 ? 's' : ''} pendiente{pendingCount !== 1 ? 's' : ''}</span>
      )}
      {isCompact && pendingCount > 0 && (
        <span className="font-medium">{pendingCount}</span>
      )}
    </div>
  );
}