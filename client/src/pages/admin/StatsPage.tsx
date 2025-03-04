import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { PerformanceStats } from '@/components/dashboard/PerformanceStats';
import { VideoStats } from '@/components/dashboard/VideoStats';

export default function AdminStatsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Estadísticas del Sistema</h1>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full max-w-md grid grid-cols-3">
            <TabsTrigger value="overview">General</TabsTrigger>
            <TabsTrigger value="performance">Rendimiento</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="py-4">
            <StatsOverview mode="detailed" showDetailedCharts showTables showExportOptions />
          </TabsContent>
          
          <TabsContent value="performance" className="py-4">
            <PerformanceStats />
          </TabsContent>
          
          <TabsContent value="videos" className="py-4">
            <VideoStats />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}