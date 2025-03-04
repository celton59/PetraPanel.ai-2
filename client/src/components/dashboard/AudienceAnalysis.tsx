import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { motion } from "framer-motion";
import { Globe, Users, UserCheck } from "lucide-react";

// Datos de ejemplo - Normalmente vendrían de una API
const AUDIENCE_DATA = {
  age: [
    { group: '18-24', percentage: 22, color: '#3B82F6' },
    { group: '25-34', percentage: 38, color: '#10B981' },
    { group: '35-44', percentage: 27, color: '#6366F1' },
    { group: '45-54', percentage: 8, color: '#EC4899' },
    { group: '55+', percentage: 5, color: '#F59E0B' }
  ],
  gender: [
    { type: 'Masculino', percentage: 58, color: '#3B82F6' },
    { type: 'Femenino', percentage: 42, color: '#EC4899' }
  ],
  regions: [
    { name: 'América Latina', value: 45, color: '#3B82F6' },
    { name: 'Norteamérica', value: 28, color: '#10B981' },
    { name: 'Europa', value: 18, color: '#6366F1' },
    { name: 'Asia', value: 6, color: '#EC4899' },
    { name: 'Otros', value: 3, color: '#F59E0B' }
  ],
  engagement: [
    { level: 'Alto', value: 35, color: '#10B981' },
    { level: 'Medio', value: 45, color: '#3B82F6' },
    { level: 'Bajo', value: 20, color: '#F59E0B' }
  ],
  retention: {
    returning: 65,
    new: 35
  }
};

export function AudienceAnalysis() {
  const [activeTab, setActiveTab] = useState("demographics");

  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-300 border border-border/50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Análisis de Audiencia
          </h3>
        </div>
      </div>

      <Tabs defaultValue="demographics" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full rounded-lg p-1 bg-muted">
          <TabsTrigger value="demographics" className="rounded-md data-[state=active]:bg-background">
            Demografía
          </TabsTrigger>
          <TabsTrigger value="geography" className="rounded-md data-[state=active]:bg-background">
            Geografía
          </TabsTrigger>
          <TabsTrigger value="engagement" className="rounded-md data-[state=active]:bg-background">
            Interacción
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="demographics" className="space-y-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Distribución por edad */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Distribución por Edad</h4>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={AUDIENCE_DATA.age} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="group" type="category" />
                    <Tooltip formatter={(value) => [`${value}%`, 'Porcentaje']} />
                    <Bar 
                      dataKey="percentage" 
                      radius={[0, 4, 4, 0]}
                    >
                      {AUDIENCE_DATA.age.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Distribución por género */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Distribución por Género</h4>
              <div className="h-[250px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={AUDIENCE_DATA.gender}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="percentage"
                    >
                      {AUDIENCE_DATA.gender.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Porcentaje']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        </TabsContent>
        
        <TabsContent value="geography" className="space-y-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-primary" />
              <h4 className="text-sm font-medium">Distribución por Región</h4>
            </div>
            
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={AUDIENCE_DATA.regions}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {AUDIENCE_DATA.regions.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, 'Porcentaje']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {AUDIENCE_DATA.regions.map((region, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: region.color }} />
                  <span className="text-xs">{region.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </TabsContent>
        
        <TabsContent value="engagement" className="space-y-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Nivel de Engagement */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Nivel de Interacción</h4>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={AUDIENCE_DATA.engagement}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                    <XAxis dataKey="level" />
                    <YAxis tickFormatter={(value) => `${value}%`} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Porcentaje']} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {AUDIENCE_DATA.engagement.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Tasa de Retención */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Tasa de Retención</h4>
              <div className="h-[250px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Espectadores recurrentes", value: AUDIENCE_DATA.retention.returning, color: "#10B981" },
                        { name: "Nuevos espectadores", value: AUDIENCE_DATA.retention.new, color: "#3B82F6" }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#10B981" />
                      <Cell fill="#3B82F6" />
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Porcentaje']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}