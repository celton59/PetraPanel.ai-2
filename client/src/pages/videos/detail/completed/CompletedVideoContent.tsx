import { Video } from "@db/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  BarChart3, 
  Check, 
  CheckCircle2, 
  ChevronRight, 
  Download, 
  Facebook, 
  Link, 
  Linkedin, 
  Mail, 
  Share2, 
  Twitter 
} from "lucide-react";

interface CompletedVideoContentProps {
  video: Video;
  handleCopyLink: () => void;
  handleDownload: () => void;
  linkCopied: boolean;
}

export function CompletedVideoContent({
  video,
  handleCopyLink,
  handleDownload,
  linkCopied
}: CompletedVideoContentProps) {
  // Solo se muestra si estamos en estado completed
  if (video.status !== "completed") return null;

  return (
    <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm relative mb-4">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 dark:from-purple-600 dark:via-indigo-600 dark:to-purple-600"></div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-purple-50 dark:bg-purple-900/50">
              <CheckCircle2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-medium text-purple-700 dark:text-purple-300 text-sm">Video Publicado</h3>
          </div>
          <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white border-0">
            Completado
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-1 md:col-span-1">
            <div 
              className="p-4 rounded-md border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/40 hover:bg-white/90 dark:hover:bg-gray-900/50 transition-all cursor-pointer flex items-center gap-3"
              onClick={handleCopyLink}
            >
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/50">
                {linkCopied ? (
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <Link className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                )}
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">Compartir enlace</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">Copia el enlace directo al video</p>
              </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-1">
            <div 
              className="p-4 rounded-md border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/40 hover:bg-white/90 dark:hover:bg-gray-900/50 transition-all cursor-pointer flex items-center gap-3"
              onClick={handleDownload}
            >
              <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/50">
                <Download className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">Descargar video</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">Guardar video en tu dispositivo</p>
              </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="p-4 rounded-md border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/40 hover:bg-white/90 dark:hover:bg-gray-900/50 transition-all cursor-pointer flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/50">
                    <Share2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">Compartir en redes</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Publicar en redes sociales</p>
                  </div>
                  <ChevronRight className="h-4 w-4 ml-auto text-gray-400" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                  <Facebook className="h-4 w-4 text-blue-600" />
                  <span>Facebook</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                  <Twitter className="h-4 w-4 text-sky-500" />
                  <span>Twitter</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                  <Linkedin className="h-4 w-4 text-blue-700" />
                  <span>LinkedIn</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                  <Mail className="h-4 w-4 text-gray-600" />
                  <span>Correo electrónico</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-md border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Métricas estimadas</h4>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-purple-600 dark:text-purple-400">
              <BarChart3 className="h-3.5 w-3.5" />
              Ver estadísticas completas
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">24.5K</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Visualizaciones est.</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">18.2%</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Tasa de interacción</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">4:23</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Tiempo de vis. promedio</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}