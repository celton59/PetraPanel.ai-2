import React, { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FileDown, Users, Clock, Calendar, Activity, ArrowUp } from "lucide-react";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useUserActivity } from '@/hooks/useUserActivity';

export default function ActivityPage() {
  const [timeRange, setTimeRange] = useState("week");
  const [exportFormat, setExportFormat] = useState("excel");

  // Obtener datos de actividad usando el hook
  const { data: activityData, isLoading } = useUserActivity(timeRange);

  // Calcular las estadísticas con valores por defecto seguros
  const stats = activityData?.stats || {
    activeSessions: 0,
    averageSessionDuration: 0,
    totalUsers: 0,
    returningUsers: 0
  };

  const calculateRetentionRate = () => {
    if (!stats.totalUsers) return 0;
    return Math.round((stats.returningUsers / stats.totalUsers) * 100);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-6 rounded-lg border">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Análisis de Actividad
            </h1>
            <p className="text-muted-foreground">
              Monitorea el uso y la actividad de los usuarios en la plataforma
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[150px] border-blue-200 dark:border-blue-800">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mes</SelectItem>
                <SelectItem value="quarter">Último trimestre</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger className="w-[100px] border-blue-200 dark:border-blue-800">
                  <SelectValue placeholder="Formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="gap-1 border-blue-200 hover:border-blue-400 dark:border-blue-800 dark:hover:border-blue-600">
                <FileDown className="h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 border-blue-100 dark:border-blue-900">
            <div className="absolute inset-[1px] bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-[inherit]" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Usuarios Activos Hoy
              </CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold">
                {isLoading ? "..." : stats.activeSessions}
              </div>
              <div className="flex items-center text-xs text-emerald-500">
                <ArrowUp className="h-4 w-4 mr-1" />
                <span>+2 vs ayer</span>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 border-purple-100 dark:border-purple-900">
            <div className="absolute inset-[1px] bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-[inherit]" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tiempo Promedio
              </CardTitle>
              <Clock className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold">
                {isLoading ? "..." : `${Math.floor(stats.averageSessionDuration / 60)}m`}
              </div>
              <p className="text-xs text-muted-foreground">
                Por sesión
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 border-emerald-100 dark:border-emerald-900">
            <div className="absolute inset-[1px] bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 rounded-[inherit]" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Sesiones Hoy
              </CardTitle>
              <Calendar className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold">
                {isLoading ? "..." : stats.totalUsers}
              </div>
              <div className="flex items-center text-xs text-emerald-500">
                <ArrowUp className="h-4 w-4 mr-1" />
                <span>+5 vs ayer</span>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 border-amber-100 dark:border-amber-900">
            <div className="absolute inset-[1px] bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 rounded-[inherit]" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tasa de Retorno
              </CardTitle>
              <Activity className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold">
                {isLoading ? "..." : `${calculateRetentionRate()}%`}
              </div>
              <p className="text-xs text-muted-foreground">
                Usuarios que vuelven
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-1 rounded-lg">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900">Vista General</TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900">Por Usuario</TabsTrigger>
            <TabsTrigger value="sessions" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900">Sesiones</TabsTrigger>
            <TabsTrigger value="retention" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900">Retención</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card className="overflow-hidden border-blue-100 dark:border-blue-900">
              <div className="absolute inset-[1px] bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-[inherit]" />
              <CardHeader className="relative">
                <CardTitle>Actividad Semanal</CardTitle>
                <CardDescription>
                  Análisis de uso de la plataforma en los últimos 7 días
                </CardDescription>
              </CardHeader>
              <CardContent className="relative pl-2">
                <div className="h-[350px] flex items-center justify-center border-2 border-dashed rounded-lg border-blue-200 dark:border-blue-800">
                  Gráfico de Actividad
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card className="overflow-hidden border-purple-100 dark:border-purple-900">
              <div className="absolute inset-[1px] bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/50 dark:to-pink-950/50 rounded-[inherit]" />
              <CardHeader className="relative">
                <CardTitle>Actividad por Usuario</CardTitle>
                <CardDescription>
                  Desglose de actividad individual de cada usuario
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <div className="h-[350px] flex items-center justify-center border-2 border-dashed rounded-lg border-purple-200 dark:border-purple-800">
                  Tabla de Actividad por Usuario
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4">
            <Card className="overflow-hidden border-emerald-100 dark:border-emerald-900">
              <div className="absolute inset-[1px] bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/50 dark:to-teal-950/50 rounded-[inherit]" />
              <CardHeader className="relative">
                <CardTitle>Registro de Sesiones</CardTitle>
                <CardDescription>
                  Historial detallado de todas las sesiones
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <div className="h-[350px] flex items-center justify-center border-2 border-dashed rounded-lg border-emerald-200 dark:border-emerald-800">
                  Tabla de Sesiones
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="retention" className="space-y-4">
            <Card className="overflow-hidden border-amber-100 dark:border-amber-900">
              <div className="absolute inset-[1px] bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/50 dark:to-orange-950/50 rounded-[inherit]" />
              <CardHeader className="relative">
                <CardTitle>Análisis de Retención</CardTitle>
                <CardDescription>
                  Métricas de retención y compromiso de usuarios
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <div className="h-[350px] flex items-center justify-center border-2 border-dashed rounded-lg border-amber-200 dark:border-amber-800">
                  Gráfico de Retención
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}