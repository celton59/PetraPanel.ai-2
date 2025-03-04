import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountingMetrics } from '@/pages/settings/tabs/accounting/AccountingMetrics';
import { RatesTab } from '@/pages/settings/tabs/accounting/RatesTab';
import { PaymentsTab } from '@/pages/settings/tabs/accounting/PaymentsTab';
import { ReportsTab } from '@/pages/settings/tabs/accounting/ReportsTab';

export default function AccountingPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Sistema de Contabilidad</h1>
        
        <Tabs defaultValue="metrics" className="w-full">
          <TabsList className="w-full max-w-2xl grid grid-cols-4">
            <TabsTrigger value="metrics">Métricas</TabsTrigger>
            <TabsTrigger value="rates">Tarifas</TabsTrigger>
            <TabsTrigger value="payments">Pagos</TabsTrigger>
            <TabsTrigger value="reports">Reportes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="metrics" className="py-4">
            <AccountingMetrics />
          </TabsContent>
          
          <TabsContent value="rates" className="py-4">
            <RatesTab />
          </TabsContent>
          
          <TabsContent value="payments" className="py-4">
            <PaymentsTab />
          </TabsContent>
          
          <TabsContent value="reports" className="py-4">
            <ReportsTab />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}