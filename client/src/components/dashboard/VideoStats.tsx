import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, RefreshCw, Video, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function VideoStats() {
  // Datos que sabemos que son correctos
  const metrics = [
    {
      label: "Subiendo Media",
      value: 498,
      icon: Upload,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      label: "En Corrección",
      value: 1,
      icon: RefreshCw,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    },
    {
      label: "Disponibles",
      value: 21,
      icon: Video,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    {
      label: "Revisión Final",
      value: 2,
      icon: FileCheck,
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    }
  ];

  const total = metrics.reduce((sum, metric) => sum + metric.value, 0);

  return (
    <Card className="border border-muted/60 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500"></div>

      <CardHeader className="flex flex-row items-center justify-end space-y-0 pb-2">
        <span className="text-sm text-muted-foreground">
          Total: {total}
        </span>
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
                    ({((metric.value / total) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>

              <div className="h-2 bg-muted/40 rounded-full overflow-hidden">
                <motion.div 
                  className={cn("h-full", metric.color.replace("text-", "bg-"))}
                  initial={{ width: 0 }}
                  animate={{ width: `${(metric.value / total) * 100}%` }}
                  transition={{ duration: 1, delay: 0.2 + index * 0.1 }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-between items-center mt-6 pt-4 border-t border-muted/30">
          <span className="text-sm font-medium text-muted-foreground">Total de videos</span>
          <span className="text-xl font-bold">{total}</span>
        </div>
      </CardContent>
    </Card>
  );
}