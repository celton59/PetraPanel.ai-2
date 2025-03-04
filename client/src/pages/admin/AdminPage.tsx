import React, { useState } from 'react';
import { Link } from 'wouter';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PaymentIcon, MoneyIcon, TasksIcon, PendingIcon } from "@/components/CustomIcons";
import StatsCard from "@/components/StatsCard";
import { 
  ArrowRight, 
  BarChart3, 
  Settings, 
  Users, 
  FileText, 
  PieChart, 
  BadgeCheck,
  TrendingUp
} from "lucide-react";
import ActionCard from '@/components/ActionCard';

export default function AdminPage() {
  return (
      <div className="space-y-8">
        <div className="flex flex-col space-y-1.5">
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <p className="text-muted-foreground">
            Monitoriza la actividad del sistema y gestiona todos los aspectos de la plataforma
          </p>
        </div>
        
        {/* Dashboard Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Usuarios Activos"
            value="32"
            change="+8% vs mes anterior"
            isPositive={true}
            icon={Users}
            animation={{
              type: "fade-up",
              delay: 100
            }}
          />
          <StatsCard
            title="Proyectos"
            value="15"
            change="+2 nuevos"
            isPositive={true}
            icon={FileText}
            animation={{
              type: "fade-up",
              delay: 200
            }}
          />
          <StatsCard
            title="Videos Procesados"
            value="128"
            change="+15% vs mes anterior"
            isPositive={true}
            icon={TasksIcon}
            animation={{
              type: "fade-up",
              delay: 300
            }}
          />
          <StatsCard
            title="Pagos del Mes"
            value="$5,280.00"
            change="+12% vs mes anterior"
            isPositive={true}
            icon={MoneyIcon}
            animation={{
              type: "fade-up",
              delay: 400
            }}
          />
        </div>
        
        {/* Activity & Finance */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="md:col-span-2 shadow-sm border-0">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Actividad Reciente</CardTitle>
                  <CardDescription>Últimas actividades del sistema</CardDescription>
                </div>
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/admin/stats">
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div 
                    key={i} 
                    className="flex items-center gap-4 border-b pb-3 transition-all hover:bg-muted/20 rounded-md p-2 -mx-2"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
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
          </Card>
          
          <Card className="shadow-sm border-0">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Resumen Financiero</CardTitle>
                  <CardDescription>Datos financieros del mes</CardDescription>
                </div>
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/admin/accounting">
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-muted/30 p-2 rounded-md">
                  <span className="text-sm font-medium">Ingresos</span>
                  <span className="font-medium text-green-600">$12,580.00</span>
                </div>
                <div className="flex justify-between items-center bg-muted/30 p-2 rounded-md">
                  <span className="text-sm font-medium">Gastos</span>
                  <span className="font-medium text-red-500">$5,280.00</span>
                </div>
                <div className="flex justify-between items-center bg-muted/30 p-2 rounded-md">
                  <span className="text-sm font-medium">Pendiente</span>
                  <span className="font-medium text-amber-500">$2,150.00</span>
                </div>
                <div className="pt-2 mt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold">Balance</span>
                    <span className="font-bold text-primary text-lg">$7,300.00</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Quick Access Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/admin/stats">
            <ActionCard
              icon={BarChart3}
              title="Estadísticas"
              description="Análisis detallado del rendimiento del sistema"
              iconColor="text-blue-500"
              iconBgColor="bg-blue-50 dark:bg-blue-900/20"
              className="h-full"
            />
          </Link>
          <Link href="/admin/accounting">
            <ActionCard
              icon={MoneyIcon}
              title="Contabilidad"
              description="Gestión de pagos y finanzas"
              iconColor="text-green-500"
              iconBgColor="bg-green-50 dark:bg-green-900/20"
              className="h-full"
            />
          </Link>
          <Link href="/admin/configuration">
            <ActionCard
              icon={Settings}
              title="Configuración"
              description="Ajustes del sistema y usuarios"
              iconColor="text-purple-500"
              iconBgColor="bg-purple-50 dark:bg-purple-900/20"
              className="h-full"
            />
          </Link>
          <ActionCard
            icon={BadgeCheck}
            title="Estado del Sistema"
            description="Todo funcionando correctamente"
            iconColor="text-emerald-500"
            iconBgColor="bg-emerald-50 dark:bg-emerald-900/20"
            className="h-full cursor-default"
          />
        </div>
        
        {/* Performance Metrics (Optional) */}
        <Card className="shadow-sm border-0">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Rendimiento del Sistema</CardTitle>
                <CardDescription>Métricas clave de rendimiento</CardDescription>
              </div>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/admin/stats">
                  <TrendingUp className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-muted/30 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Tiempo de Respuesta</div>
                <div className="text-2xl font-bold">245ms</div>
                <div className="text-xs text-green-500 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  10% mejor que ayer
                </div>
              </div>
              <div className="bg-muted/30 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Uso de CPU</div>
                <div className="text-2xl font-bold">36%</div>
                <div className="text-xs text-green-500 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Óptimo
                </div>
              </div>
              <div className="bg-muted/30 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Memoria</div>
                <div className="text-2xl font-bold">1.8 GB</div>
                <div className="text-xs text-green-500 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Estable
                </div>
              </div>
              <div className="bg-muted/30 p-4 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Almacenamiento</div>
                <div className="text-2xl font-bold">65%</div>
                <div className="text-xs text-amber-500 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Revisar pronto
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}