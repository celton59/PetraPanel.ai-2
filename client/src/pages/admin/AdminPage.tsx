import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { PaymentIcon, MoneyIcon, TasksIcon, PendingIcon } from "@/components/CustomIcons";
import StatsCard from "@/components/StatsCard";

export default function AdminPage() {
  return (
    <AdminLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Panel de Administración</h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Usuarios Activos"
            value="32"
            change="+8% vs mes anterior"
            isPositive={true}
            icon={PendingIcon}
          />
          <StatsCard
            title="Proyectos"
            value="15"
            change="+2 nuevos"
            isPositive={true}
            icon={TasksIcon}
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
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Últimas actividades del sistema</p>
              
              <div className="mt-4 space-y-4">
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
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Resumen Financiero</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Datos financieros del mes actual</p>
              
              <div className="mt-6 space-y-4">
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
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}