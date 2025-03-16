import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle } from 'lucide-react';
import api from '@/lib/axios';

interface AffiliateBadgeProps {
  companyName: string;
  isIncluded?: boolean;
}

/**
 * Badge que muestra información sobre un enlace de afiliado requerido
 * Si el enlace ya está incluido, se muestra en verde
 * Si no está incluido, se muestra en rojo con un icono de alerta
 */
export function AffiliateBadge({ companyName, isIncluded = false }: AffiliateBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={isIncluded ? "outline" : "destructive"}
            className={`flex items-center gap-1 text-xs ${
              isIncluded 
                ? 'border-green-500 text-green-700 bg-green-50 hover:bg-green-100' 
                : 'border-red-200'
            }`}
          >
            {!isIncluded && <AlertCircle className="w-3 h-3" />}
            <span>{isIncluded ? 'Afiliado: ' : 'Requiere: '}{companyName}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isIncluded 
              ? `Enlace de afiliado para ${companyName} incluido correctamente.` 
              : `Se requiere incluir un enlace de afiliado para ${companyName}.`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Contenedor para múltiples badges de afiliados
 * Puede recibir directamente los afiliados o buscarlos por videoId y título
 */
interface AffiliatesBadgeContainerProps {
  affiliates?: Array<{
    id: number;
    companyName: string;
    isIncluded: boolean;
  }>;
  videoId?: number;
  title?: string;
  className?: string;
}

export function AffiliatesBadgeContainer({ affiliates: initialAffiliates, videoId, title, className = '' }: AffiliatesBadgeContainerProps) {
  const [affiliates, setAffiliates] = useState(initialAffiliates || []);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Si ya tenemos afiliados o no tenemos videoId, no hacemos nada
    if (initialAffiliates || !videoId) return;
    
    const fetchAffiliates = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/affiliates/videos/${videoId}/matches`);
        
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          const formattedAffiliates = response.data.data.map((aff: any) => ({
            id: aff.id,
            companyName: aff.company.name,
            isIncluded: aff.included_by_youtuber
          }));
          setAffiliates(formattedAffiliates);
        }
      } catch (error) {
        console.error("Error fetching affiliates:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAffiliates();
  }, [videoId, initialAffiliates]);
  
  if (loading) {
    return <div className="text-xs text-gray-400">Cargando afiliados...</div>;
  }
  
  if (!affiliates || affiliates.length === 0) return null;
  
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {affiliates.map(affiliate => (
        <AffiliateBadge 
          key={affiliate.id}
          companyName={affiliate.companyName}
          isIncluded={affiliate.isIncluded}
        />
      ))}
    </div>
  );
}