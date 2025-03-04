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

export function AccountingTab() {
  const [activeTab, setActiveTab] = useState("rates");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Administración Contable</CardTitle>
        <CardDescription>
          Configure tarifas y gestione pagos a usuarios según sus actividades.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rates">Tarifas</TabsTrigger>
            <TabsTrigger value="payments">Pagos</TabsTrigger>
          </TabsList>
          <TabsContent value="rates" className="space-y-4">
            <RatesTab />
          </TabsContent>
          <TabsContent value="payments" className="space-y-4">
            <PaymentsTab />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}