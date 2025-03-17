import { useVideoAffiliates } from "@/hooks/useVideoAffiliates";
import { ApiVideo } from "@/hooks/useVideos";
import { cn } from "@/lib/utils";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AffiliateIconsColumnProps {
  video: ApiVideo;
  className?: string;
}

export function AffiliateIconsColumn({ video, className }: AffiliateIconsColumnProps) {
  const { affiliates, isLoading } = useVideoAffiliates(video.id);

  // Si no hay afiliados o está cargando, mostrar un ícono neutro
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <div className="animate-pulse h-5 w-5 rounded-full bg-muted"></div>
      </div>
    );
  }

  // Si no hay afiliados, mostrar un estado vacío
  if (!affiliates || affiliates.length === 0) {
    return (
      <div className={cn("text-muted-foreground", className)}>
        <span className="text-xs">-</span>
      </div>
    );
  }

  // Calcular si todos los afiliados han sido incluidos
  const allIncluded = affiliates.every(affiliate => affiliate.includedByYoutuber);
  const someIncluded = affiliates.some(affiliate => affiliate.includedByYoutuber);
  const pendingCount = affiliates.filter(affiliate => !affiliate.includedByYoutuber).length;

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-1", className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-full",
                allIncluded 
                  ? "text-green-500 hover:text-green-600 hover:bg-green-100 dark:hover:bg-green-950" 
                  : someIncluded 
                    ? "text-amber-500 hover:text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-950"
                    : "text-blue-500 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-950"
              )}
            >
              <Link2 className="h-4 w-4" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {pendingCount}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent className="max-w-md">
            <div className="space-y-2 p-1">
              <h4 className="text-sm font-medium">Enlaces de afiliados</h4>
              <p className="text-xs text-muted-foreground mb-2">
                {allIncluded
                  ? "Todos los enlaces de afiliados han sido incluidos 👍"
                  : someIncluded
                    ? "Algunos enlaces de afiliados pendientes"
                    : "Enlaces de afiliados necesarios"}
              </p>
              <div className="space-y-2">
                {affiliates.map((affiliate) => (
                  <div key={affiliate.id} className="flex items-start gap-2 text-xs">
                    <div className={cn(
                      "mt-0.5 h-2 w-2 flex-shrink-0 rounded-full",
                      affiliate.includedByYoutuber
                        ? "bg-green-500"
                        : "bg-amber-500"
                    )} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{affiliate.companyName}</span>
                        {affiliate.companyUrl && (
                          <a
                            href={affiliate.companyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <p className="text-muted-foreground mt-0.5">
                        {affiliate.includedByYoutuber
                          ? "✓ Enlace incluido en el video"
                          : "○ Enlace pendiente de incluir"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}