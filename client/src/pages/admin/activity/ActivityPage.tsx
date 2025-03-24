import React, { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FileDown, Users, Clock, Calendar, Activity, ChevronUp, UserCheck, RefreshCw } from "lucide-react";
import { format } from 'date-fns';
import { useUserActivity } from '@/hooks/useUserActivity';
import { cn } from '@/lib/utils';

interface UserActivityCountData {
    sessionCount: number
    totalDuration: number
    lastActive: Date
}

export default function ActivityPage() {
  const [timeRange, setTimeRange] = useState("week");
  const [exportFormat, setExportFormat] = useState("excel");

  // Obtener datos de actividad usando el hook
  const { data: activityData, isLoading } = useUserActivity(timeRange);

  const statsCards = [
    {
      title: "Usuarios Activos Hoy",
      icon: Users,
      value: isLoading ? "..." : activityData?.stats.activeSessions,
      change: "+2 vs ayer",
      changeType: "positive",
    },
    {
      title: "Tiempo Promedio",
      icon: Clock,
      value: isLoading ? "..." : `${Math.floor(activityData?.stats?.averageSessionDuration ?? 0 / 60)}m`,
      description: "Por sesión",
    },
    {
      title: "Sesiones Hoy",
      icon: Activity,
      value: isLoading ? "..." : activityData?.stats.activeSessions,
      change: "+5 vs ayer",
      changeType: "positive",
    },
    {
      title: "Tasa de Retorno",
      icon: RefreshCw,
      value: isLoading ? "..." : `${Math.round((activityData?.stats?.returningUsers ?? 0 / (activityData?.stats.totalUsers ?? 1) ) * 100)}%`,
      description: "Usuarios que vuelven",
    },
  ];

  // Renderizar tabla de sesiones
  const renderSessionsTable = () => {
    if (!activityData?.sessions) return null;

    return (
      <div className="relative overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
            <tr>
              <th className="px-6 py-3">Usuario</th>
              <th className="px-6 py-3">Inicio</th>
              <th className="px-6 py-3">Duración</th>
              <th className="px-6 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {activityData.sessions.map((session, index) => (
              <tr key={session.id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                <td className="px-6 py-4">{session.userId || 'N/A'}</td>
                <td className="px-6 py-4">{format(new Date(session.startedAt), 'dd/MM/yy HH:mm')}</td>
                <td className="px-6 py-4">
                  {session.duration ? `${Math.floor(session.duration / 60)}m` : 'En curso'}
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs",
                    session.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  )}>
                    {session.isActive ? 'Activa' : 'Finalizada'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Renderizar tabla de actividad por usuario
  const renderUserActivityTable = () => {
    if (!activityData?.stats) return null;

    const users: Record<number, UserActivityCountData> = activityData.sessions.reduce((acc: any, session) => {
      const userId = session.userId
      if (!userId) return acc;

      if (!acc[userId]) {
        acc[userId] = {
          sessionCount: 0,
          totalDuration: 0,
          lastActive: new Date(0)
        };
      }

      acc[userId].sessionCount++;
      acc[userId].totalDuration += session.duration || 0;
      const sessionDate = new Date(session.startedAt);
      if (sessionDate > acc[userId].lastActive) {
        acc[userId].lastActive = sessionDate;
      }

      return acc;
    }, {});

    return (
      <div className="relative overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
            <tr>
              <th className="px-6 py-3">Usuario</th>
              <th className="px-6 py-3">Sesiones</th>
              <th className="px-6 py-3">Tiempo Total</th>
              <th className="px-6 py-3">Última Actividad</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(users).map(([userId, data]: [string, any], index) => (
              <tr key={userId} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                <td className="px-6 py-4">{data.username}</td>
                <td className="px-6 py-4">{data.sessionCount}</td>
                <td className="px-6 py-4">{Math.floor(data.totalDuration / 60)}m</td>
                <td className="px-6 py-4">{format(data.lastActive, 'dd/MM/yy HH:mm')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Análisis de Actividad</h1>
            <p className="text-muted-foreground mt-2">
              Monitorea el uso y la actividad de los usuarios en la plataforma
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mes</SelectItem>
                <SelectItem value="quarter">Último trimestre</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-3">
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="gap-2">
                <FileDown className="h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card key={index} className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {card.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                  {card.change && (
                    <div className={cn(
                      "text-xs flex items-center gap-1 mt-1",
                      card.changeType === "positive" ? "text-green-600" : "text-red-600"
                    )}>
                      <ChevronUp className={cn(
                        "h-3 w-3",
                        card.changeType === "positive" ? "" : "rotate-180"
                      )} />
                      {card.change}
                    </div>
                  )}
                  {card.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {card.description}
                    </p>
                  )}
                </CardContent>
                <div className={cn(
                  "absolute bottom-0 left-0 right-0 h-1",
                  card.changeType === "positive" ? "bg-green-500" : "bg-blue-500"
                )} />
              </Card>
            );
          })}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-background border-b w-full justify-start rounded-none p-0">
            <TabsTrigger 
              value="overview"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none data-[state=active]:bg-transparent px-4 py-3"
            >
              Vista General
            </TabsTrigger>
            <TabsTrigger 
              value="users"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none data-[state=active]:bg-transparent px-4 py-3"
            >
              Por Usuario
            </TabsTrigger>
            <TabsTrigger 
              value="sessions"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none data-[state=active]:bg-transparent px-4 py-3"
            >
              Sesiones
            </TabsTrigger>
            <TabsTrigger 
              value="retention"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none data-[state=active]:shadow-none data-[state=active]:bg-transparent px-4 py-3"
            >
              Retención
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Actividad Semanal</CardTitle>
                <CardDescription>
                  Análisis de uso de la plataforma en los últimos 7 días
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[350px] flex items-center justify-center border-2 border-dashed rounded-lg">
                  Gráfico de Actividad
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Actividad por Usuario</CardTitle>
                <CardDescription>
                  Desglose de actividad individual de cada usuario
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[350px] flex items-center justify-center">
                    Cargando datos...
                  </div>
                ) : (
                  renderUserActivityTable()
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Registro de Sesiones</CardTitle>
                <CardDescription>
                  Historial detallado de todas las sesiones
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[350px] flex items-center justify-center">
                    Cargando datos...
                  </div>
                ) : (
                  renderSessionsTable()
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="retention" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Análisis de Retención</CardTitle>
                <CardDescription>
                  Porcentaje de usuarios que vuelven a usar la plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[350px] flex items-center justify-center">
                    Cargando datos...
                  </div>
                ) : (
                  <div className="h-[350px] flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-bold mb-2">
                        {Math.round((activityData?.stats.returningUsers ?? 0 / (activityData?.stats.totalUsers ?? 1) ) * 100)}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Tasa de retención
                      </div>
                      <div className="mt-4 text-sm">
                        {activityData?.stats.returningUsers} de {activityData?.stats.totalUsers} usuarios vuelven regularmente
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}