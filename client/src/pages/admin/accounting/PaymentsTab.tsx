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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  CreditCard,
  DollarSign,
  ChevronRight,
  CheckCircle2,
  Eye,
} from "lucide-react";

// Tipos y esquemas
interface User {
  id: number;
  username: string;
  fullName: string;
}

interface PendingPayment {
  userId: number;
  username: string;
  fullName: string;
  totalAmount: string;
  actionsCount: number;
}

interface UserAction {
  id: number;
  actionType: string;
  videoId: number | null;
  projectId: number | null;
  projectName: string | null;
  rate: number;
  isPaid: boolean;
  createdAt: string;
  paymentDate: string | null;
  paymentReference: string | null;
}

interface Payment {
  id: number;
  userId: number;
  username: string;
  fullName: string;
  amount: number;
  paymentDate: string;
  reference: string | null;
  notes: string | null;
}

const formSchema = z.object({
  userId: z.number(),
  amount: z.number().min(0.01, "El monto debe ser mayor a cero"),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const actionTypes = {
  video_creation: "Creación de Video",
  video_optimization: "Optimización de Video",
  content_review: "Revisión de Contenido",
  media_upload: "Subida de Medios",
  media_review: "Revisión de Medios",
  translation: "Traducción",
};

export function PaymentsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PendingPayment | null>(null);
  const [selectedActions, setSelectedActions] = useState<number[]>([]);
  const [currentUserActions, setCurrentUserActions] = useState<UserAction[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [paymentHistoryView, setPaymentHistoryView] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: 0,
      amount: 0,
      reference: "",
      notes: "",
    },
  });

  // Consulta para obtener pagos pendientes
  const {
    data: pendingPayments,
    isLoading: isLoadingPending,
    refetch: refetchPending,
  } = useQuery<{
    success: boolean;
    data: PendingPayment[];
  }>({
    queryKey: ["/api/accounting/pending-payments"],
    queryFn: async () => {
      const response = await axios.get("/api/accounting/pending-payments");
      return response.data;
    },
  });

  // Consulta para obtener historial de pagos
  const {
    data: paymentsHistory,
    isLoading: isLoadingHistory,
    refetch: refetchHistory,
  } = useQuery<{
    success: boolean;
    data: Payment[];
  }>({
    queryKey: ["/api/accounting/payments-history"],
    queryFn: async () => {
      const response = await axios.get("/api/accounting/payments-history");
      return response.data;
    },
    enabled: paymentHistoryView,
  });

  // Consulta para obtener acciones de un usuario
  const {
    data: userActions,
    isLoading: isLoadingActions,
    refetch: refetchActions,
  } = useQuery<{
    success: boolean;
    data: UserAction[];
  }>({
    queryKey: [
      "/api/accounting/user-actions",
      selectedUser?.userId,
      !selectedUser?.userId,
    ],
    queryFn: async () => {
      const response = await axios.get(
        `/api/accounting/user-actions/${selectedUser?.userId}?paid=false`
      );
      return response.data;
    },
    enabled: !!selectedUser?.userId && isPaymentDialogOpen,
  });

  // Mutación para registrar un pago
  const registerPaymentMutation = useMutation({
    mutationFn: async (data: FormValues & { actionIds: number[] }) => {
      return await axios.post("/api/accounting/payments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/accounting/pending-payments"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/accounting/payments-history"],
      });
      setIsPaymentDialogOpen(false);
      toast({
        title: "Pago registrado",
        description: "El pago ha sido registrado correctamente.",
      });
      setSelectedUser(null);
      setSelectedActions([]);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Ha ocurrido un error al registrar el pago.",
        variant: "destructive",
      });
    },
  });

  // Efecto para actualizar el formulario cuando se selecciona un usuario
  useEffect(() => {
    if (selectedUser) {
      form.setValue("userId", selectedUser.userId);
      form.setValue("amount", parseFloat(selectedUser.totalAmount));
    }
  }, [selectedUser, form]);

  // Efecto para actualizar las acciones seleccionadas cuando cambian las acciones del usuario
  useEffect(() => {
    if (userActions?.data) {
      setCurrentUserActions(userActions.data);
      setSelectedActions(userActions.data.map((action) => action.id));
    }
  }, [userActions]);

  // Función para abrir el diálogo de pago
  const openPaymentDialog = (user: PendingPayment) => {
    setSelectedUser(user);
    setIsPaymentDialogOpen(true);
  };

  // Función para manejar el envío del formulario de pago
  const onSubmit = (data: FormValues) => {
    registerPaymentMutation.mutate({
      ...data,
      actionIds: selectedActions,
    });
  };

  // Función para abrir el detalle de un pago
  const openPaymentDetails = async (payment: Payment) => {
    setSelectedPayment(payment);
    try {
      const response = await axios.get(
        `/api/accounting/user-actions/${payment.userId}?paid=true&paymentReference=${payment.id}`
      );
      setCurrentUserActions(response.data.data);
      setIsDetailsDialogOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description:
          "Ha ocurrido un error al obtener los detalles del pago.",
        variant: "destructive",
      });
    }
  };

  // Función para alternar entre la vista de pagos pendientes e historial
  const toggleView = () => {
    setPaymentHistoryView(!paymentHistoryView);
    if (!paymentHistoryView) {
      refetchHistory();
    } else {
      refetchPending();
    }
  };

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm");
  };

  // Función para obtener el nombre de la acción
  const getActionName = (actionType: string) => {
    return (
      actionTypes[actionType as keyof typeof actionTypes] || actionType
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">
          {paymentHistoryView ? "Historial de Pagos" : "Pagos Pendientes"}
        </h3>
        <Button variant="outline" onClick={toggleView}>
          {paymentHistoryView ? "Ver Pagos Pendientes" : "Ver Historial de Pagos"}
        </Button>
      </div>

      {/* Vista de pagos pendientes */}
      {!paymentHistoryView && (
        <>
          {isLoadingPending ? (
            <div className="text-center py-4">Cargando pagos pendientes...</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingPayments?.data && pendingPayments.data.length > 0 ? (
                pendingPayments.data.map((payment) => (
                  <Card
                    key={payment.userId}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => openPaymentDialog(payment)}
                  >
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-base">
                            {payment.fullName}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            @{payment.username}
                          </p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-lg font-bold text-primary">
                            ${parseFloat(payment.totalAmount).toFixed(2)}
                          </span>
                          <Badge variant="outline">
                            {payment.actionsCount} acciones
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            openPaymentDialog(payment);
                          }}
                        >
                          <DollarSign className="h-4 w-4" />
                          Registrar Pago
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full py-8 text-center text-muted-foreground">
                  No hay pagos pendientes por procesar.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Vista de historial de pagos */}
      {paymentHistoryView && (
        <>
          {isLoadingHistory ? (
            <div className="text-center py-4">
              Cargando historial de pagos...
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Referencia</TableHead>
                    <TableHead className="text-right">Monto ($)</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentsHistory?.data && paymentsHistory.data.length > 0 ? (
                    paymentsHistory.data.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{payment.fullName}</p>
                            <p className="text-sm text-muted-foreground">
                              @{payment.username}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDate(payment.paymentDate)}
                        </TableCell>
                        <TableCell>{payment.reference || "-"}</TableCell>
                        <TableCell className="text-right font-medium">
                          ${payment.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openPaymentDetails(payment)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        No hay registros de pagos.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      {/* Diálogo para registrar pago */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
            <DialogDescription>
              Complete la información para registrar un pago a{" "}
              {selectedUser?.fullName}.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto ($)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            className="pl-7"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value))
                            }
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Monto total a pagar por las acciones seleccionadas.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referencia (opcional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ej: Trans-12345" />
                      </FormControl>
                      <FormDescription>
                        Número de transacción o referencia del pago.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Agregue notas adicionales sobre este pago..."
                      />
                    </FormControl>
                    <FormDescription>
                      Información adicional sobre el pago.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="mt-2">
                <h4 className="text-sm font-medium mb-2">
                  Acciones a pagar ({selectedActions.length} seleccionadas)
                </h4>
                {isLoadingActions ? (
                  <div className="text-center py-4">
                    Cargando acciones del usuario...
                  </div>
                ) : (
                  <div className="max-h-[200px] overflow-y-auto border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">
                            <input
                              type="checkbox"
                              checked={
                                selectedActions.length ===
                                  currentUserActions.length &&
                                currentUserActions.length > 0
                              }
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedActions(
                                    currentUserActions.map(
                                      (action) => action.id
                                    )
                                  );
                                } else {
                                  setSelectedActions([]);
                                }
                              }}
                              className="rounded border-gray-300"
                            />
                          </TableHead>
                          <TableHead>Acción</TableHead>
                          <TableHead>Proyecto</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead className="text-right">Tarifa</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentUserActions && currentUserActions.length > 0 ? (
                          currentUserActions.map((action) => (
                            <TableRow key={action.id}>
                              <TableCell>
                                <input
                                  type="checkbox"
                                  checked={selectedActions.includes(action.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedActions([
                                        ...selectedActions,
                                        action.id,
                                      ]);
                                    } else {
                                      setSelectedActions(
                                        selectedActions.filter(
                                          (id) => id !== action.id
                                        )
                                      );
                                    }
                                  }}
                                  className="rounded border-gray-300"
                                />
                              </TableCell>
                              <TableCell>
                                {getActionName(action.actionType)}
                              </TableCell>
                              <TableCell>
                                {action.projectName || "Global"}
                              </TableCell>
                              <TableCell>
                                {formatDate(action.createdAt)}
                              </TableCell>
                              <TableCell className="text-right">
                                ${action.rate.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="text-center py-4"
                            >
                              No hay acciones pendientes para este usuario.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPaymentDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    registerPaymentMutation.isPending ||
                    selectedActions.length === 0
                  }
                  className="gap-1"
                >
                  <CreditCard className="h-4 w-4" />
                  {registerPaymentMutation.isPending
                    ? "Procesando..."
                    : "Registrar Pago"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Diálogo para ver detalles de un pago */}
      <Dialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalles del Pago</DialogTitle>
            <DialogDescription>
              Información detallada del pago a {selectedPayment?.fullName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium">Usuario</h4>
                <p>
                  {selectedPayment?.fullName} (@{selectedPayment?.username})
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium">Fecha de Pago</h4>
                <p>
                  {selectedPayment &&
                    formatDate(selectedPayment.paymentDate)}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium">Monto</h4>
                <p className="text-lg font-bold text-primary">
                  ${selectedPayment?.amount.toFixed(2)}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium">Referencia</h4>
                <p>{selectedPayment?.reference || "-"}</p>
              </div>
            </div>

            {selectedPayment?.notes && (
              <div>
                <h4 className="text-sm font-medium">Notas</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedPayment.notes}
                </p>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium mb-2">Acciones Pagadas</h4>
              <div className="max-h-[200px] overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Acción</TableHead>
                      <TableHead>Proyecto</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Tarifa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentUserActions && currentUserActions.length > 0 ? (
                      currentUserActions.map((action) => (
                        <TableRow key={action.id}>
                          <TableCell>
                            {getActionName(action.actionType)}
                          </TableCell>
                          <TableCell>
                            {action.projectName || "Global"}
                          </TableCell>
                          <TableCell>{formatDate(action.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            ${action.rate.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4">
                          No hay acciones registradas para este pago.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setIsDetailsDialogOpen(false)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}