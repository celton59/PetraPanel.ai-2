
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVideos } from "@/hooks/useVideos";
import { VideoStatus } from "@db/schema";
import { BarChart, FileCheck, Clock, FileVideo, Film } from "lucide-react";

export function VideoStats() {
  const { videos } = useVideos();
  
  // Agrupar videos por estado
  const availableVideos = videos?.filter(v => v.status === 'available').length || 0;
  const inReviewVideos = videos?.filter(v => 
    v.status === 'content_review' || 
    v.status === 'media_review' || 
    v.status === 'final_review').length || 0;
  const inProcessVideos = videos?.filter(v => 
    v.status === 'content_corrections' || 
    v.status === 'media_corrections' || 
    v.status === 'upload_media').length || 0;
  const completedVideos = videos?.filter(v => v.status === 'completed').length || 0;
  
  // Total de videos
  const totalVideos = videos?.length || 0;
  
  // Calcular porcentajes para las barras
  const getPercentage = (count: number) => {
    return totalVideos > 0 ? (count / totalVideos) * 100 : 0;
  };
  
  const videoStats = [
    {
      title: "Disponibles",
      value: availableVideos,
      percentage: getPercentage(availableVideos),
      icon: FileVideo,
      color: "bg-yellow-500",
      textColor: "text-yellow-500",
      bgColor: "bg-yellow-500/10"
    },
    {
      title: "En Revisión",
      value: inReviewVideos,
      percentage: getPercentage(inReviewVideos),
      icon: Clock,
      color: "bg-purple-500",
      textColor: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    {
      title: "En Proceso",
      value: inProcessVideos,
      percentage: getPercentage(inProcessVideos),
      icon: Film,
      color: "bg-blue-500",
      textColor: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      title: "Completados",
      value: completedVideos,
      percentage: getPercentage(completedVideos),
      icon: FileCheck,
      color: "bg-green-500",
      textColor: "text-green-500",
      bgColor: "bg-green-500/10"
    }
  ];

  return (
    <Card className="border border-muted/60 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      {/* Enhanced rich accent gradient representing all video statuses */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-purple-500 to-emerald-500"></div>
      
      <CardHeader className="border-b border-muted/30 bg-muted/10 backdrop-blur-sm">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart className="h-5 w-5 text-primary" />
          Estado de Videos
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
                  <div className={`p-1.5 rounded-md ${stat.bgColor}`}>
                    <stat.icon className={`h-4 w-4 ${stat.textColor}`} />
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
              
              {/* Barra de progreso */}
              <div className="h-2 bg-muted/40 rounded-full overflow-hidden">
                <motion.div 
                  className={`h-full ${stat.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${stat.percentage}%` }}
                  transition={{ duration: 1, delay: 0.2 + index * 0.1 }}
                />
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-muted/30">
          <span className="text-sm font-medium text-muted-foreground">Total de videos</span>
          <span className="text-xl font-bold">{totalVideos}</span>
        </div>
      </CardContent>
    </Card>
  );
}
