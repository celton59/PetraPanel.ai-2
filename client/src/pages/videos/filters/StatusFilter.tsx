import React from 'react';
import { FileType } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VideoStatus } from "@db/schema";

interface StatusFilterProps {
  status: string;
  onStatusChange: (status: string) => void;
}

export const StatusFilter = ({ status, onStatusChange }: StatusFilterProps) => {
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
          <SelectItem value="pending">Pendientes</SelectItem>
          <SelectItem value="in_progress">En Progreso</SelectItem>
          <SelectItem value="optimize_review">Rev. Optimización</SelectItem>
          <SelectItem value="upload_review">Rev. Archivos</SelectItem>
          <SelectItem value="review">Rev. Final</SelectItem>
          <SelectItem value="youtube_ready">Listo YouTube</SelectItem>
          <SelectItem value="completed">Completados</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
