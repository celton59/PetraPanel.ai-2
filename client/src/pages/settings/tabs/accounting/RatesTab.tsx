import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Trash2, Plus } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";

// Definir los esquemas y tipos
interface Project {
  id: number;
  name: string;
}

interface Rate {
  id: number;
  actionType: string;
  roleId: string;
  projectId: number | null;
  rate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const actionTypes = [
  { id: "video_creation", name: "Creación de Video" },
  { id: "video_optimization", name: "Optimización de Video" },
  { id: "content_review", name: "Revisión de Contenido" },
  { id: "media_upload", name: "Subida de Medios" },
  { id: "media_review", name: "Revisión de Medios" },
  { id: "translation", name: "Traducción" },
];

const roleTypes = [
  { id: "admin", name: "Administrador" },
  { id: "youtuber", name: "Youtuber" },
  { id: "optimizer", name: "Optimizador" },
  { id: "content_reviewer", name: "Revisor de Contenido" },
  { id: "media_reviewer", name: "Revisor de Medios" },
];

const formSchema = z.object({
  actionType: z.string(),
  roleId: z.string(),
  projectId: z.number().nullable(),
  rate: z.number().min(0),
});

type FormValues = z.infer<typeof formSchema>;

export function RatesTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentRate, setCurrentRate] = useState<Rate | null>(null);
  const { projects } = useProjects();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      actionType: "",
      roleId: "",
      projectId: null,
      rate: 0,
    },
  });

  // Consulta para obtener las tarifas
  const { data: rates, isLoading } = useQuery<{
    success: boolean;
    data: Rate[];
  }>({
    queryKey: ["/api/accounting/rates"],
    queryFn: async () => {
      const response = await axios.get("/api/accounting/rates");
      return response.data;
    },
  });

  // Mutación para crear/actualizar tarifas
  const createUpdateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return await axios.post("/api/accounting/rates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounting/rates"] });
      setIsDialogOpen(false);
      toast({
        title: currentRate ? "Tarifa actualizada" : "Tarifa creada",
        description: currentRate
          ? "La tarifa se ha actualizado correctamente."
          : "La tarifa se ha creado correctamente.",
      });
      setCurrentRate(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Ha ocurrido un error al guardar la tarifa.",
        variant: "destructive",
      });
    },
  });

  // Mutación para eliminar tarifas
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await axios.delete(`/api/accounting/rates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounting/rates"] });
      toast({
        title: "Tarifa eliminada",
        description: "La tarifa se ha eliminado correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Ha ocurrido un error al eliminar la tarifa.",
        variant: "destructive",
      });
    },
  });

  // Función para abrir el diálogo de creación/edición
  const openDialog = (rate?: Rate) => {
    if (rate) {
      setCurrentRate(rate);
      form.reset({
        actionType: rate.actionType,
        roleId: rate.roleId,
        projectId: rate.projectId,
        rate: rate.rate,
      });
    } else {
      setCurrentRate(null);
      form.reset({
        actionType: "",
        roleId: "",
        projectId: null,
        rate: 0,
      });
    }
    setIsDialogOpen(true);
  };

  // Función para manejar el envío del formulario
  const onSubmit = (data: FormValues) => {
    createUpdateMutation.mutate(data);
  };

  // Función para eliminar una tarifa
  const handleDelete = (id: number) => {
    if (confirm("¿Está seguro de que desea eliminar esta tarifa?")) {
      deleteMutation.mutate(id);
    }
  };

  // Función para obtener el nombre de la acción
  const getActionName = (actionType: string) => {
    return actionTypes.find((a) => a.id === actionType)?.name || actionType;
  };

  // Función para obtener el nombre del rol
  const getRoleName = (roleId: string) => {
    return roleTypes.find((r) => r.id === roleId)?.name || roleId;
  };

  // Función para obtener el nombre del proyecto
  const getProjectName = (projectId: number | null) => {
    if (!projectId) return "Global";
    return (
      projects?.find((p: Project) => p.id === projectId)?.name ||
      `Proyecto ${projectId}`
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Tarifas de Acciones</h3>
        <Button onClick={() => openDialog()} className="gap-1">
          <Plus className="h-4 w-4" />
          Nueva Tarifa
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-4">Cargando tarifas...</div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Acción</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Proyecto</TableHead>
                <TableHead className="text-right">Tarifa ($)</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rates?.data && rates.data.length > 0 ? (
                rates.data.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell>{getActionName(rate.actionType)}</TableCell>
                    <TableCell>{getRoleName(rate.roleId)}</TableCell>
                    <TableCell>{getProjectName(rate.projectId)}</TableCell>
                    <TableCell className="text-right">
                      ${typeof rate.rate === 'number' ? rate.rate.toFixed(2) : rate.rate}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDialog(rate)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(rate.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    No hay tarifas configuradas. Cree una nueva tarifa.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Diálogo para crear/editar tarifa */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {currentRate ? "Editar Tarifa" : "Nueva Tarifa"}
            </DialogTitle>
            <DialogDescription>
              {currentRate
                ? "Actualice la información de la tarifa."
                : "Complete la información para crear una nueva tarifa."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="actionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Acción</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione una acción" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {actionTypes.map((action) => (
                          <SelectItem key={action.id} value={action.id}>
                            {action.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      La acción a la que se aplicará esta tarifa.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="roleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un rol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roleTypes.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      El rol al que se aplicará esta tarifa.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proyecto (opcional)</FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value === "global" ? null : parseInt(value))
                      }
                      defaultValue={
                        field.value !== null ? field.value.toString() : "global"
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Global (todos los proyectos)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="global">
                          Global (todos los proyectos)
                        </SelectItem>
                        {projects?.map((project: Project) => (
                          <SelectItem
                            key={project.id}
                            value={project.id.toString()}
                          >
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Seleccione un proyecto específico o deje en blanco para
                      aplicar a todos.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tarifa ($)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="pl-7"
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                          value={field.value}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      El monto a pagar por esta acción.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createUpdateMutation.isPending}>
                  {createUpdateMutation.isPending
                    ? "Guardando..."
                    : currentRate
                    ? "Actualizar"
                    : "Crear"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}