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
  const isAffiliateIncluded = firstMatch.included_by_youtuber;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center justify-center cursor-help", className)}>
            {isAffiliateIncluded ? (
              <ExternalLink className="w-5 h-5 text-emerald-500" />
            ) : (
              <Link className="w-5 h-5 text-amber-500" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" align="center" className="max-w-xs">
          <div className="space-y-2">
            <p className="font-medium text-sm">
              {isAffiliateIncluded
                ? "Enlaces de afiliado incluidos"
                : "Requiere enlaces de afiliado"}
            </p>
            <div className="text-xs text-muted-foreground">
              {affiliates.map((match) => (
                <div key={match.id} className="flex items-center gap-2 mb-1">
                  {match.company && match.company.logo_url ? (
                    <img 
                      src={match.company.logo_url} 
                      alt={match.company.name}
                      className="w-4 h-4 object-contain"
                    />
                  ) : (
                    <div className="w-4 h-4 rounded bg-primary/20 flex items-center justify-center">
                      <Link className="w-3 h-3 text-primary" />
                    </div>
                  )}
                  <span>{match.company?.name || "Empresa afiliada"}</span>
                </div>
              ))}
            </div>
            {!isAffiliateIncluded && (
              <p className="text-xs text-amber-500 mt-1">
                Se detectó mención de esta empresa. Recuerda incluir su enlace de afiliado.
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}