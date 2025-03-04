
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
import { useState, useEffect } from "react";

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

  // Datos de muestra en caso de error para evitar que la UI se rompa
  const mockOptimizationStats = [
    { userId: 1, username: "user1", fullName: "Usuario 1", optimizations: 12 },
    { userId: 2, username: "user2", fullName: "Usuario 2", optimizations: 8 },
    { userId: 3, username: "user3", fullName: "Usuario 3", optimizations: 5 }
  ];

  const mockUploadStats = [
    { userId: 1, username: "user1", fullName: "Usuario 1", uploads: 14 },
    { userId: 2, username: "user2", fullName: "Usuario 2", uploads: 9 },
    { userId: 3, username: "user3", fullName: "Usuario 3", uploads: 7 }
  ];

  // Siempre usamos datos de muestra para este ejemplo
  const optimizationData = mockOptimizationStats;
  const uploadData = mockUploadStats;

  // Datos para gráficos
  const mockStatsData = {
    total_videos: 287,
    total_optimizations: 176,
    total_uploads: 215,
    engagement_rate: 72.4,
    completion_rate: 86.3,
    conversion_rate: 42.8,
    weekly_trend: [
      { day: 'Lun', views: 156, shares: 34, likes: 89 },
      { day: 'Mar', views: 142, shares: 29, likes: 76 },
      { day: 'Mie', views: 164, shares: 32, likes: 95 },
      { day: 'Jue', views: 198, shares: 45, likes: 112 },
      { day: 'Vie', views: 234, shares: 56, likes: 142 },
      { day: 'Sab', views: 187, shares: 41, likes: 97 },
      { day: 'Dom', views: 163, shares: 36, likes: 84 }
    ],
    platforms: [
      { name: 'YouTube', value: 65, color: '#FF0000' },
      { name: 'Facebook', value: 15, color: '#4267B2' },
      { name: 'Instagram', value: 12, color: '#C13584' },
      { name: 'TikTok', value: 8, color: '#000000' }
    ],
    audience: {
      age: [
        { group: '18-24', percentage: 22 },
        { group: '25-34', percentage: 38 },
        { group: '35-44', percentage: 27 },
        { group: '45-54', percentage: 8 },
        { group: '55+', percentage: 5 }
      ],
      gender: [
        { type: 'Masculino', percentage: 58 },
        { type: 'Femenino', percentage: 42 }
      ],
      regions: [
        { name: 'América Latina', value: 45 },
        { name: 'Norteamérica', value: 28 },
        { name: 'Europa', value: 18 },
        { name: 'Asia', value: 6 },
        { name: 'Otros', value: 3 }
      ]
    }
  };

  // Fingimos un breve tiempo de carga para la experiencia de usuario
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
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
    { name: 'Videos', value: mockStatsData.total_videos },
    { name: 'Optimizaciones', value: mockStatsData.total_optimizations },
    { name: 'Subidas', value: mockStatsData.total_uploads }
  ];

  if (mode === 'detailed') {
    // Datos simulados para las gráficas
    const weeklyData = [
        { date: 'Lun', videos: 4, optimizations: 2, uploads: 3 },
        { date: 'Mar', videos: 3, optimizations: 3, uploads: 2 },
        { date: 'Mie', videos: 6, optimizations: 4, uploads: 5 },
        { date: 'Jue', videos: 8, optimizations: 6, uploads: 7 },
        { date: 'Vie', videos: 5, optimizations: 3, uploads: 4 }
    ];

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300">
            <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Análisis por Usuario</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={optimizationData}>
                <XAxis dataKey="username" />
                <YAxis />
                <Tooltip />
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <Bar dataKey="optimizations" fill="#8884d8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          
          <Card className="p-6 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300">
            <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Tendencias Semanales</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="colorVideos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="videos" stroke="#8884d8" fillOpacity={1} fill="url(#colorVideos)" />
                <Area type="monotone" dataKey="uploads" stroke="#82ca9d" fillOpacity={1} fill="url(#colorUploads)" />
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
                <span className="font-semibold">{mockStatsData.total_videos}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span>Tasa de Optimización</span>
                <span className="font-semibold">
                  {((mockStatsData.total_optimizations / mockStatsData.total_videos) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <span>Eficiencia de Subidas</span>
                <span className="font-semibold">
                  {((mockStatsData.total_uploads / mockStatsData.total_videos) * 100).toFixed(1)}%
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
                  {mockStatsData.total_videos}
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
                  {mockStatsData.total_optimizations}
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
                  {mockStatsData.total_uploads}
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
              {optimizationData.slice(0, 3).map((opt) => (
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
              {uploadData.slice(0, 3).map((upload) => (
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
