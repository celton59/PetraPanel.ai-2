
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from "recharts";
import { 
  Loader2, TrendingUp, Users, Video, 
  Zap, BarChart3, Activity, Award, Target 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const COLORS = ['#8884d8', '#82ca9d', '#ffc658'];

interface Stats {
  total_videos: number;
  total_optimizations: number;
  total_uploads: number;
}

interface UserStats {
  userId: number;
  username: string;
  fullName: string;
  optimizations?: number;
  uploads?: number;
}

interface StatsOverviewProps {
  mode?: 'general' | 'detailed' | 'reports';
  showDetailedCharts?: boolean;
  showTables?: boolean;
  showExportOptions?: boolean;
}

export function StatsOverview({ 
  mode = 'general',
  showDetailedCharts = false,
  showTables = false,
  showExportOptions = false
}: StatsOverviewProps) {
  const { toast } = useToast();

  const { data: overallStats, isLoading: loadingOverall } = useQuery<{success: boolean, data: Stats}>({
    queryKey: ['/api/stats/overall'],
  });

  const { data: optimizationStats, isLoading: loadingOptimizations } = useQuery<UserStats[]>({
    queryKey: ['/api/stats/optimizations'],
  });

  const { data: uploadStats, isLoading: loadingUploads } = useQuery<UserStats[]>({
    queryKey: ['/api/stats/uploads'],
  });

  if (loadingOverall || loadingOptimizations || loadingUploads) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  const pieData = [
    { name: 'Videos', value: overallStats?.data?.total_videos || 0 },
    { name: 'Optimizaciones', value: overallStats?.data?.total_optimizations || 0 },
    { name: 'Subidas', value: overallStats?.data?.total_uploads || 0 }
  ];

  if (mode === 'detailed') {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Análisis por Usuario</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={optimizationStats}>
                <XAxis dataKey="username" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="optimizations" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Tendencias Temporales</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={[
                { date: 'Lun', videos: 4 },
                { date: 'Mar', videos: 3 },
                { date: 'Mie', videos: 6 },
                { date: 'Jue', videos: 8 },
                { date: 'Vie', videos: 5 }
              ]}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="videos" fill="#82ca9d" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </motion.div>
    );
  }

  if (mode === 'reports') {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <div className="grid grid-cols-1 gap-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Resumen del Período</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span>Videos Procesados</span>
                <span className="font-semibold">{overallStats?.data?.total_videos}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span>Tasa de Optimización</span>
                <span className="font-semibold">
                  {((overallStats?.data?.total_optimizations / overallStats?.data?.total_videos) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span>Eficiencia de Subidas</span>
                <span className="font-semibold">
                  {((overallStats?.data?.total_uploads / overallStats?.data?.total_videos) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </Card>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="relative overflow-hidden p-6 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/50 dark:to-blue-950/30 border border-blue-200 dark:border-blue-800">
            <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-16 -translate-y-16">
              <div className="absolute inset-0 bg-blue-500 opacity-10 rounded-full" />
            </div>
            <div className="relative z-10 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900 shadow-inner">
                <Video className="w-6 h-6 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-300">Videos Totales</p>
                <h3 className="text-3xl font-bold text-blue-700 dark:text-blue-200">
                  {overallStats?.data?.total_videos}
                </h3>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="relative overflow-hidden p-6 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/50 dark:to-green-950/30 border border-green-200 dark:border-green-800">
            <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-16 -translate-y-16">
              <div className="absolute inset-0 bg-green-500 opacity-10 rounded-full" />
            </div>
            <div className="relative z-10 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900 shadow-inner">
                <Zap className="w-6 h-6 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-300">Optimizaciones</p>
                <h3 className="text-3xl font-bold text-green-700 dark:text-green-200">
                  {overallStats?.data?.total_optimizations}
                </h3>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="relative overflow-hidden p-6 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/50 dark:to-purple-950/30 border border-purple-200 dark:border-purple-800">
            <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-16 -translate-y-16">
              <div className="absolute inset-0 bg-purple-500 opacity-10 rounded-full" />
            </div>
            <div className="relative z-10 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900 shadow-inner">
                <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-300">Subidas</p>
                <h3 className="text-3xl font-bold text-purple-700 dark:text-purple-200">
                  {overallStats?.data?.total_uploads}
                </h3>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 hover:shadow-lg transition-all duration-300 border border-border/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-lg">Top Optimizadores</h3>
              </div>
              <Badge variant="secondary" className="font-medium">
                Rendimiento
              </Badge>
            </div>
            <div className="space-y-4">
              {optimizationStats?.map((opt) => (
                <div key={opt.userId} className="flex items-center justify-between p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{opt.username}</p>
                      <p className="text-sm text-muted-foreground">{opt.optimizations} optimizaciones</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6 hover:shadow-lg transition-all duration-300 border border-border/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-lg">Top Subidas</h3>
              </div>
              <Badge variant="secondary" className="font-medium">
                Efectividad
              </Badge>
            </div>
            <div className="space-y-4">
              {uploadStats?.map((upload) => (
                <div key={upload.userId} className="flex items-center justify-between p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{upload.username}</p>
                      <p className="text-sm text-muted-foreground">{upload.uploads} subidas</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Distribution Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-6 hover:shadow-lg transition-all duration-300 border border-border/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg">Distribución General</h3>
            </div>
            <Badge variant="secondary" className="font-medium">
              Balance General
            </Badge>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
