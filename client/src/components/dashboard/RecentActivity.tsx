
import { AlertCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVideos } from "@/hooks/useVideos";

export function RecentActivity() {
  const { videos } = useVideos();
  
  const recentVideos = videos?.slice(0, 5).map(video => ({
    message: `Video "${video.title || 'Sin título'}" en estado ${video.status}`,
    time: new Date(video.updatedAt || video.createdAt).toLocaleDateString(),
    status: video.status
  })) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Actividad Reciente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentVideos.map((activity, i) => (
            <div key={i} className="flex items-start gap-2">
              <AlertCircle className={`h-4 w-4 mt-0.5 ${
                activity.status === 'completed' ? 'text-green-500' : 
                activity.status === 'pending' ? 'text-yellow-500' : 
                'text-blue-500'
              }`} />
              <div>
                <p className="text-sm">{activity.message}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
