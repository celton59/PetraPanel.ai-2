import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, LineChart, Line, AreaChart, Area
} from "recharts";
import { ArrowUpDown, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Datos simulados para las comparaciones
const comparativeData = {
  monthly: [
    { month: "Ene", thisYear: 42, lastYear: 30, growth: 40 },
    { month: "Feb", thisYear: 58, lastYear: 45, growth: 29 },
    { month: "Mar", thisYear: 67, lastYear: 52, growth: 29 },
    { month: "Abr", thisYear: 73, lastYear: 58, growth: 26 },
    { month: "May", thisYear: 80, lastYear: 63, growth: 27 },
    { month: "Jun", thisYear: 95, lastYear: 70, growth: 36 },
    { month: "Jul", thisYear: 92, lastYear: 78, growth: 18 },
    { month: "Ago", thisYear: 85, lastYear: 82, growth: 4 },
    { month: "Sep", thisYear: 105, lastYear: 88, growth: 19 },
    { month: "Oct", thisYear: 112, lastYear: 95, growth: 18 },
    { month: "Nov", thisYear: 120, lastYear: 102, growth: 18 },
    { month: "Dic", thisYear: 137, lastYear: 115, growth: 19 }
  ],
  quarterly: [
    { quarter: "Q1", thisYear: 167, lastYear: 127, growth: 31 },
    { quarter: "Q2", thisYear: 248, lastYear: 191, growth: 30 },
    { quarter: "Q3", thisYear: 282, lastYear: 248, growth: 14 },
    { quarter: "Q4", thisYear: 369, lastYear: 312, growth: 18 }
  ],
  categories: [
    { category: "Tutoriales", thisYear: 310, lastYear: 240, growth: 29 },
    { category: "Reseñas", thisYear: 250, lastYear: 190, growth: 32 },
    { category: "Vlogs", thisYear: 180, lastYear: 150, growth: 20 },
    { category: "Gameplay", thisYear: 220, lastYear: 180, growth: 22 },
    { category: "Unboxing", thisYear: 110, lastYear: 130, growth: -15 }
  ]
};

// Opciones para los períodos de comparación
const comparisonOptions = [
  { label: "Año anterior", value: "lastYear" },
  { label: "Mejor mes", value: "bestMonth" },
  { label: "Promedio", value: "average" }
];

// Opciones para tipos de métricas
const metricOptions = [
  { label: "Videos", value: "videos" },
  { label: "Visualizaciones", value: "views" },
  { label: "Ingresos", value: "revenue" }
];

export function ComparisonChart() {
  const [comparisonPeriod, setComparisonPeriod] = useState("lastYear");
  const [metricType, setMetricType] = useState("videos");
  const [selectedQuarter, setSelectedQuarter] = useState(0);
  const [timeScale, setTimeScale] = useState("monthly");

  // Función para manejar el cambio de trimestre
  const handleQuarterChange = (direction: 'next' | 'prev') => {
    if (direction === 'next' && selectedQuarter < 3) {
      setSelectedQuarter(selectedQuarter + 1);
    } else if (direction === 'prev' && selectedQuarter > 0) {
      setSelectedQuarter(selectedQuarter - 1);
    }
  };

  // Obtiene datos según el trimestre seleccionado
  const getQuarterData = () => {
    const quarterMonths = [
      ['Ene', 'Feb', 'Mar'],
      ['Abr', 'May', 'Jun'],
      ['Jul', 'Ago', 'Sep'],
      ['Oct', 'Nov', 'Dic']
    ];
    
    return comparativeData.monthly.filter(item => 
      quarterMonths[selectedQuarter].includes(item.month)
    );
  };

  // Etiqueta del trimestre actual
  const currentQuarterLabel = ['Q1', 'Q2', 'Q3', 'Q4'][selectedQuarter];

  // Renderiza el gráfico según el tipo de vista temporal
  const renderChart = () => {
    if (timeScale === 'quarterly') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={comparativeData.quarterly} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
            <XAxis dataKey="quarter" />
            <YAxis />
            <Tooltip 
              formatter={(value) => [`${value} videos`, `${metricType === 'views' ? 'Visualizaciones' : metricType === 'revenue' ? 'Ingresos' : 'Videos'}`]}
              contentStyle={{
                backgroundColor: 'var(--card)',
                borderColor: 'var(--border)',
                borderRadius: '0.5rem'
              }}
            />
            <Legend />
            <Bar dataKey="thisYear" name="2024" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="lastYear" name="2023" fill="#94A3B8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    } else if (timeScale === 'quarterly-detail') {
      return (
        <>
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuarterChange('prev')}
              disabled={selectedQuarter === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-medium text-lg">{currentQuarterLabel} 2024</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuarterChange('next')}
              disabled={selectedQuarter === 3}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getQuarterData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`${value} videos`, `${metricType === 'views' ? 'Visualizaciones' : metricType === 'revenue' ? 'Ingresos' : 'Videos'}`]}
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  borderColor: 'var(--border)',
                  borderRadius: '0.5rem'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="thisYear" 
                name="2024" 
                stroke="#3B82F6" 
                strokeWidth={2}
                activeDot={{ r: 8 }}
              />
              <Line 
                type="monotone" 
                dataKey="lastYear" 
                name="2023" 
                stroke="#94A3B8" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </>
      );
    } else if (timeScale === 'category') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart 
            data={comparativeData.categories} 
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            layout="vertical"
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} horizontal={true} vertical={false} />
            <XAxis type="number" />
            <YAxis type="category" dataKey="category" />
            <Tooltip 
              formatter={(value) => [`${value} videos`, `${metricType === 'views' ? 'Visualizaciones' : metricType === 'revenue' ? 'Ingresos' : 'Videos'}`]}
              contentStyle={{
                backgroundColor: 'var(--card)',
                borderColor: 'var(--border)',
                borderRadius: '0.5rem'
              }}
            />
            <Legend />
            <Bar dataKey="thisYear" name="2024" fill="#3B82F6" radius={[0, 4, 4, 0]} />
            <Bar dataKey="lastYear" name="2023" fill="#94A3B8" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    } else { // timeScale === 'monthly'
      return (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={comparativeData.monthly} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorThisYear" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorLastYear" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#94A3B8" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip 
              formatter={(value) => [`${value} videos`, `${metricType === 'views' ? 'Visualizaciones' : metricType === 'revenue' ? 'Ingresos' : 'Videos'}`]}
              contentStyle={{
                backgroundColor: 'var(--card)',
                borderColor: 'var(--border)',
                borderRadius: '0.5rem'
              }}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="thisYear" 
              name="2024" 
              stroke="#3B82F6" 
              fillOpacity={1}
              fill="url(#colorThisYear)" 
            />
            <Area 
              type="monotone" 
              dataKey="lastYear" 
              name="2023" 
              stroke="#94A3B8" 
              fillOpacity={1}
              fill="url(#colorLastYear)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    }
  };

  // Renderiza el gráfico de crecimiento
  const renderGrowthChart = () => {
    const data = timeScale === 'quarterly' 
      ? comparativeData.quarterly 
      : timeScale === 'category' 
        ? comparativeData.categories 
        : comparativeData.monthly;
    
    const dataKey = timeScale === 'quarterly' 
      ? 'quarter' 
      : timeScale === 'category' 
        ? 'category' 
        : 'month';

    return (
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
          <XAxis dataKey={dataKey} />
          <YAxis />
          <Tooltip 
            formatter={(value) => [`${value}%`, 'Crecimiento']}
            contentStyle={{
              backgroundColor: 'var(--card)',
              borderColor: 'var(--border)',
              borderRadius: '0.5rem'
            }}
          />
          <Bar 
            dataKey="growth" 
            name="% Crecimiento" 
            fill="#10B981" 
            radius={[4, 4, 0, 0]} 
          />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card className="p-6 border border-border/60">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Análisis Comparativo
          </h3>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Calendar className="w-4 h-4 mr-2" />
                {metricType === 'videos' ? 'Videos' : metricType === 'views' ? 'Visualizaciones' : 'Ingresos'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {metricOptions.map(option => (
                <DropdownMenuItem 
                  key={option.value} 
                  onClick={() => setMetricType(option.value)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                {comparisonPeriod === 'lastYear' ? 'Vs Año anterior' : comparisonPeriod === 'bestMonth' ? 'Vs Mejor mes' : 'Vs Promedio'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {comparisonOptions.map(option => (
                <DropdownMenuItem 
                  key={option.value} 
                  onClick={() => setComparisonPeriod(option.value)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs defaultValue="monthly" onValueChange={setTimeScale}>
        <TabsList className="mb-6 bg-muted/50">
          <TabsTrigger value="monthly" className="text-xs sm:text-sm data-[state=active]:bg-background">
            Mensual
          </TabsTrigger>
          <TabsTrigger value="quarterly" className="text-xs sm:text-sm data-[state=active]:bg-background">
            Trimestral
          </TabsTrigger>
          <TabsTrigger value="quarterly-detail" className="text-xs sm:text-sm data-[state=active]:bg-background">
            Detalle Trimestral
          </TabsTrigger>
          <TabsTrigger value="category" className="text-xs sm:text-sm data-[state=active]:bg-background">
            Por Categoría
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="monthly" className="mt-0 space-y-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {renderChart()}
            <div className="mt-6 pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Porcentaje de Crecimiento</h4>
              {renderGrowthChart()}
            </div>
          </motion.div>
        </TabsContent>
        
        <TabsContent value="quarterly" className="mt-0 space-y-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {renderChart()}
            <div className="mt-6 pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Porcentaje de Crecimiento</h4>
              {renderGrowthChart()}
            </div>
          </motion.div>
        </TabsContent>
        
        <TabsContent value="quarterly-detail" className="mt-0 space-y-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {renderChart()}
          </motion.div>
        </TabsContent>
        
        <TabsContent value="category" className="mt-0 space-y-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {renderChart()}
            <div className="mt-6 pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Porcentaje de Crecimiento por Categoría</h4>
              {renderGrowthChart()}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}