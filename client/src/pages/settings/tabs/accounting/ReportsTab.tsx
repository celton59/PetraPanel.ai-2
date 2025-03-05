import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format, subDays, subMonths } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  CalendarIcon, 
  Download, 
  FileSpreadsheet, 
  File, 
  FileText,
  RefreshCcw
} from "lucide-react";
import { cn } from "@/lib/utils";

// Tipos
interface Report {
  id: number;
  name: string;
  type: string;
  format: string;
  status: "generated" | "processing" | "error";
  createdAt: string;
  url?: string;
}

interface ReportConfig {
  type: string;
  format: string;
  startDate: Date;
  endDate: Date;
  includeUsers: boolean;
  includeProjects: boolean;
  includeActions: boolean;
}

const reportTypes = {
  financial: "Reporte Financiero",
  activity: "Actividad por Usuario",
  projects: "Desglose por Proyectos",
  complete: "Reporte Completo",
};

const reportFormats = {
  pdf: "PDF",
  excel: "Excel",
  csv: "CSV",
};

// Datos de ejemplo
const demoReports: Report[] = [
  {
    id: 1,
    name: "Reporte Financiero - Febrero 2025",
    type: "financial",
    format: "pdf",
    status: "generated",
    createdAt: "2025-02-25T14:30:00Z",
    url: "#"
  },
  {
    id: 2,
    name: "Actividad por Usuario - Q1 2025",
    type: "activity",
    format: "excel",
    status: "generated",
    createdAt: "2025-02-10T09:15:00Z",
    url: "#"
  },
  {
    id: 3,
    name: "Desglose por Proyectos - Enero 2025",
    type: "projects",
    format: "csv",
    status: "generated",
    createdAt: "2025-01-31T16:45:00Z",
    url: "#"
  },
  {
    id: 4,
    name: "Reporte Completo - 2024",
    type: "complete",
    format: "pdf",
    status: "generated",
    createdAt: "2025-01-05T11:20:00Z",
    url: "#"
  },
  {
    id: 5,
    name: "Análisis Financiero - Último Trimestre",
    type: "financial",
    format: "excel",
    status: "processing",
    createdAt: "2025-03-01T10:05:00Z",
  },
];

const reportFormSchema = z.object({
  type: z.string({
    required_error: "Por favor seleccione un tipo de reporte",
  }),
  format: z.string({
    required_error: "Por favor seleccione un formato",
  }),
  dateRange: z.object({
    from: z.date({
      required_error: "Por favor seleccione una fecha de inicio",
    }),
    to: z.date({
      required_error: "Por favor seleccione una fecha de fin",
    }),
  }),
  includeUsers: z.boolean().default(true),
  includeProjects: z.boolean().default(true),
  includeActions: z.boolean().default(true),
});

type ReportFormValues = z.infer<typeof reportFormSchema>;

