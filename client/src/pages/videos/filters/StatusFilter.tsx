import React from 'react';
import { FileType } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VIDEO_STATUSES_ARRAY } from "@db/schema";

interface StatusFilterProps {
  status: string;
  onStatusChange: (status: string) => void;
  visibleStates?: readonly string[];
}

// Mapping de estados a nombres más amigables
const STATUS_LABELS: Record<string, string> = {
  "available": "Disponible",
  "content_corrections": "Correcciones de Contenido",
  "content_review": "Revisión de Contenido",
  "upload_media": "Subir Medios",
  "media_corrections": "Correcciones de Medios",
  "media_review": "Revisión de Medios",
  "final_review": "Revisión Final",
  "completed": "Completado"
};

export const StatusFilter = ({ status, onStatusChange, visibleStates }: StatusFilterProps) => {
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
          {(visibleStates || VIDEO_STATUSES_ARRAY).map((statusValue) => (
            <SelectItem key={statusValue} value={statusValue}>
              {STATUS_LABELS[statusValue] || statusValue}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
