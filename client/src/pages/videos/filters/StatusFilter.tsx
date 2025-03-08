import React from 'react';
import { FileType } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VIDEO_STATUSES_ARRAY } from "@db/schema";
import { User } from "@/hooks/use-user";

// Mapa para mostrar nombres amigables de los estados
const STATUS_LABELS: Record<string, string> = {
  all: "Todos los estados",
  available: "Disponible",
  content_corrections: "Correcciones de Contenido",
  content_review: "Revisión de Contenido",
  upload_media: "Subir Media",
  media_corrections: "Correcciones de Media",
  media_review: "Revisión de Media",
  final_review: "Revisión Final",
  completed: "Completado"
};

// Estados visibles por cada rol
const VISIBLE_STATES_BY_ROLE: Record<User["role"], readonly string[]> = {
  admin: VIDEO_STATUSES_ARRAY,
  optimizer: ["available", "content_corrections"],
  youtuber: ["upload_media", "media_corrections"],
  reviewer: ["content_review", "media_review", "final_review"],
  content_reviewer: ["content_review"],
  media_reviewer: ["media_review"]
};

interface StatusFilterProps {
  status: string;
  onStatusChange: (status: string) => void;
  visibleStates?: readonly string[];
}

export const StatusFilter = ({ status, onStatusChange, visibleStates }: StatusFilterProps) => {
  // Si se proporcionan visibleStates, los usamos, de lo contrario usamos todos los estados
  const statesToShow = visibleStates || VIDEO_STATUSES_ARRAY;

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
          <SelectItem value="all">{STATUS_LABELS.all}</SelectItem>
          {statesToShow.map((stateValue) => (
            <SelectItem key={stateValue} value={stateValue}>
              {STATUS_LABELS[stateValue] || stateValue}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
