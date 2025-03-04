
import { Clock, Activity, CheckCircle2, FileEdit, Upload, Eye, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVideos } from "@/hooks/useVideos";
import { motion } from "framer-motion";
import { VideoStatus } from "@db/schema";

export function RecentActivity() {
  const { videos } = useVideos();
  
  const recentVideos = videos?.slice(0, 5).map(video => ({
    message: `Video "${video.title || 'Sin título'}" en estado ${video.status}`,
    time: new Date(video.updatedAt?.toString() || video.createdAt?.toString() || Date.now()).toLocaleDateString(),
    status: video.status as VideoStatus
  })) || [];

  // Animation variants for list items
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  
  // Function to get the appropriate icon based on status
  const getStatusIcon = (status: VideoStatus) => {
    switch(status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'available':
        return <Eye className="h-5 w-5 text-yellow-500" />;
      case 'content_corrections':
      case 'media_corrections':
        return <RefreshCw className="h-5 w-5 text-amber-500" />;
      case 'content_review':
      case 'media_review':
      case 'final_review':
        return <FileEdit className="h-5 w-5 text-purple-500" />;
      case 'upload_media':
        return <Upload className="h-5 w-5 text-blue-500" />;
      default:
        return <Activity className="h-5 w-5 text-blue-500" />;
    }
  };

  // Function to get dot color based on status
  const getStatusColor = (status: VideoStatus) => {
    switch(status) {
      case 'completed':
        return 'bg-green-500';
      case 'available':
        return 'bg-yellow-500';
      case 'content_corrections':
      case 'media_corrections':
        return 'bg-amber-500';
      case 'content_review':
      case 'media_review':
      case 'final_review':
        return 'bg-purple-500';
      case 'upload_media':
        return 'bg-blue-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <Card className="border border-muted/60 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      {/* Enhanced rich gradient accent for activity timeline */}
      <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-primary to-emerald-500"></div>
      
      <CardHeader className="border-b border-muted/30 bg-muted/10 backdrop-blur-sm">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-primary" />
          Actividad Reciente
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <motion.div 
          className="divide-y divide-muted/30"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {recentVideos.length > 0 ? (
            recentVideos.map((activity, i) => (
              <motion.div 
                key={i} 
                className="flex items-start gap-3 p-4 hover:bg-muted/5 transition-colors cursor-pointer"
                variants={item}
              >
                <div className="mt-0.5 bg-primary/10 p-2 rounded-full">
                  {getStatusIcon(activity.status)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.message}</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> 
                    {activity.time}
                  </p>
                </div>
                {/* Indicator dot */}
                <div className={`h-2 w-2 rounded-full mt-1.5 ${getStatusColor(activity.status)}`} />
              </motion.div>
            ))
          ) : (
            <motion.div 
              className="p-6 text-center text-muted-foreground"
              variants={item}
            >
              No hay actividad reciente
            </motion.div>
          )}
        </motion.div>
      </CardContent>
    </Card>
  );
}
