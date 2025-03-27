import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import {
  Search, Save, User, CalendarClock, Calendar, Plus, Video, Info,
  Star, Trash2, Check, CalendarRange, Table2, CalendarCheck, ListTodo
} from 'lucide-react';
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useVideoLimits } from "@/hooks/useVideoLimits";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Loader2 } from 'lucide-react';
import { useMutation } from "@tanstack/react-query";
import { MonthlyVideoLimit } from "@db/schema";

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

// Interfaz para el formulario de límites básicos
interface LimitsFormValues {
  userId: string;
  maxMonthlyVideos: number;
  maxAssignedVideos: number;
}

// Interfaz para el formulario de límites mensuales específicos
interface MonthlyLimitFormValues {
  year: number;
  month: number;
  maxVideos: number;
}

// Interfaz para representar un límite mensual específico
interface MonthlyLimit {
  year: number;
  month: number;
  maxVideos: number;
}

/**
 * Pestaña de configuración de límites de videos
 * Permite configurar límites mensuales individuales para cada youtuber
 */
export function VideoLimitsTab() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<UserWithLimits[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithLimits[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserWithLimits | null>(null);
  const [searchTerm, setSearchTerm] = useState("");


  // Inicializar formulario
  const form = useForm<LimitsFormValues>({
    defaultValues: {
      userId: "",
      maxMonthlyVideos: 50,
      maxAssignedVideos: 10
    }
  });

  // Cargar usuarios y sus límites
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('/api/users');
        console.log('Respuesta completa:', response.data);

        if (!response.data || !response.data.data || !Array.isArray(response.data.data)) {
          console.error('Formato de respuesta incorrecto:', response.data);
          throw new Error('La respuesta de usuarios no tiene el formato esperado');
        }

        // Obtener límites actuales para todos los usuarios (no filtrar por rol en el backend)
        const usersWithLimitsPromises = response.data.data
          .map(async (user: any) => {
            try {
              const limitsResponse = await axios.get(`/api/youtuber/video-limits?userId=${user.id}`);
              console.log(`Límites para usuario ${user.id}:`, limitsResponse.data);

              // Asegurarse de que la estructura sea correcta
              const limits = limitsResponse.data;
              return {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                role: user.role,
                maxAssignedVideos: user.maxAssignedVideos || limits.maxAssignedAllowed || 10,
                maxMonthlyVideos: user.maxMonthlyVideos || limits.monthlyLimit || 50,
                currentMonthVideos: limits.currentMonthlyCount || 0,
                currentAssignedVideos: limits.currentAssignedCount || 0
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
          description: "No se pudieron cargar los usuarios. Por favor, inicia sesión nuevamente.",
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
  const handleSubmit = async (data: LimitsFormValues) => {
    if (!data.userId) {
      toast({
        title: "Error",
        description: "Debes seleccionar un usuario",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const userId = Number(data.userId);

      // Intentar actualizar mediante API
      try {
        console.log(`Actualizando límites para usuario ${userId}:`, {
          maxMonthlyVideos: data.maxMonthlyVideos,
          maxAssignedVideos: data.maxAssignedVideos
        });
        await axios.put(`/api/users/${userId}`, {
          maxMonthlyVideos: data.maxMonthlyVideos,
          maxAssignedVideos: data.maxAssignedVideos
        });
      } catch (apiError) {
        console.warn("API update failed, only updating UI:", apiError);
      }

      // Siempre actualizar el estado local (para modo demo/offline)
      const updatedUsers = users.map(user =>
        user.id === userId
          ? {
            ...user,
            maxMonthlyVideos: data.maxMonthlyVideos,
            maxAssignedVideos: data.maxAssignedVideos
          }
          : user
      );

      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers);

      toast({
        title: "Límites actualizados",
        description: `Límites actualizados correctamente para el usuario`,
      });
    } catch (error) {
      console.error("Error updating user limits:", error);
      toast({
        title: "Error",
        description: "No se pudieron actualizar los límites del usuario",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejar cuando se selecciona un usuario
  const handleUserSelect = (userId: string) => {
    const user = users.find(u => u.id.toString() === userId);
    if (user) {
      setSelectedUser(user);
      form.setValue("userId", userId);
      form.setValue("maxMonthlyVideos", user.maxMonthlyVideos);
      form.setValue("maxAssignedVideos", user.maxAssignedVideos);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Configuración de Límites de Videos</CardTitle>
          <CardDescription>
            Configura los límites mensuales y concurrentes de videos para youtubers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <FormField
                    control={form.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Usuario</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleUserSelect(value);
                          }}
                        >
                          <FormControl>
                            <SelectTrigger className="min-w-[220px]">
                              <SelectValue placeholder="Seleccionar usuario" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {users
                              .filter(user => user.role === 'youtuber')
                              .map((user) => (
                                <SelectItem key={user.id} value={user.id.toString()}>
                                  {user.fullName} ({user.username})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Selecciona el youtuber al que quieres configurar los límites
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {selectedUser && (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-5 w-5" />
                      <span className="font-medium">{selectedUser.fullName}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="block">Usuario: {selectedUser.username}</span>
                          <span className="block">Rol: {selectedUser.role}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span>Videos usando: </span>
                            <span className="font-medium">{selectedUser.currentAssignedVideos}</span>
                            <span> de </span>
                            <span className="font-medium">{selectedUser.maxAssignedVideos}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span>Videos este mes: </span>
                            <span className="font-medium">{selectedUser.currentMonthVideos}</span>
                            <span> de </span>
                            <span className="font-medium">{selectedUser.maxMonthlyVideos}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="maxMonthlyVideos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Límite mensual de videos</FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <CalendarClock className="h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            min={1}
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Número máximo de videos que puede completar el youtuber durante un mes
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxAssignedVideos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Límite concurrente de videos</FormLabel>
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <CalendarClock className="h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            min={1}
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Número máximo de videos que el youtuber puede tener asignados simultáneamente
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !form.getValues().userId}
                className="w-full md:w-auto"
              >
                {isSubmitting ? "Guardando..." : "Guardar límites"}
                <Save className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumen de Límites Actuales</CardTitle>
          <CardDescription>
            Vista general de los límites de videos de todos los youtubers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex mb-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o usuario"
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
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
          ) : filteredUsers.length === 0 ? (
            <Alert>
              <AlertDescription>
                No se encontraron usuarios con el término de búsqueda.
              </AlertDescription>
            </Alert>
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
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers
                    .filter(user => user.role === 'youtuber')
                    .map((user) => (
                      <TableRow
                        key={user.id}
                        className={selectedUser?.id === user.id ? "bg-muted/50" : ""}
                      >
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.fullName}</TableCell>
                        <TableCell className="text-center">{user.maxAssignedVideos}</TableCell>
                        <TableCell className="text-center">{user.currentAssignedVideos}</TableCell>
                        <TableCell className="text-center">{user.maxMonthlyVideos}</TableCell>
                        <TableCell className="text-center">{user.currentMonthVideos}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUserSelect(user.id.toString())}
                          >
                            Editar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nuevo componente para gestionar límites mensuales específicos */}
      {selectedUser && (
        <Card className="mt-6 border-amber-200">
          <div className="h-1 w-full bg-gradient-to-r from-amber-400 to-amber-600"></div>
          <CardHeader className="bg-amber-50">
            <div className="flex items-center gap-2">
              <div className="bg-amber-100 p-1.5 rounded-full">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Calendario de Límites Personalizados</CardTitle>
                <CardDescription>
                  Define cuántos videos puede producir {selectedUser.fullName} en meses específicos
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-amber-50/50 -mt-2 -mx-2 p-4 mb-4 rounded-lg border border-amber-100">
              <h4 className="text-sm font-medium flex items-center gap-1.5 mb-2">
                <Calendar className="h-4 w-4 text-amber-600" />
                ¿Por qué usar límites mensuales personalizados?
              </h4>
              <p className="text-sm text-muted-foreground">
                Los límites mensuales personalizados te permiten ajustar la capacidad de producción para:
              </p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                <li className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-amber-600" />
                  Temporadas altas o campañas especiales (aumentar el límite)
                </li>
                <li className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-amber-600" />
                  Períodos de vacaciones o baja actividad (reducir el límite)
                </li>
                <li className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-amber-600" />
                  Asignar cuotas de producción específicas por mes
                </li>
              </ul>
            </div>
            <MonthlyLimitsManager userId={selectedUser.id} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Componente para gestionar límites mensuales específicos
 */
function MonthlyLimitsManager({ userId }: { userId: number }) {
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<'table' | 'calendar'>('calendar');
  const queryClient = useQueryClient();

  // Query para obtener límites mensuales
  const {
    data: monthlyLimitsData,
    isLoading,
    error
  } = useQuery<Pick<MonthlyVideoLimit,'year' | 'month' | 'maxVideos'>[]>({
    queryKey: ["monthly-limits", userId],
    queryFn: async () => {
      const response = await axios.get(`/api/youtuber/monthly-limits/${userId}`);
      return response.data?.data || [];
    },
    enabled: Boolean(userId)
  });

  // Mutation para actualizar límites
  const updateLimitMutation = useMutation({
    mutationFn: async ({ maxVideos, year, month }: { maxVideos: number, year: number, month: number }) => {
      const response = await axios.post('/api/youtuber/monthly-limit', {
        userId,
        maxVideos,
        year,
        month
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly-limits", userId] });
      queryClient.invalidateQueries({ queryKey: ["video-limits", userId] });
      toast({
        title: "Límite actualizado",
        description: "El límite mensual se ha actualizado correctamente"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Error al actualizar el límite",
        variant: "destructive"
      });
    }
  });

  // Estados de error y carga
  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-md">
        <p className="text-sm">Error al cargar los límites mensuales</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const monthlyLimits = monthlyLimitsData || [];

  // Obtener nombre del mes
  const getMonthName = (month: number) => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[month - 1] || 'Desconocido';
  };

  // Vista de calendario
  const renderCalendarView = () => {
    const currentYear = new Date().getFullYear();

    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-600" />
            {currentYear}
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
              const limit = monthlyLimits.find(l => l.year === currentYear && l.month === month);
              const hasLimit = !!limit;

              return (
                <div
                  key={`${currentYear}-${month}`}
                  className={cn(
                    "p-3 rounded-md border",
                    hasLimit ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-200"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{getMonthName(month)}</span>
                    {hasLimit ? (
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">
                        {limit?.maxVideos} videos
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        Límite global
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Input
                      type="number"
                      min={1}
                      placeholder="Límite"
                      className="h-8"
                      defaultValue={limit?.maxVideos || 50}
                      onBlur={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value) && value > 0) {
                          updateLimitMutation.mutate({
                            maxVideos: value,
                            year: currentYear,
                            month
                          });
                        }
                      }}
                    />
                  </div>

                  {hasLimit && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-7 mt-2 text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                      onClick={() => {
                        updateLimitMutation.mutate({
                          maxVideos: 0,
                          year: currentYear,
                          month
                        });
                      }}
                    >
                      Eliminar límite específico
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderCalendarView()}
      {updateLimitMutation.isPending && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Actualizando límite...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export { MonthlyLimitsManager };