import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVideoStats } from "@/hooks/useVideoStats";
import { Upload, RefreshCw, PlayCircle, CheckCircle2, Clock, Video } from "lucide-react";
import { cn } from "@/lib/utils";

export function VideoStats() {
  const { data: stats, isLoading } = useVideoStats();

  // Definir estados y sus colores
  const videoStates = {
    upload_media: { label: 'Subiendo', icon: Upload, color: "bg-blue-500", textColor: "text-blue-500", bgColor: "bg-blue-500/10" },
    content_review: { label: 'En Revisión', icon: Clock, color: "bg-purple-500", textColor: "text-purple-500", bgColor: "bg-purple-500/10" },
    content_corrections: { label: 'Correcciones', icon: RefreshCw, color: "bg-orange-500", textColor: "text-orange-500", bgColor: "bg-orange-500/10" },
    media_review: { label: 'Rev. Media', icon: PlayCircle, color: "bg-indigo-500", textColor: "text-indigo-500", bgColor: "bg-indigo-500/10" },
    completed: { label: 'Completados', icon: CheckCircle2, color: "bg-green-500", textColor: "text-green-500", bgColor: "bg-green-500/10" },
  };

  // Calcular porcentajes y preparar datos para visualización
  const videoStats = Object.entries(videoStates).map(([state, config]) => ({
    title: config.label,
    value: stats?.stateCounts[state] || 0,
    percentage: stats?.totalVideos ? ((stats.stateCounts[state] || 0) / stats.totalVideos) * 100 : 0,
    icon: config.icon,
    color: config.color,
    textColor: config.textColor,
    bgColor: config.bgColor
  }));

  return (
    <Card className="border border-muted/60 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500"></div>

      <CardHeader className="border-b border-muted/30 bg-muted/10 backdrop-blur-sm">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Video className="h-5 w-5 text-primary" />
          Métricas de Videos
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-6">
          {videoStats.map((stat, index) => (
            <motion.div 
              key={stat.title}
              className="space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("p-1.5 rounded-md", stat.bgColor)}>
                    <stat.icon className={cn("h-4 w-4", stat.textColor)} />
                  </div>
                  <span className="text-sm font-medium">{stat.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{stat.value}</span>
                  <span className="text-xs text-muted-foreground">
                    ({stat.percentage.toFixed(0)}%)
                  </span>
                </div>
              </div>

              <div className="h-2 bg-muted/40 rounded-full overflow-hidden">
                <motion.div 
                  className={stat.color}
                  initial={{ width: 0 }}
                  animate={{ width: `${stat.percentage}%` }}
                  transition={{ duration: 1, delay: 0.2 + index * 0.1 }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-between items-center mt-6 pt-4 border-t border-muted/30">
          <span className="text-sm font-medium text-muted-foreground">Total de videos</span>
          <span className="text-xl font-bold">{isLoading ? "..." : stats?.totalVideos || 0}</span>
        </div>
      </CardContent>
    </Card>
  );
}