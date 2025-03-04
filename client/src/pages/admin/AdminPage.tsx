import React from 'react';
import { Link } from 'wouter';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { PaymentIcon, MoneyIcon, TasksIcon, PendingIcon } from "@/components/CustomIcons";
import StatsCard from "@/components/StatsCard";
import { ArrowRight, BarChart, Settings, Users, FileText, BarChart2 } from "lucide-react";
import ActionCard from '@/components/ActionCard';

export default function AdminPage() {
  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/stats">
                <BarChart className="mr-2 h-4 w-4" />
                Ver estadísticas completas
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/settings">
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </Link>
            </Button>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Usuarios Activos"
            value="32"
            change="+8% vs mes anterior"
            isPositive={true}
            icon={Users}
          />
          <StatsCard
            title="Proyectos"
            value="15"
            change="+2 nuevos"
            isPositive={true}
            icon={FileText}
          />
          <StatsCard
            title="Videos Procesados"
            value="128"
            change="+15% vs mes anterior"
            isPositive={true}
            icon={TasksIcon}
          />
          <StatsCard
            title="Pagos del Mes"
            value="$5,280.00"
            change="+12% vs mes anterior"
            isPositive={true}
            icon={MoneyIcon}
          />
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>Últimas actividades del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4 border-b pb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <TasksIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Nuevo video optimizado</p>
                      <p className="text-sm text-muted-foreground">
                        Por <span className="font-medium">Carlos Medina</span> • Hace {i} hora(s)
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm" className="ml-auto" asChild>
                <Link href="/admin/stats">
                  Ver más actividades
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Resumen Financiero</CardTitle>
              <CardDescription>Datos financieros del mes actual</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Ingresos</span>
                  <span className="font-medium">$12,580.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Gastos</span>
                  <span className="font-medium">$5,280.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Pendiente</span>
                  <span className="font-medium">$2,150.00</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Balance</span>
                    <span className="font-bold text-primary">$7,300.00</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm" className="ml-auto" asChild>
                <Link href="/admin/accounting">
                  Ver contabilidad
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <ActionCard
            icon={BarChart2}
            title="Estadísticas Avanzadas"
            description="Accede a información detallada sobre el rendimiento del sistema, usuarios y videos."
            iconColor="text-blue-500"
            iconBgColor="bg-blue-50 dark:bg-blue-900/20"
            onClick={() => window.location.href = '/admin/stats'}
          />
          <ActionCard
            icon={MoneyIcon}
            title="Gestión Contable"
            description="Administra pagos, tarifas y consulta informes financieros."
            iconColor="text-green-500"
            iconBgColor="bg-green-50 dark:bg-green-900/20"
            onClick={() => window.location.href = '/admin/accounting'}
          />
          <ActionCard
            icon={Settings}
            title="Configuración"
            description="Personaliza ajustes del sistema, usuarios y permisos."
            iconColor="text-purple-500"
            iconBgColor="bg-purple-50 dark:bg-purple-900/20"
            onClick={() => window.location.href = '/admin/settings'}
          />
        </div>
      </div>
    </AdminLayout>
  );
}