export function ReportsTab() {
  const { toast } = useToast();
  const [reportSection, setReportSection] = useState<"list" | "create">("list");
  
  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      type: "financial",
      format: "pdf",
      dateRange: {
        from: subMonths(new Date(), 1),
        to: new Date(),
      },
      includeUsers: true,
      includeProjects: true,
      includeActions: true,
    },
  });

  // En un entorno real, esta consulta obtendría datos del backend
  const { 
    data: reports, 
    isLoading, 
    refetch
  } = useQuery<Report[]>({
    queryKey: ["accounting-reports"],
    queryFn: async () => {
      // En un entorno real:
      // const response = await axios.get("/api/accounting/reports");
      // return response.data;
      
      // Por ahora, devolvemos datos de ejemplo
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(demoReports);
        }, 500);
      });
    },
  });

  // En un entorno real, esta mutación enviaría datos al backend
  const generateReportMutation = useMutation({
    mutationFn: async (data: ReportFormValues) => {
      // En un entorno real:
      // return await axios.post("/api/accounting/reports", data);
      
      // Por ahora, simulamos una respuesta exitosa
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true });
        }, 1000);
      });
    },
    onSuccess: () => {
      toast({
        title: "Reporte solicitado",
        description: "Su reporte está siendo generado y estará disponible en breve.",
      });
      setReportSection("list");
      // En un entorno real, aquí refrescaríamos la lista de reportes
      // refetch();
    },
  });

  const onSubmit = (data: ReportFormValues) => {
    generateReportMutation.mutate(data);
  };

  const getReportTypeName = (type: string) => {
    return reportTypes[type as keyof typeof reportTypes] || type;
  };

  const getFormatName = (format: string) => {
    return reportFormats[format as keyof typeof reportFormats] || format;
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "pdf":
        return <File className="h-4 w-4" />;
      case "excel":
        return <FileSpreadsheet className="h-4 w-4" />;
      case "csv":
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: Report["status"]) => {
    switch (status) {
      case "generated":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Disponible</Badge>;
      case "processing":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Procesando</Badge>;
      case "error":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Error</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">
          {reportSection === "list" ? "Reportes Contables" : "Crear Nuevo Reporte"}
        </h3>
        <div className="flex gap-2">
          {reportSection === "list" ? (
            <>
              <Button variant="outline" onClick={() => refetch()} className="gap-1">
                <RefreshCcw className="h-4 w-4" />
                Actualizar
              </Button>
              <Button onClick={() => setReportSection("create")}>
                Nuevo Reporte
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setReportSection("list")}>
              Volver a Reportes
            </Button>
          )}
        </div>
      </div>

      {reportSection === "list" ? (
        <>
          {isLoading ? (
            <div className="text-center py-8">Cargando reportes...</div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre del Reporte</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Formato</TableHead>
                    <TableHead>Fecha de Creación</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports && reports.length > 0 ? (
                    reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>{report.name}</TableCell>
                        <TableCell>{getReportTypeName(report.type)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getFormatIcon(report.format)}
                            {getFormatName(report.format)}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(report.createdAt)}</TableCell>
                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                        <TableCell className="text-right">
                          {report.status === "generated" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              title="Descargar reporte"
                            >
                              <a href={report.url} download>
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        No hay reportes generados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Generar Nuevo Reporte</CardTitle>
            <CardDescription>
              Configure los parámetros para el reporte que desea generar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Reporte</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione tipo de reporte" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="financial">Reporte Financiero</SelectItem>
                            <SelectItem value="activity">Actividad por Usuario</SelectItem>
                            <SelectItem value="projects">Desglose por Proyectos</SelectItem>
                            <SelectItem value="complete">Reporte Completo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Seleccione qué tipo de información desea incluir en el reporte.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="format"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Formato</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione formato" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pdf">PDF</SelectItem>
                            <SelectItem value="excel">Excel</SelectItem>
                            <SelectItem value="csv">CSV</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Seleccione el formato en que desea recibir el reporte.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dateRange"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Rango de Fechas</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value?.from ? (
                                  field.value.to ? (
                                    <>
                                      {format(field.value.from, "dd/MM/yyyy")} -{" "}
                                      {format(field.value.to, "dd/MM/yyyy")}
                                    </>
                                  ) : (
                                    format(field.value.from, "dd/MM/yyyy")
                                  )
                                ) : (
                                  <span>Seleccione un rango de fechas</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="range"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          Seleccione el período que desea incluir en el reporte.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="includeUsers"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="form-checkbox h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Incluir detalles de usuarios</FormLabel>
                            <FormDescription>
                              Incluye información detallada de cada usuario
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="includeProjects"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="form-checkbox h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Incluir detalles de proyectos</FormLabel>
                            <FormDescription>
                              Incluye desglose por proyectos
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="includeActions"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="form-checkbox h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Incluir detalle de acciones</FormLabel>
                            <FormDescription>
                              Incluye listado completo de acciones
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setReportSection("list")}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={generateReportMutation.isPending}
                  >
                    {generateReportMutation.isPending
                      ? "Generando..."
                      : "Generar Reporte"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}