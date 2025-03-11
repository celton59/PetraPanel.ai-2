import React from 'react';
import { Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import api from "../../../lib/axios";

interface AssigneeFilterProps {
  assignedTo: string;
  onAssignedToChange: (userId: string) => void;
}

export const AssigneeFilter = ({ assignedTo, onAssignedToChange }: AssigneeFilterProps) => {
  const { data: response } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      try {
        // Usamos la instancia de axios configurada con protección CSRF
        const response = await api.get('/api/users');
        return response.data;
      } catch (error: any) {
        console.error("Error fetching users:", error);
        throw new Error(error.response?.data?.message || 'Error fetching users');
      }
    }
  });

  // Extraer los usuarios de la respuesta
  const users = response?.data || [];

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        <Users className="h-4 w-4" />
        Asignado a
      </label>
      <Select value={assignedTo} onValueChange={onAssignedToChange}>
        <SelectTrigger className="w-full bg-background">
          <SelectValue placeholder="Asignado a" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los usuarios</SelectItem>
          <SelectItem value="unassigned">Sin asignar</SelectItem>
          {users.map((user: any) => (
            <SelectItem key={user.id} value={user.id.toString()}>
              {user.fullName || user.username}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};