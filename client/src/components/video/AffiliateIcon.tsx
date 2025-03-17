import React from "react";
import { ApiVideo } from "@/hooks/useVideos";
import { useVideoAffiliates } from "@/hooks/useVideoAffiliates";
import { Link, ExternalLink } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface AffiliateIconProps {
  video: ApiVideo;
  className?: string;
}

export function AffiliateIcon({ video, className }: AffiliateIconProps) {
  const { affiliates, isLoading, hasAffiliates } = useVideoAffiliates(video.id);

  // Si no hay coincidencias de afiliados o está cargando, no mostramos nada
  if (isLoading || !hasAffiliates || affiliates.length === 0) {
    return null;
  }

  // Obtiene la primera empresa que requiere afiliación
  const firstMatch = affiliates[0];
  
  // Determina si ya se ha incluido el enlace de afiliado
  const isAffiliateIncluded = firstMatch.includedByYoutuber;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center justify-center cursor-help transition-all hover:scale-110", className)}>
            {isAffiliateIncluded ? (
              <ExternalLink className="w-5 h-5 text-emerald-500" />
            ) : (
              <Link className="w-5 h-5 text-amber-500 animate-pulse" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          align="center" 
          className="max-w-xs p-0 overflow-hidden bg-card border-0 shadow-lg" 
          sideOffset={5}
        >
          <div className="flex flex-col">
            {/* Encabezado */}
            <div className={cn(
              "py-2 px-3 text-white font-medium text-sm w-full",
              isAffiliateIncluded ? "bg-emerald-500" : "bg-amber-500"
            )}>
              {isAffiliateIncluded
                ? "Enlaces de afiliado incluidos"
                : "Requiere enlaces de afiliado"}
            </div>
            
            {/* Contenido */}
            <div className="p-3 space-y-2">
              <div className="text-xs space-y-2 border-b border-border pb-2">
                {affiliates.map((match) => (
                  <div key={match.id} className="flex items-center gap-2">
                    {match.companyLogo ? (
                      <img 
                        src={match.companyLogo} 
                        alt={match.companyName}
                        className="w-5 h-5 object-contain"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                        <Link className="w-3 h-3 text-primary" />
                      </div>
                    )}
                    <span className="font-medium">{match.companyName}</span>
                  </div>
                ))}
              </div>
              
              {!isAffiliateIncluded && (
                <div className="flex items-start gap-2 text-xs">
                  <div className="mt-0.5 min-w-4">
                    <div className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center">
                      <span className="text-amber-600 text-xs font-bold">!</span>
                    </div>
                  </div>
                  <p className="text-amber-700">
                    Se detectó mención de esta empresa. Recuerda incluir su enlace de afiliado.
                  </p>
                </div>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}