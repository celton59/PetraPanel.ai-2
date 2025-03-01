import React from 'react';
import { FileType } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VideoStatus } from "@db/schema";

interface StatusFilterProps {
  status: string;
  onStatusChange: (status: string) => void;
  visibleStates?: any[];
}

export const StatusFilter = ({ status, onStatusChange, visibleStates = [] }: StatusFilterProps) => {
  const statusOptions = [
    { value: "all", label: "Todos los estados" },
    { value: "available", label: "Disponibles" },
    { value: "content_corrections", label: "Corr. Contenido" },
    { value: "content_review", label: "Rev. Contenido" },
    { value: "upload_media", label: "Subir Media" },
    { value: "media_corrections", label: "Corr. Media" },
    { value: "media_review", label: "Rev. Media" },
    { value: "final_review", label: "Rev. Final" },
    { value: "completed", label: "Completados" }
  ];
  
  const filteredOptions = visibleStates.length 
    ? [{ value: "all", label: "Todos los estados" }, ...statusOptions.filter(opt => visibleStates.includes(opt.value))]
    : statusOptions;

  return (
    <Select value={status} onValueChange={onStatusChange}>
      <SelectTrigger className="w-full bg-background border-muted/60 hover:border-primary/30 focus:ring-primary/20">
        <SelectValue placeholder="Estado" />
      </SelectTrigger>
      <SelectContent>
        {filteredOptions.map(option => (
          <SelectItem key={option.value} value={option.value} className="focus:bg-primary/10">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
