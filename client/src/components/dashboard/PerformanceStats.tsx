
import { TrendingUp, TrendingDown, BarChart3, LineChart, Eye, Clock, ThumbsUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";

export function PerformanceStats() {
  const metrics = [
    { 
      label: "Visualizaciones", 
      value: "2.4k", 
      trend: "+12%", 
      up: true,
      icon: Eye,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    { 
      label: "Tiempo Medio", 
      value: "4:35", 
      trend: "-8%", 
      up: false,
      icon: Clock,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10"
    },
    { 
      label: "Engagement", 
      value: "68%", 
      trend: "+5%", 
      up: true,
      icon: ThumbsUp,
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
  ];

  // Animation variants
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
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <Card className="border border-muted/60 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      {/* Top accent gradient */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-green-500 to-amber-500"></div>
      
      <CardHeader className="border-b border-muted/30 bg-muted/10 backdrop-blur-sm">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5 text-primary" />
          Rendimiento
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        <motion.div 
          className="divide-y divide-muted/30"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {metrics.map((metric) => (
            <motion.div 
              key={metric.label} 
              variants={item}
              className="p-4 hover:bg-muted/5 transition-colors"
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-md ${metric.bgColor}`}>
                    <metric.icon className={`h-4 w-4 ${metric.color}`} />
                  </div>
                  <span className="font-medium text-sm">{metric.label}</span>
                </div>
                <div className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${
                  metric.up ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'
                }`}>
                  {metric.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {metric.trend}
                </div>
              </div>
              
              <div className="text-xl font-bold tracking-tight">{metric.value}</div>
              
              {/* Mini visual progress indicator */}
              <div className="w-full bg-muted/30 h-1 mt-2 rounded-full overflow-hidden">
                <motion.div 
                  className={`h-full ${metric.up ? 'bg-green-500' : 'bg-red-500'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${metric.up ? 70 : 40}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </CardContent>
    </Card>
  );
}
