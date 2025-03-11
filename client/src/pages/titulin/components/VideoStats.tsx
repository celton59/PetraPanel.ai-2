import { Card } from "@/components/ui/card";

interface VideoStatsProps {
  totalVideos: number;
  viewsCount: number;
  likesCount: number;
  lastUpdateInfo: string;
}

export function VideoStats({
  totalVideos,
  viewsCount,
  likesCount,
  lastUpdateInfo
}: VideoStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <Card className="p-4 shadow-sm">
        <div className="text-2xl font-bold text-primary">{totalVideos}</div>
        <div className="text-sm text-muted-foreground">Videos Totales</div>
      </Card>
      <Card className="p-4 shadow-sm">
        <div className="text-2xl font-bold text-green-600">{viewsCount.toLocaleString()}</div>
        <div className="text-sm text-muted-foreground">Vistas Totales</div>
      </Card>
      <Card className="p-4 shadow-sm">
        <div className="text-2xl font-bold text-yellow-500">{likesCount.toLocaleString()}</div>
        <div className="text-sm text-muted-foreground">Likes Totales</div>
      </Card>
      <Card className="p-4 shadow-sm">
        <div className="text-2xl font-bold text-blue-500">{lastUpdateInfo}</div>
        <div className="text-sm text-muted-foreground">Última Actualización</div>
      </Card>
    </div>
  );
}