import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RatesTab } from "./RatesTab";
import { PaymentsTab } from "./PaymentsTab";
import { AccountingMetrics } from "./AccountingMetrics";
import { ReportsTab } from "./ReportsTab";
import { FinanceConfigTab } from "./FinanceConfigTab";

export function AccountingTab() {
  const [activeTab, setActiveTab] = useState("metrics");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Administración Contable</CardTitle>
        <CardDescription>
          Gestione métricas, tarifas, pagos, reportes y configuración financiera de la organización.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="metrics">Métricas</TabsTrigger>
            <TabsTrigger value="rates">Tarifas</TabsTrigger>
            <TabsTrigger value="payments">Pagos</TabsTrigger>
            <TabsTrigger value="reports">Reportes</TabsTrigger>
            <TabsTrigger value="config">Configuración</TabsTrigger>
          </TabsList>
          
          <TabsContent value="metrics" className="space-y-4">
            <AccountingMetrics />
          </TabsContent>
          
          <TabsContent value="rates" className="space-y-4">
            <RatesTab />
          </TabsContent>
          
          <TabsContent value="payments" className="space-y-4">
            <PaymentsTab />
          </TabsContent>
          
          <TabsContent value="reports" className="space-y-4">
            <ReportsTab />
          </TabsContent>
          
          <TabsContent value="config" className="space-y-4">
            <FinanceConfigTab />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}