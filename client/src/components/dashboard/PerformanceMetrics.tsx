import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area
} from "recharts";
import { Zap, TrendingUp, EyeIcon, ThumbsUp, Share2 } from "lucide-react";

// Datos de ejemplo para la gráfica de tendencias semanales
const weeklyTrendData = [
  { day: 'Lun', views: 156, shares: 34, likes: 89 },
  { day: 'Mar', views: 142, shares: 29, likes: 76 },
  { day: 'Mie', views: 164, shares: 32, likes: 95 },
  { day: 'Jue', views: 198, shares: 45, likes: 112 },
  { day: 'Vie', views: 234, shares: 56, likes: 142 },
  { day: 'Sab', views: 187, shares: 41, likes: 97 },
  { day: 'Dom', views: 163, shares: 36, likes: 84 }
];

// Datos de tasas de rendimiento
const performanceRates = [
  { name: "Tasa de Engagement", value: 72.4, icon: ThumbsUp, color: "#3B82F6" },
  { name: "Tasa de Finalización", value: 86.3, icon: Zap, color: "#10B981" },
  { name: "Tasa de Conversión", value: 42.8, icon: TrendingUp, color: "#EC4899" }
];

// Datos para el gráfico de tendencias mensuales
const monthlyTrends = [
  { month: 'Ene', videos: 92, views: 4500 },
  { month: 'Feb', videos: 85, views: 5100 },
  { month: 'Mar', videos: 110, views: 7200 },
  { month: 'Abr', videos: 105, views: 6800 },
  { month: 'May', videos: 125, views: 8500 },
  { month: 'Jun', videos: 135, views: 9200 },
];

export function PerformanceMetrics() {
  return (
    <div className="space-y-8">
      {/* Métricas de rendimiento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {performanceRates.map((metric, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-5 hover:shadow-md transition-all duration-300 border border-border/50">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div 
                    className="p-2 rounded-full" 
                    style={{ backgroundColor: `${metric.color}15` }}
                  >
                    <metric.icon className="w-4 h-4" style={{ color: metric.color }} />
                  </div>
                  <h3 className="text-sm font-medium">{metric.name}</h3>
                </div>
                <span 
                  className="text-sm font-semibold"
                  style={{ color: metric.color }}
                >
                  {metric.value}%
                </span>
              </div>
              <Progress value={metric.value} className="h-2" />
            </Card>
          </motion.div>
        ))}
      </div>
      
      {/* Tendencias semanales */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-6 hover:shadow-lg transition-all duration-300 border border-border/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <EyeIcon className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Tendencias Semanales de Visualización
              </h3>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrendData}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorShares" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EC4899" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#EC4899" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--card)',
                    borderColor: 'var(--border)',
                    borderRadius: '0.5rem'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#3B82F6" 
                  fillOpacity={1} 
                  fill="url(#colorViews)" 
                  name="Visualizaciones"
                />
                <Area 
                  type="monotone" 
                  dataKey="likes" 
                  stroke="#10B981" 
                  fillOpacity={1} 
                  fill="url(#colorLikes)" 
                  name="Me gusta"
                />
                <Area 
                  type="monotone" 
                  dataKey="shares" 
                  stroke="#EC4899" 
                  fillOpacity={1} 
                  fill="url(#colorShares)"
                  name="Compartidos" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>
      
      {/* Tendencias mensuales */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-6 hover:shadow-lg transition-all duration-300 border border-border/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Tendencias Mensuales de Producción
              </h3>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" orientation="left" stroke="#3B82F6" />
                <YAxis yAxisId="right" orientation="right" stroke="#10B981" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--card)',
                    borderColor: 'var(--border)',
                    borderRadius: '0.5rem'
                  }}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="videos" 
                  stroke="#3B82F6" 
                  name="Videos Producidos"
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="views" 
                  stroke="#10B981" 
                  name="Visualizaciones (en miles)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}