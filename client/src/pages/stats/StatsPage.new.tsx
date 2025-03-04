import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { Helmet } from 'react-helmet';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { 
  Download, FileBarChart, FileSpreadsheet, Calendar, 
  ChevronDown, ChevronUp, Sliders, BarChart, PieChart as PieChartIcon, LineChart,
  TrendingUp, AreaChart, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { toast } from "sonner";
import { AudienceAnalysis } from "@/components/dashboard/AudienceAnalysis";
import { PerformanceMetrics } from "@/components/dashboard/PerformanceMetrics";
import { GeoDistribution } from "@/components/dashboard/GeoDistribution";
import { ComparisonChart } from "@/components/dashboard/ComparisonChart";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export default function StatsPage() {
  const [dateRange, setDateRange] = useState("7d");
  const [activeTab, setActiveTab] = useState("general");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Datos de muestra para estadísticas
  const mockOverallStats = {
    total_videos: 287,
    total_optimizations: 176,
    total_uploads: 215,
    growth_rate: 14.2,
    completion_rate: 86.3
  };
  
  const handleExport = (format: string) => {
    toast("Exportación iniciada", {
      description: `Preparando exportación en formato ${format}...`,
      duration: 3000,
    });
  };

  const handleDateRangeChange = (range: string) => {
    setDateRange(range);
    toast("Rango actualizado", {
      description: `Mostrando datos de los últimos ${
        range === "7d" ? "7 días" : 
        range === "30d" ? "30 días" : "12 meses"
      }`,
      duration: 2000,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Estadísticas | Video Platform</title>
      </Helmet>

      <div className="container px-4 py-6 lg:py-8 max-w-[1600px] mx-auto space-y-8">
        <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Estadísticas</h1>
            <p className="text-muted-foreground">
              Panel completo de métricas y análisis de rendimiento
            </p>
          </div>
          
          <div className="flex items-center flex-wrap gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {dateRange === "7d" ? "Últimos 7 días" :
                   dateRange === "30d" ? "Últimos 30 días" : "Últimos 12 meses"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleDateRangeChange("7d")}>
                  Últimos 7 días
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDateRangeChange("30d")}>
                  Últimos 30 días
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDateRangeChange("12m")}>
                  Últimos 12 meses
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('excel')} className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('pdf')} className="flex items-center gap-2">
                  <FileBarChart className="w-4 h-4" />
                  PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Advanced Filter Panel */}
        {showAdvancedFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <Card className="p-5 border border-border/60 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Rango de fechas</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="w-full">
                      Desde
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      Hasta
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Usuario</label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                    <option value="">Todos los usuarios</option>
                    <option value="user1">Usuario 1</option>
                    <option value="user2">Usuario 2</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Proyecto</label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                    <option value="">Todos los proyectos</option>
                    <option value="1">Proyecto Alpha</option>
                    <option value="2">Proyecto Beta</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <Button className="w-full bg-gradient-to-r from-primary to-primary/80 border-0">
                    Aplicar filtros
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} 
              className="flex items-center gap-2"
            >
              {showAdvancedFilters ? (
                <>
                  <span>Ocultar filtros</span>
                  <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Filtros avanzados</span>
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="general" className="space-y-4" onValueChange={(value) => setActiveTab(value)}>
          <TabsList className="w-full border-b rounded-none justify-start">
            <TabsTrigger value="general" className="rounded-none border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
              Vista General
            </TabsTrigger>
            <TabsTrigger value="detailed" className="rounded-none border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
              Detallado
            </TabsTrigger>
            <TabsTrigger value="reports" className="rounded-none border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
              Reportes
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-8 mt-6">
            <div className="space-y-8">
              <StatsOverview mode="general" />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AudienceAnalysis />
                
                <Card className="p-6 h-full">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-semibold text-lg">
                        Rendimiento de Plataformas
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Distribución de contenido por plataformas
                      </p>
                    </div>
                    <Activity className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="h-[300px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'YouTube', value: 65, color: '#FF0000' },
                            { name: 'Facebook', value: 15, color: '#4267B2' },
                            { name: 'Instagram', value: 12, color: '#C13584' },
                            { name: 'TikTok', value: 8, color: '#000000' }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={110}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="#FF0000" />
                          <Cell fill="#4267B2" />
                          <Cell fill="#C13584" />
                          <Cell fill="#222222" />
                        </Pie>
                        <Tooltip formatter={(value) => [`${value}%`, 'Porcentaje']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
              
              <PerformanceMetrics />
            </div>
          </TabsContent>
          
          <TabsContent value="detailed" className="space-y-8 mt-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Análisis Detallado</h2>
                <p className="text-muted-foreground">
                  Métricas detalladas y análisis profundo del rendimiento
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => handleExport('detailed')}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar Detalles
              </Button>
            </div>
            
            <div className="space-y-8">
              <StatsOverview mode="detailed" showDetailedCharts={true} />
              <PerformanceMetrics />
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-8 mt-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Reportes y Exportación</h2>
                <p className="text-muted-foreground">
                  Generación y descarga de reportes personalizados
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleExport('weekly')}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Reporte Semanal
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExport('monthly')}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Reporte Mensual
                </Button>
              </div>
            </div>
            
            <div className="space-y-8">
              <ComparisonChart />
              <GeoDistribution />
              <StatsOverview mode="reports" showTables={true} showExportOptions={true} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}