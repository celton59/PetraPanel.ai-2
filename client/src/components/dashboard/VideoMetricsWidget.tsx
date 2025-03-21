import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, RefreshCw, Video, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoMetric {
  label: string;
  value: number;
  icon: any;
  color: string;
}

export function VideoMetricsWidget() {
  // Datos de ejemplo que sabemos que son correctos
  const metrics: VideoMetric[] = [
    {
      label: "Subiendo Media",
      value: 498,
      icon: Upload,
      color: "text-blue-500"
    },
    {
      label: "En Corrección",
      value: 1,
      icon: RefreshCw,
      color: "text-orange-500"
    },
    {
      label: "Disponibles",
      value: 21,
      icon: Video,
      color: "text-purple-500"
    },
    {
      label: "Revisión Final",
      value: 2,
      icon: FileCheck,
      color: "text-green-500"
    }
  ];

  const total = metrics.reduce((sum, metric) => sum + metric.value, 0);

  return (
    <Card className="col-span-3">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">
          Estado de Videos
        </CardTitle>
        <span className="text-sm text-muted-foreground">
          Total: {total}
        </span>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="flex flex-col space-y-2">
              <div className="flex items-center gap-2">
                <metric.icon className={cn("h-4 w-4", metric.color)} />
                <span className="text-sm font-medium">{metric.label}</span>
              </div>
              <div className="text-2xl font-bold">{metric.value}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
