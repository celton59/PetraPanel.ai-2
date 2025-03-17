import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AffiliateBadge } from './AffiliateBadge';
import { ApiVideo } from '@/hooks/useVideos';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AffiliateManagerProps {
  video: ApiVideo;
  className?: string;
}

interface AffiliateMatch {
  id: number;
  companyName: string;
  companyLogo?: string | null;
  companyUrl?: string | null;
  isIncluded: boolean;
}

export function AffiliateManager({ video, className }: AffiliateManagerProps) {
  const [affiliates, setAffiliates] = useState<AffiliateMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

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
        companyLogo: affiliate.company?.logo_url,
        companyUrl: affiliate.company?.affiliate_url,
        isIncluded: affiliate.included_by_youtuber || false
      }));
      
      setAffiliates(formattedAffiliates);
    } catch (error) {
      console.error('Error al cargar afiliados:', error);
      setAffiliates([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAffiliateInclusion = async (matchId: number, included: boolean) => {
    setUpdatingId(matchId);
    
    try {
      const response = await axios.put(`/api/affiliates/matches/${matchId}/inclusion`, {
        included
      });
      
      if (response.data.success) {
        // Actualizar el estado localmente
        setAffiliates(prevAffiliates => 
          prevAffiliates.map(affiliate => 
            affiliate.id === matchId 
              ? { ...affiliate, isIncluded: included } 
              : affiliate
          )
        );
        
        toast.success(`Enlace de afiliado ${included ? 'marcado como incluido' : 'marcado como no incluido'}`);
      } else {
        throw new Error('Error al actualizar el estado del afiliado');
      }
    } catch (error) {
      console.error('Error al actualizar estado de afiliado:', error);
      toast.error('No se pudo actualizar el estado del afiliado');
    } finally {
      setUpdatingId(null);
    }
  };

  // Si no hay afiliados, no mostrar nada
  if (!isLoading && affiliates.length === 0) {
    return null;
  }

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      {/* Barra de acento superior */}
      <div className="h-1 w-full bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 absolute top-0 left-0"></div>
      
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Enlaces de Afiliados</CardTitle>
        <CardDescription>
          Verifica que todos los enlaces de afiliados requeridos estén incluidos en la descripción
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {affiliates.map(affiliate => (
              <div key={affiliate.id} className="flex items-center justify-between gap-2 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {affiliate.companyLogo && (
                    <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                      <img 
                        src={affiliate.companyLogo} 
                        alt={affiliate.companyName} 
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-1 min-w-0">
                    <div className="font-medium text-sm line-clamp-1">{affiliate.companyName}</div>
                    {affiliate.companyUrl && (
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        <a 
                          href={affiliate.companyUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {affiliate.companyUrl}
                        </a>
                      </div>
                    )}
                    
                    <AffiliateBadge 
                      companyName={affiliate.companyName} 
                      isIncluded={affiliate.isIncluded}
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`affiliate-${affiliate.id}`}
                    checked={affiliate.isIncluded}
                    onCheckedChange={(checked) => handleToggleAffiliateInclusion(affiliate.id, checked)}
                    disabled={updatingId === affiliate.id}
                  />
                  <Label htmlFor={`affiliate-${affiliate.id}`} className="cursor-pointer">
                    {updatingId === affiliate.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      affiliate.isIncluded ? 'Incluido' : 'No incluido'
                    )}
                  </Label>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}