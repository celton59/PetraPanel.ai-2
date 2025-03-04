import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { Helmet } from 'react-helmet';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { 
  Download, FileBarChart, FileSpreadsheet, Calendar, 
  ChevronDown, ChevronUp, Sliders
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

      <div className="container max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-lg shadow-sm border border-border/50"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <FileBarChart className="w-8 h-8 text-red-500" />
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Estadísticas
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Panel completo de métricas y análisis de rendimiento
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
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
        </motion.div>
        
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
        
        <Tabs defaultValue="general" className="space-y-8" onValueChange={(value) => setActiveTab(value)}>
          <div className="flex items-center justify-between mb-3">
            <TabsList className="bg-card border border-border/50 p-1 rounded-lg">
              <TabsTrigger value="general" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded transition-all px-4">
                Vista General
              </TabsTrigger>
              <TabsTrigger value="detailed" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded transition-all px-4">
                Detallado
              </TabsTrigger>
              <TabsTrigger value="reports" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded transition-all px-4">
                Reportes
              </TabsTrigger>
            </TabsList>
            
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
          
          <TabsContent value="general" className="space-y-8 mt-6">
            <StatsOverview mode="general" />
          </TabsContent>
          
          <TabsContent value="detailed" className="space-y-8 mt-6">
            <Card className="p-6 border border-border/50 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    Análisis Detallado
                  </h2>
                  <p className="text-muted-foreground">
                    Métricas detalladas y análisis profundo del rendimiento
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleExport('detailed')}
                  className="flex items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Exportar Detalles
                </Button>
              </div>
              <StatsOverview mode="detailed" showDetailedCharts={true} />
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-8 mt-6">
            <Card className="p-6 border border-border/50 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    Reportes y Exportación
                  </h2>
                  <p className="text-muted-foreground">
                    Generación y descarga de reportes personalizados
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleExport('weekly')}
                    className="flex items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Reporte Semanal
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleExport('monthly')}
                    className="flex items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Reporte Mensual
                  </Button>
                </div>
              </div>
              <StatsOverview mode="reports" showTables={true} showExportOptions={true} />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}