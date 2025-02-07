
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVideos } from "@/hooks/useVideos";

export function VideoStats() {
  const { videos } = useVideos();
  
  const pendingVideos = videos?.filter(v => v.status === 'pending').length || 0;
  const completedVideos = videos?.filter(v => v.status === 'completed').length || 0;

  return (
    <div className="grid gap-4 grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Videos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingVideos}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed Videos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedVideos}</div>
        </CardContent>
      </Card>
    </div>
  );
}
