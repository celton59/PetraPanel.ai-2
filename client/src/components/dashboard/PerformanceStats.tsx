
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PerformanceStats() {
  const metrics = [
    { label: "Visualizaciones", value: "2.4k", trend: "+12%", up: true },
    { label: "Tiempo Medio", value: "4:35", trend: "-8%", up: false },
    { label: "Engagement", value: "68%", trend: "+5%", up: true },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rendimiento</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{metric.label}</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{metric.value}</span>
                <span className={`text-xs ${metric.up ? 'text-green-500' : 'text-red-500'} flex items-center gap-1`}>
                  {metric.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {metric.trend}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
