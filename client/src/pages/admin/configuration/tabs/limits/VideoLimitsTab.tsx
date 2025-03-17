import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Calendar } from 'lucide-react';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";

// Tipo para la configuración de límites mensuales
interface MonthlyLimitConfig {
  year: number;
  month: number;
  limit: number;
}

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
 * Permite configurar límites mensuales para todos los youtubers
 */
export function VideoLimitsTab() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("global");
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<UserWithLimits[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [globalMonthlyLimit, setGlobalMonthlyLimit] = useState(50);
  
  // Formulario para configuración global
  const globalForm = useForm({
    defaultValues: {
      globalMonthlyLimit: 50,
    },
  });

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

  // Actualizar límite mensual global
  const updateGlobalMonthlyLimit = async (data: { globalMonthlyLimit: number }) => {
    try {
      // Aquí iría la llamada a la API para actualizar el límite global mensual
      // Por ahora solo actualizamos el estado local para demostración
      setGlobalMonthlyLimit(data.globalMonthlyLimit);
      
      toast({
        title: "Configuración actualizada",
        description: `Límite mensual global configurado a ${data.globalMonthlyLimit} videos`,
      });
    } catch (error) {
      console.error("Error updating global monthly limit:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el límite mensual global",
        variant: "destructive",
      });
    }
  };

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

  // Generar años para el selector (últimos 3 años hasta 2 años futuros)
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear - 3; year <= currentYear + 2; year++) {
      years.push(year);
    }
    return years;
  };

  // Generar meses para el selector
  const getMonthOptions = () => {
    return [
      { value: 1, label: "Enero" },
      { value: 2, label: "Febrero" },
      { value: 3, label: "Marzo" },
      { value: 4, label: "Abril" },
      { value: 5, label: "Mayo" },
      { value: 6, label: "Junio" },
      { value: 7, label: "Julio" },
      { value: 8, label: "Agosto" },
      { value: 9, label: "Septiembre" },
      { value: 10, label: "Octubre" },
      { value: 11, label: "Noviembre" },
      { value: 12, label: "Diciembre" },
    ];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Límites de Videos</CardTitle>
        <CardDescription>
          Configura los límites de videos para youtubers, tanto globales como individuales
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="global" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="global">Límites Globales</TabsTrigger>
            <TabsTrigger value="individual">Límites Individuales</TabsTrigger>
          </TabsList>

          {/* Pestaña de límites globales */}
          <TabsContent value="global" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Form {...globalForm}>
                    <form onSubmit={globalForm.handleSubmit(updateGlobalMonthlyLimit)} className="space-y-4">
                      <FormField
                        control={globalForm.control}
                        name="globalMonthlyLimit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Límite Mensual Global</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min={1} 
                                {...field} 
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              Este límite se aplicará a todos los nuevos youtubers
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit">Guardar Configuración</Button>
                    </form>
                  </Form>
                </div>

                <div className="col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Configuración para periodo específico</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="space-y-2 flex-1">
                          <label className="text-sm font-medium">Mes</label>
                          <Select 
                            value={selectedMonth.toString()} 
                            onValueChange={(value) => setSelectedMonth(Number(value))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar mes" />
                            </SelectTrigger>
                            <SelectContent>
                              {getMonthOptions().map((month) => (
                                <SelectItem key={month.value} value={month.value.toString()}>
                                  {month.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2 flex-1">
                          <label className="text-sm font-medium">Año</label>
                          <Select 
                            value={selectedYear.toString()} 
                            onValueChange={(value) => setSelectedYear(Number(value))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar año" />
                            </SelectTrigger>
                            <SelectContent>
                              {getYearOptions().map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2 flex-1">
                          <label className="text-sm font-medium">Límite para el periodo</label>
                          <Input 
                            type="number" 
                            min={1} 
                            value={globalMonthlyLimit}
                            onChange={(e) => setGlobalMonthlyLimit(Number(e.target.value))}
                          />
                        </div>
                        
                        <Button className="mt-4 md:mt-0">
                          <Calendar className="mr-2 h-4 w-4" />
                          Establecer para periodo
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Pestaña de límites individuales */}
          <TabsContent value="individual" className="space-y-4 mt-4">
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
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
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
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              // Aplicar el límite global al usuario
                              updateUserLimit(user.id, "maxMonthlyVideos", globalMonthlyLimit);
                            }}
                          >
                            Aplicar global
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}