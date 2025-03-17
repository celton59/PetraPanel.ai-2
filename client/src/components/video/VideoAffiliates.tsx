import { useState, useEffect } from 'react';
import { TagIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { AffiliatesBadgeContainer } from './AffiliateBadge';
import { ApiVideo } from '@/hooks/useVideos';
import axios from 'axios';

interface VideoAffiliatesProps {
  video: ApiVideo;
  compact?: boolean;
  showHeader?: boolean;
  className?: string;
}

/**
 * Componente independiente que gestiona la visualización de afiliados requeridos
 * para un video. Ahora separado del componente de colaboradores para darle
 * mayor visibilidad y diferenciación.
 */
export function VideoAffiliates({ 
  video, 
  compact = false, 
  showHeader = true,
  className = ''
}: VideoAffiliatesProps) {
  const [affiliates, setAffiliates] = useState<Array<{
    id: number;
    companyName: string;
    isIncluded: boolean;
    companyLogo?: string | null;
    companyUrl?: string | null;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Solo cargar afiliados si tenemos un videoId
    if (video?.id) {
      fetchAffiliates();
    }
  }, [video?.id]);

  const fetchAffiliates = async () => {
    if (!video?.id) return;
    
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/affiliates/videos/${video.id}/matches`);
      const affiliateData = response.data.data || [];
      
      // Transformar los datos al formato que esperan nuestros componentes
      const formattedAffiliates = affiliateData.map((affiliate: any) => ({
        id: affiliate.id,
        companyName: affiliate.company?.name || 'Desconocido',
        isIncluded: affiliate.included_by_youtuber || false,
        companyLogo: affiliate.company?.logo_url,
        companyUrl: affiliate.company?.affiliate_url
      }));
      
      setAffiliates(formattedAffiliates);
    } catch (error) {
      console.error('Error al cargar afiliados:', error);
      setAffiliates([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Si no hay afiliados o está cargando y no queremos mostrar el contenedor vacío
  if ((affiliates.length === 0 && !isLoading) || (isLoading && affiliates.length === 0)) {
    return null;
  }

  // Contamos cuántos afiliados pendientes hay (para mostrar un contador)
  const pendingCount = affiliates.filter(a => !a.isIncluded).length;

  return (
    <div className={`affiliate-container ${className}`}>
      {/* Cabecera del componente (opcional) */}
      {showHeader && (
        <>
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
            <TagIcon className="w-3.5 h-3.5" />
            <span>Enlaces afiliados</span>
            {pendingCount > 0 && (
              <span className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded-full text-[10px]">
                {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {!compact && <Separator className="my-2" />}
        </>
      )}
      
      {/* Badges de afiliados */}
      {!isLoading && affiliates.length > 0 && (
        <AffiliatesBadgeContainer 
          affiliates={affiliates}
          className={compact ? "" : ""}
        />
      )}
      
      {/* Versión minimalista solo con iconos (para uso en tablas) */}
      {!isLoading && affiliates.length > 0 && showHeader === false && compact && (
        <div className="flex gap-1 items-center">
          {affiliates.length > 0 && (
            <div className="flex -space-x-1">
              {affiliates.slice(0, 3).map(affiliate => (
                <div 
                  key={affiliate.id}
                  className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                    affiliate.isIncluded 
                      ? 'bg-green-50 border-green-200 text-green-600' 
                      : 'bg-amber-50 border-amber-200 text-amber-600'
                  }`}
                  title={`${affiliate.isIncluded ? 'Afiliado' : 'Requiere'}: ${affiliate.companyName}`}
                >
                  {affiliate.companyLogo ? (
                    <img 
                      src={affiliate.companyLogo} 
                      alt={affiliate.companyName}
                      className="w-3 h-3 object-contain" 
                    />
                  ) : (
                    <TagIcon className="w-2.5 h-2.5" />
                  )}
                </div>
              ))}
              {affiliates.length > 3 && (
                <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-medium border border-border">
                  +{affiliates.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}