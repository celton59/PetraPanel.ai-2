import React from 'react';
import { FileType } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VideoStatus } from "@db/schema";

// Mapa de estados a etiquetas legibles
const statusLabels: Record<string, string> = {
  "available": "Disponibles",
  "content_corrections": "En Optimización",
  "content_review": "En Revisión",
  "upload_media": "Subida de Medios",
  "media_corrections": "Correcciones de Medios",
  "media_review": "Revisión de Medios",
  "final_review": "Revisión Final",
  "completed": "Completados"
};

interface StatusFilterProps {
  status: string;
  onStatusChange: (status: string) => void;
  visibleStates?: readonly string[];
}

export const StatusFilter = ({ status, onStatusChange, visibleStates }: StatusFilterProps) => {
  // Si no se proporcionan estados visibles, mostrar todos los estados
  const stateOptions = visibleStates || Object.keys(statusLabels);
  
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        <FileType className="h-4 w-4" />
        Estado
      </label>
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full bg-background">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          
          {/* Mostrar solo los estados visibles para el rol actual */}
          {stateOptions.map(stateKey => (
            <SelectItem key={stateKey} value={stateKey}>
              {statusLabels[stateKey] || stateKey}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
