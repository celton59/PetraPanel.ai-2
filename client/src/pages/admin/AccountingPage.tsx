import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountingMetrics } from '@/pages/settings/tabs/accounting/AccountingMetrics';
import { PaymentsTab } from '@/pages/settings/tabs/accounting/PaymentsTab';
import { ReportsTab } from '@/pages/settings/tabs/accounting/ReportsTab';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, CreditCard, FileText } from "lucide-react";

export default function AccountingPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col space-y-1.5">
          <h1 className="text-3xl font-bold">Sistema de Contabilidad</h1>
          <p className="text-muted-foreground">
            Gestiona el sistema financiero, pagos y reportes de la plataforma
          </p>
        </div>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <Tabs defaultValue="metrics" className="w-full">
              <TabsList className="w-full max-w-md grid grid-cols-3 mb-6">
                <TabsTrigger value="metrics" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Métricas</span>
                </TabsTrigger>
                <TabsTrigger value="payments" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Pagos</span>
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Reportes</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="metrics" className="py-4 mt-0">
                <AccountingMetrics />
              </TabsContent>
              
              <TabsContent value="payments" className="py-4 mt-0">
                <PaymentsTab />
              </TabsContent>
              
              <TabsContent value="reports" className="py-4 mt-0">
                <ReportsTab />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}