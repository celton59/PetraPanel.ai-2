import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from 'lucide-react';
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";

// Tipo para el usuario con sus límites
interface UserWithLimits {
  id: number;
  username: string;
  fullName: string;
  role: string;
  maxAssignedVideos: number; 
  maxMonthlyVideos: number;
  currentMonthVideos: number;
  currentAssignedVideos: number;
}

/**
 * Pestaña de configuración de límites de videos
 * Permite configurar límites mensuales individuales para cada youtuber
 */
export function VideoLimitsTab() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<UserWithLimits[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithLimits[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  // Cargar usuarios y sus límites
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('/api/users');
        
        // Obtener límites actuales para cada usuario
        const usersWithLimitsPromises = response.data
          .filter((user: any) => user.role === 'youtuber')
          .map(async (user: any) => {
            try {
              const limitsResponse = await axios.get(`/api/youtuber/video-limits?userId=${user.id}`);
              return {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                role: user.role,
                maxAssignedVideos: user.maxAssignedVideos || 10,
                maxMonthlyVideos: user.maxMonthlyVideos || 50,
                currentMonthVideos: limitsResponse.data.currentMonthlyCount,
                currentAssignedVideos: limitsResponse.data.currentAssignedCount
              };
            } catch (error) {
              console.error(`Error fetching limits for user ${user.id}:`, error);
              return {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                role: user.role,
                maxAssignedVideos: user.maxAssignedVideos || 10,
                maxMonthlyVideos: user.maxMonthlyVideos || 50,
                currentMonthVideos: 0,
                currentAssignedVideos: 0
              };
            }
          });
          
        const usersWithLimits = await Promise.all(usersWithLimitsPromises);
        setUsers(usersWithLimits);
        setFilteredUsers(usersWithLimits);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los usuarios",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [toast]);

  // Filtrar usuarios basados en el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users);
    } else {
      const lowercaseSearchTerm = searchTerm.toLowerCase();
      const filtered = users.filter(
        user => 
          user.username.toLowerCase().includes(lowercaseSearchTerm) || 
          user.fullName.toLowerCase().includes(lowercaseSearchTerm)
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  // Actualizar límite individual de un usuario
  const updateUserLimit = async (userId: number, field: string, value: number) => {
    try {
      await axios.post(`/api/users/${userId}`, {
        [field]: value
      });
      
      // Actualizar el estado local
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, [field]: value }
          : user
      ));
      
      toast({
        title: "Límite actualizado",
        description: `Límite actualizado correctamente para el usuario`,
      });
    } catch (error) {
      console.error("Error updating user limit:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el límite del usuario",
        variant: "destructive",
      });
    }
  };

  // Manejar cuando se selecciona un usuario
  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Límites de Videos por Usuario</CardTitle>
        <CardDescription>
          Configura los límites mensuales de videos para cada youtuber individualmente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">Buscar usuario</label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o usuario"
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">Seleccionar usuario</label>
            <Select 
              value={selectedUserId} 
              onValueChange={handleUserSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar usuario" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.fullName} ({user.username})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabla de usuarios y sus límites */}
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Nombre completo</TableHead>
                  <TableHead className="text-center">Límite concurrente</TableHead>
                  <TableHead className="text-center">En uso</TableHead>
                  <TableHead className="text-center">Límite mensual</TableHead>
                  <TableHead className="text-center">Usados este mes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow 
                    key={user.id} 
                    className={selectedUserId === user.id.toString() ? "bg-muted/50" : ""}
                  >
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.fullName}</TableCell>
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        min={1}
                        className="w-16 mx-auto text-center"
                        value={user.maxAssignedVideos}
                        onChange={(e) => {
                          const newValue = Number(e.target.value);
                          setUsers(users.map(u => 
                            u.id === user.id 
                              ? { ...u, maxAssignedVideos: newValue }
                              : u
                          ));
                        }}
                        onBlur={(e) => updateUserLimit(user.id, "maxAssignedVideos", Number(e.target.value))}
                      />
                    </TableCell>
                    <TableCell className="text-center">{user.currentAssignedVideos}</TableCell>
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        min={1}
                        className="w-16 mx-auto text-center"
                        value={user.maxMonthlyVideos}
                        onChange={(e) => {
                          const newValue = Number(e.target.value);
                          setUsers(users.map(u => 
                            u.id === user.id 
                              ? { ...u, maxMonthlyVideos: newValue }
                              : u
                          ));
                        }}
                        onBlur={(e) => updateUserLimit(user.id, "maxMonthlyVideos", Number(e.target.value))}
                      />
                    </TableCell>
                    <TableCell className="text-center">{user.currentMonthVideos}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}