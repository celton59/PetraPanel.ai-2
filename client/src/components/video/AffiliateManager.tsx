import React, { useState, useEffect } from 'react';
import { useVideoAffiliates } from '@/hooks/useVideoAffiliates';
import { AffiliatesBadgeContainer } from './AffiliateBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';

interface AffiliateManagerProps {
  videoId: number;
  className?: string;
}

export function AffiliateManager({ videoId, className = '' }: AffiliateManagerProps) {
  const { 
    affiliates, 
    isLoading, 
    updateAffiliateInclusion,
    refreshAffiliates,
    isUpdating,
    hasAffiliates,
    pendingAffiliates
  } = useVideoAffiliates(videoId);
  
  // Estado local para evitar retrasos en la UI durante actualizaciones
  const [includedAffiliates, setIncludedAffiliates] = useState<Record<number, boolean>>({});

  // Inicializar estado local desde los datos cargados
  useEffect(() => {
    if (affiliates.length > 0) {
      const initialState: Record<number, boolean> = {};
      affiliates.forEach(affiliate => {
        initialState[affiliate.id] = affiliate.isIncluded;
      });
      setIncludedAffiliates(initialState);
    }
  }, [affiliates]);

  // Manejar cambio en el estado de inclusión de un afiliado
  const handleAffiliateToggle = async (affiliateId: number, included: boolean) => {
    // Actualizar UI inmediatamente para mejor experiencia
    setIncludedAffiliates(prev => ({
      ...prev,
      [affiliateId]: included
    }));
    
    // Actualizar en el servidor
    try {
      await updateAffiliateInclusion(affiliateId, included);
    } catch (error) {
      // Si hay error, revertir el cambio en UI
      console.error('Error al actualizar estado de afiliado:', error);
      setIncludedAffiliates(prev => ({
        ...prev,
        [affiliateId]: !included
      }));
    }
  };

  // Si no hay afiliados detectados, no mostrar nada
  if (!isLoading && !hasAffiliates) {
    return null;
  }

  // UI para el estado de carga
  if (isLoading && !hasAffiliates) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Enlaces de afiliados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground animate-pulse">
            Buscando afiliados...
          </div>
        </CardContent>
      </Card>
    );
  }

  // Formatear los datos para los badges
  const formattedAffiliates = affiliates.map(affiliate => ({
    id: affiliate.id,
    companyName: affiliate.company?.name || 'Desconocido',
    isIncluded: includedAffiliates[affiliate.id] || false
  }));

  // Verificar si todos los afiliados han sido incluidos
  const allIncluded = affiliates.every(affiliate => includedAffiliates[affiliate.id]);

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              {allIncluded ? (
                <ShieldCheck className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-500" />
              )}
              Enlaces de afiliados
            </CardTitle>
            <CardDescription className="text-xs">
              {allIncluded 
                ? 'Todos los enlaces de afiliados han sido incluidos' 
                : `Se requieren ${pendingAffiliates} enlace${pendingAffiliates !== 1 ? 's' : ''} de afiliado${pendingAffiliates !== 1 ? 's' : ''}`}
            </CardDescription>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 px-2 py-1 text-xs" 
            onClick={() => refreshAffiliates()}
            disabled={isLoading || isUpdating}
          >
            <RefreshCw 
              className={`h-3 w-3 mr-1 ${(isLoading || isUpdating) ? 'animate-spin' : ''}`} 
            />
            Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <AffiliatesBadgeContainer 
            affiliates={formattedAffiliates} 
            className="mb-4" 
          />
          
          <div className="space-y-2">
            {affiliates.map(affiliate => (
              <div key={affiliate.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch 
                    id={`affiliate-${affiliate.id}`}
                    checked={includedAffiliates[affiliate.id] || false}
                    onCheckedChange={(checked) => handleAffiliateToggle(affiliate.id, checked)}
                  />
                  <Label 
                    htmlFor={`affiliate-${affiliate.id}`}
                    className="text-sm cursor-pointer"
                  >
                    {affiliate.company?.name || 'Empresa desconocida'}
                  </Label>
                </div>
                
                <AnimatePresence>
                  {includedAffiliates[affiliate.id] && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="text-xs text-green-500 font-medium flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3 h-3" />
                      Incluido
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}