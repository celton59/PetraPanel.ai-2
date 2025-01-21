import React from 'react';
import { Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

interface AssigneeFilterProps {
  assignedTo: string;
  onAssignedToChange: (userId: string) => void;
}

export const AssigneeFilter = ({ assignedTo, onAssignedToChange }: AssigneeFilterProps) => {
  const { data: response } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await fetch('/api/users', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Error fetching users');
      return response.json();
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