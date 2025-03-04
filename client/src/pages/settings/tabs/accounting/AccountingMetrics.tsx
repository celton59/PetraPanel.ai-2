import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { 
  Bar,
  BarChart, 
  CartesianGrid, 
  Legend, 
  Line, 
  LineChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis 
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import StatsCard from "@/components/StatsCard";
import { format, subDays } from "date-fns";
import { CreditCard, DollarSign, Activity, Clock } from "lucide-react";

// Tipos
interface AccountingStats {
  totalPayments: number;
  totalAmountPaid: number;
  pendingPayments: number;
  pendingAmount: number;
  actionsCompleted: number;
  averagePaymentAmount: number;
  topEarners: UserEarnings[];
  monthlyPayments: MonthlyPayment[];
  actionsByType: ActionTypeStats[];
}

interface UserEarnings {
  userId: number;
  username: string;
  fullName: string;
  totalEarned: number;
  actionsCount: number;
}

interface MonthlyPayment {
  month: string;
  amount: number;
  count: number;
}

interface ActionTypeStats {
  actionType: string;
  count: number;
  totalAmount: number;
}

// Datos de demostración
const demoData: AccountingStats = {
  totalPayments: 156,
  totalAmountPaid: 12850.75,
  pendingPayments: 24,
  pendingAmount: 1450.25,
  actionsCompleted: 745,
  averagePaymentAmount: 82.38,
  topEarners: [
    { userId: 1, username: "rmartinez", fullName: "Roberto Martínez", totalEarned: 1850.50, actionsCount: 45 },
    { userId: 3, username: "alopez", fullName: "Ana López", totalEarned: 1650.75, actionsCount: 38 },
    { userId: 5, username: "jgarcia", fullName: "Juan García", totalEarned: 1475.25, actionsCount: 32 },
    { userId: 2, username: "msanchez", fullName: "María Sánchez", totalEarned: 1325.00, actionsCount: 28 },
    { userId: 4, username: "erodriguez", fullName: "Elena Rodríguez", totalEarned: 1150.50, actionsCount: 25 },
  ],
  monthlyPayments: [
    { month: "Ene", amount: 1250.75, count: 15 },
    { month: "Feb", amount: 1475.50, count: 18 },
    { month: "Mar", amount: 1650.25, count: 20 },
    { month: "Abr", amount: 1325.50, count: 16 },
    { month: "May", amount: 1575.25, count: 19 },
    { month: "Jun", amount: 1850.50, count: 22 },
    { month: "Jul", amount: 1725.75, count: 21 },
    { month: "Ago", amount: 1950.25, count: 23 },
    { month: "Sep", amount: 2050.50, count: 24 },
    { month: "Oct", amount: 1825.75, count: 22 },
    { month: "Nov", amount: 1750.50, count: 21 },
    { month: "Dic", amount: 1900.25, count: 23 },
  ],
  actionsByType: [
    { actionType: "video_creation", count: 125, totalAmount: 3125.50 },
    { actionType: "video_optimization", count: 180, totalAmount: 2700.75 },
    { actionType: "content_review", count: 210, totalAmount: 3150.25 },
    { actionType: "media_upload", count: 95, totalAmount: 1425.50 },
    { actionType: "media_review", count: 135, totalAmount: 2025.75 },
  ],
};

const actionTypes = {
  video_creation: "Creación de Video",
  video_optimization: "Optimización de Video",
  content_review: "Revisión de Contenido",
  media_upload: "Subida de Medios",
  media_review: "Revisión de Medios",
  translation: "Traducción",
};

export function AccountingMetrics() {
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState("year");
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  
  // En un entorno real, esta consulta obtendría datos del backend
  const { data: stats, isLoading } = useQuery<AccountingStats>({
    queryKey: ["accounting-stats", timeRange],
    queryFn: async () => {
      // En un entorno real, haríamos una llamada a la API:
      // const response = await axios.get(`/api/accounting/stats?timeRange=${timeRange}`);
      // return response.data;
      
      // Por ahora, devolvemos datos de ejemplo
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(demoData);
        }, 500);
      });
    },
  });

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case "month": return "Último mes";
      case "quarter": return "Último trimestre";
      case "year": return "Último año";
      default: return "Último año";
    }
  };

  const getActionName = (actionType: string) => {
    return actionTypes[actionType as keyof typeof actionTypes] || actionType;
  };

  const handleGenerateReport = () => {
    toast({
      title: "Reporte generado",
      description: "El reporte contable ha sido generado y está listo para descargar.",
    });
    setIsReportDialogOpen(false);
  };

  if (isLoading) {
    return <div className="text-center py-8">Cargando métricas contables...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Métricas Contables</h3>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccione período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Último mes</SelectItem>
              <SelectItem value="quarter">Último trimestre</SelectItem>
              <SelectItem value="year">Último año</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setIsReportDialogOpen(true)}>
            Generar Reporte
          </Button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Pagos Realizados"
          value={stats?.totalPayments.toString() || "0"}
          change="+12% vs mes anterior"
          isPositive={true}
          icon={CreditCard}
        />
        <StatsCard
          title="Monto Total Pagado"
          value={`$${stats?.totalAmountPaid.toFixed(2) || "0.00"}`}
          change="+8% vs mes anterior"
          isPositive={true}
          icon={DollarSign}
        />
        <StatsCard
          title="Acciones Completadas"
          value={stats?.actionsCompleted.toString() || "0"}
          change="+15% vs mes anterior"
          isPositive={true}
          icon={Activity}
        />
        <StatsCard
          title="Pagos Pendientes"
          value={stats?.pendingPayments.toString() || "0"}
          change="-5% vs mes anterior"
          isPositive={true}
          icon={Clock}
        />
      </div>

      {/* Sección de gráficos */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
          <TabsTrigger value="types">Tipos de Acciones</TabsTrigger>
          <TabsTrigger value="top">Top Usuarios</TabsTrigger>
        </TabsList>
        
        {/* Gráfico de tendencias */}
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Tendencia de Pagos - {getTimeRangeLabel()}</CardTitle>
              <CardDescription>
                Montos y cantidad de pagos realizados por mes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={stats?.monthlyPayments}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="amount"
                      name="Monto ($)"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="count"
                      name="Cantidad"
                      stroke="#82ca9d"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Gráfico de tipos de acciones */}
        <TabsContent value="types">
          <Card>
            <CardHeader>
              <CardTitle>Pagos por Tipo de Acción - {getTimeRangeLabel()}</CardTitle>
              <CardDescription>
                Distribución de pagos según tipo de acción realizada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats?.actionsByType.map(item => ({
                      ...item,
                      name: getActionName(item.actionType)
                    }))}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Cantidad" fill="#8884d8" />
                    <Bar dataKey="totalAmount" name="Monto ($)" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Top usuarios */}
        <TabsContent value="top">
          <Card>
            <CardHeader>
              <CardTitle>Top Usuarios - {getTimeRangeLabel()}</CardTitle>
              <CardDescription>
                Usuarios con mayores ingresos en el período
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats?.topEarners.map(user => ({
                      name: user.fullName,
                      username: user.username,
                      totalEarned: user.totalEarned,
                      actionsCount: user.actionsCount
                    }))}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalEarned" name="Total ($)" fill="#8884d8" />
                    <Bar dataKey="actionsCount" name="Acciones" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Diálogo para generar reporte */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Generar Reporte Contable</DialogTitle>
            <DialogDescription>
              Seleccione las opciones para el reporte que desea generar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Período del Reporte</h4>
              <Select defaultValue="month">
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Último mes</SelectItem>
                  <SelectItem value="quarter">Último trimestre</SelectItem>
                  <SelectItem value="year">Último año</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Tipo de Reporte</h4>
              <Select defaultValue="financial">
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione tipo de reporte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="financial">Financiero (Contable)</SelectItem>
                  <SelectItem value="activity">Actividad por Usuario</SelectItem>
                  <SelectItem value="projects">Desglose por Proyectos</SelectItem>
                  <SelectItem value="complete">Reporte Completo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Formato</h4>
              <Select defaultValue="pdf">
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsReportDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleGenerateReport}>
              Generar Reporte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}