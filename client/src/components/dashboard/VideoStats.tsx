import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVideoStats } from "@/hooks/useVideoStats";
import { Upload, RefreshCw, Video, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function VideoStats() {
  const { data: stats, isLoading } = useVideoStats();

  // Definir estados y sus colores
  const metrics = [
    {
      label: "Subiendo Media",
      value: stats?.stateCounts?.upload_media || 0,
      icon: Upload,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      label: "En Corrección",
      value: stats?.stateCounts?.content_corrections || 0,
      icon: RefreshCw,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    },
    {
      label: "Disponibles",
      value: stats?.stateCounts?.available || 0,
      icon: Video,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    {
      label: "Revisión Final",
      value: stats?.stateCounts?.final_review || 0,
      icon: FileCheck,
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    }
  ];

  const total = stats?.totalVideos || 0;

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
          {metrics.map((metric, index) => (
            <motion.div 
              key={metric.label}
              className="space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("p-1.5 rounded-md", metric.bgColor)}>
                    <metric.icon className={cn("h-4 w-4", metric.color)} />
                  </div>
                  <span className="text-sm font-medium">{metric.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{metric.value}</span>
                  <span className="text-xs text-muted-foreground">
                    ({((metric.value / (total || 1)) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>

              <div className="h-2 bg-muted/40 rounded-full overflow-hidden">
                <motion.div 
                  className={cn("h-full", metric.color.replace("text-", "bg-"))}
                  initial={{ width: 0 }}
                  animate={{ width: `${(metric.value / (total || 1)) * 100}%` }}
                  transition={{ duration: 1, delay: 0.2 + index * 0.1 }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-between items-center mt-6 pt-4 border-t border-muted/30">
          <span className="text-sm font-medium text-muted-foreground">Total de videos</span>
          <span className="text-xl font-bold">{isLoading ? "..." : total}</span>
        </div>
      </CardContent>
    </Card>
  );
}