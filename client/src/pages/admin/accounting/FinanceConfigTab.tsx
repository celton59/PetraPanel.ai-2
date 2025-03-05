import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

// Interfaces
interface CompanyInfo {
  name: string;
  taxId: string;
  address: string;
  email: string;
  phone: string;
  fiscalYear: string;
  currency: string;
}

interface TaxConfig {
  vatEnabled: boolean;
  vatRate: number;
  incomeTaxEnabled: boolean;
  incomeTaxRate: number;
  hasTaxExempt: boolean;
}

interface PaymentConfig {
  paymentPeriods: "weekly" | "biweekly" | "monthly";
  defaultPaymentMethod: string;
  requireInvoice: boolean;
  automaticPayments: boolean;
  paymentTerms: number;
}

// Datos de ejemplo
const demoCompanyInfo: CompanyInfo = {
  name: "PetraPanel Studios",
  taxId: "B-12345678",
  address: "Calle Principal 123, Ciudad, País",
  email: "finance@petrapanel.com",
  phone: "+34 612 345 678",
  fiscalYear: "calendar",
  currency: "usd",
};

const demoTaxConfig: TaxConfig = {
  vatEnabled: true,
  vatRate: 21,
  incomeTaxEnabled: true,
  incomeTaxRate: 15,
  hasTaxExempt: false,
};

const demoPaymentConfig: PaymentConfig = {
  paymentPeriods: "monthly",
  defaultPaymentMethod: "bank_transfer",
  requireInvoice: true,
  automaticPayments: false,
  paymentTerms: 30,
};

// Esquemas de validación
const companyInfoSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  taxId: z.string().min(1, "El ID fiscal es obligatorio"),
  address: z.string().min(1, "La dirección es obligatoria"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(1, "El teléfono es obligatorio"),
  fiscalYear: z.string(),
  currency: z.string(),
});

const taxConfigSchema = z.object({
  vatEnabled: z.boolean(),
  vatRate: z.number().min(0).max(100),
  incomeTaxEnabled: z.boolean(),
  incomeTaxRate: z.number().min(0).max(100),
  hasTaxExempt: z.boolean(),
});

const paymentConfigSchema = z.object({
  paymentPeriods: z.enum(["weekly", "biweekly", "monthly"]),
  defaultPaymentMethod: z.string(),
  requireInvoice: z.boolean(),
  automaticPayments: z.boolean(),
  paymentTerms: z.number().min(0),
});

type CompanyInfoValues = z.infer<typeof companyInfoSchema>;
type TaxConfigValues = z.infer<typeof taxConfigSchema>;
type PaymentConfigValues = z.infer<typeof paymentConfigSchema>;

export function FinanceConfigTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("company");
  
  // Formularios
  const companyForm = useForm<CompanyInfoValues>({
    resolver: zodResolver(companyInfoSchema),
    defaultValues: demoCompanyInfo,
  });
  
  const taxForm = useForm<TaxConfigValues>({
    resolver: zodResolver(taxConfigSchema),
    defaultValues: demoTaxConfig,
  });
  
  const paymentForm = useForm<PaymentConfigValues>({
    resolver: zodResolver(paymentConfigSchema),
    defaultValues: demoPaymentConfig,
  });

  // Simulación de consultas
  const { data: companyInfo, isLoading: isLoadingCompany } = useQuery<CompanyInfo>({
    queryKey: ["finance-config", "company"],
    queryFn: async () => {
      // En una implementación real:
      // const response = await axios.get("/api/finance/config/company");
      // return response.data;
      
      return Promise.resolve(demoCompanyInfo);
    },
  });

  const { data: taxConfig, isLoading: isLoadingTax } = useQuery<TaxConfig>({
    queryKey: ["finance-config", "tax"],
    queryFn: async () => {
      // En una implementación real:
      // const response = await axios.get("/api/finance/config/tax");
      // return response.data;
      
      return Promise.resolve(demoTaxConfig);
    },
  });

  const { data: paymentConfig, isLoading: isLoadingPayment } = useQuery<PaymentConfig>({
    queryKey: ["finance-config", "payment"],
    queryFn: async () => {
      // En una implementación real:
      // const response = await axios.get("/api/finance/config/payment");
      // return response.data;
      
      return Promise.resolve(demoPaymentConfig);
    },
  });

  // Simulación de mutaciones
  const updateCompanyMutation = useMutation({
    mutationFn: async (data: CompanyInfoValues) => {
      // En una implementación real:
      // return await axios.put("/api/finance/config/company", data);
      
      return Promise.resolve({ success: true });
    },
    onSuccess: () => {
      toast({
        title: "Configuración guardada",
        description: "La información de la empresa ha sido actualizada.",
      });
      // queryClient.invalidateQueries({ queryKey: ["finance-config", "company"] });
    },
  });

  const updateTaxMutation = useMutation({
    mutationFn: async (data: TaxConfigValues) => {
      // En una implementación real:
      // return await axios.put("/api/finance/config/tax", data);
      
      return Promise.resolve({ success: true });
    },
    onSuccess: () => {
      toast({
        title: "Configuración guardada",
        description: "La configuración fiscal ha sido actualizada.",
      });
      // queryClient.invalidateQueries({ queryKey: ["finance-config", "tax"] });
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async (data: PaymentConfigValues) => {
      // En una implementación real:
      // return await axios.put("/api/finance/config/payment", data);
      
      return Promise.resolve({ success: true });
    },
    onSuccess: () => {
      toast({
        title: "Configuración guardada",
        description: "La configuración de pagos ha sido actualizada.",
      });
      // queryClient.invalidateQueries({ queryKey: ["finance-config", "payment"] });
    },
  });

  // Manejadores de envío
  const onCompanySubmit = (data: CompanyInfoValues) => {
    updateCompanyMutation.mutate(data);
  };

  const onTaxSubmit = (data: TaxConfigValues) => {
    updateTaxMutation.mutate(data);
  };

  const onPaymentSubmit = (data: PaymentConfigValues) => {
    updatePaymentMutation.mutate(data);
  };

  // Cargar datos en los formularios cuando estén disponibles
  // En un entorno real, se usarían useEffect para actualizar los valores de los formularios
  // cuando los datos estén disponibles

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Configuración Financiera</h3>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="company">Información Empresa</TabsTrigger>
          <TabsTrigger value="tax">Configuración Fiscal</TabsTrigger>
          <TabsTrigger value="payment">Configuración de Pagos</TabsTrigger>
        </TabsList>

        {/* Información de la empresa */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Información de la Empresa</CardTitle>
              <CardDescription>
                Configure la información fiscal y de contacto de su empresa.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...companyForm}>
                <form
                  onSubmit={companyForm.handleSubmit(onCompanySubmit)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={companyForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre de la Empresa</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            Nombre oficial de la empresa para documentos fiscales.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={companyForm.control}
                      name="taxId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ID Fiscal / CIF</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            Número de identificación fiscal de la empresa.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={companyForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dirección</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            Dirección fiscal de la empresa.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={companyForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email de Contacto</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" />
                          </FormControl>
                          <FormDescription>
                            Email para comunicaciones financieras.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={companyForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            Teléfono de contacto para asuntos financieros.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={companyForm.control}
                      name="fiscalYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Año Fiscal</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione tipo de año fiscal" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="calendar">Año Calendario (Ene-Dic)</SelectItem>
                              <SelectItem value="custom">Año Fiscal Personalizado</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Período para contabilidad y declaraciones fiscales.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={companyForm.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Moneda Principal</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione moneda" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="usd">Dólar Estadounidense (USD)</SelectItem>
                              <SelectItem value="eur">Euro (EUR)</SelectItem>
                              <SelectItem value="gbp">Libra Esterlina (GBP)</SelectItem>
                              <SelectItem value="jpy">Yen Japonés (JPY)</SelectItem>
                              <SelectItem value="cad">Dólar Canadiense (CAD)</SelectItem>
                              <SelectItem value="aud">Dólar Australiano (AUD)</SelectItem>
                              <SelectItem value="chf">Franco Suizo (CHF)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Moneda utilizada para todos los cálculos financieros.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={updateCompanyMutation.isPending}
                    >
                      {updateCompanyMutation.isPending
                        ? "Guardando..."
                        : "Guardar Cambios"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuración Fiscal */}
        <TabsContent value="tax">
          <Card>
            <CardHeader>
              <CardTitle>Configuración Fiscal</CardTitle>
              <CardDescription>
                Configure los impuestos y otras obligaciones fiscales.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...taxForm}>
                <form
                  onSubmit={taxForm.handleSubmit(onTaxSubmit)}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-muted/50 p-4 rounded-md">
                      <div>
                        <h4 className="font-medium">IVA / VAT</h4>
                        <p className="text-sm text-muted-foreground">
                          Activar el cálculo de IVA en pagos y facturas
                        </p>
                      </div>
                      <FormField
                        control={taxForm.control}
                        name="vatEnabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={taxForm.control}
                      name="vatRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tasa de IVA (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              disabled={!taxForm.watch("vatEnabled")}
                            />
                          </FormControl>
                          <FormDescription>
                            Porcentaje de IVA aplicado en facturas.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center justify-between bg-muted/50 p-4 rounded-md mt-4">
                      <div>
                        <h4 className="font-medium">Retención de IRPF</h4>
                        <p className="text-sm text-muted-foreground">
                          Aplicar retención de IRPF en pagos
                        </p>
                      </div>
                      <FormField
                        control={taxForm.control}
                        name="incomeTaxEnabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={taxForm.control}
                      name="incomeTaxRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tasa de Retención IRPF (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              disabled={!taxForm.watch("incomeTaxEnabled")}
                            />
                          </FormControl>
                          <FormDescription>
                            Porcentaje de IRPF a retener en pagos.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center justify-between bg-muted/50 p-4 rounded-md mt-4">
                      <div>
                        <h4 className="font-medium">Exenciones Fiscales</h4>
                        <p className="text-sm text-muted-foreground">
                          Permitir exenciones fiscales para ciertos colaboradores
                        </p>
                      </div>
                      <FormField
                        control={taxForm.control}
                        name="hasTaxExempt"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={updateTaxMutation.isPending}
                    >
                      {updateTaxMutation.isPending
                        ? "Guardando..."
                        : "Guardar Cambios"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuración de Pagos */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Pagos</CardTitle>
              <CardDescription>
                Configure los períodos y métodos de pago para los colaboradores.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...paymentForm}>
                <form
                  onSubmit={paymentForm.handleSubmit(onPaymentSubmit)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={paymentForm.control}
                      name="paymentPeriods"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Período de Pagos</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione período" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="weekly">Semanal</SelectItem>
                              <SelectItem value="biweekly">Quincenal</SelectItem>
                              <SelectItem value="monthly">Mensual</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Frecuencia con la que se procesan los pagos.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={paymentForm.control}
                      name="defaultPaymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Método de Pago Predeterminado</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione método" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="bank_transfer">Transferencia Bancaria</SelectItem>
                              <SelectItem value="paypal">PayPal</SelectItem>
                              <SelectItem value="stripe">Stripe</SelectItem>
                              <SelectItem value="check">Cheque</SelectItem>
                              <SelectItem value="cash">Efectivo</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Método predeterminado para realizar pagos.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={paymentForm.control}
                      name="paymentTerms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Plazo de Pago (días)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Días para procesar el pago tras aprobación.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4 mt-4">
                    <div className="flex items-center justify-between bg-muted/50 p-4 rounded-md">
                      <div>
                        <h4 className="font-medium">Requerir Factura</h4>
                        <p className="text-sm text-muted-foreground">
                          Exigir factura para procesar pagos
                        </p>
                      </div>
                      <FormField
                        control={paymentForm.control}
                        name="requireInvoice"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex items-center justify-between bg-muted/50 p-4 rounded-md">
                      <div>
                        <h4 className="font-medium">Pagos Automáticos</h4>
                        <p className="text-sm text-muted-foreground">
                          Procesar pagos automáticamente al finalizar el período
                        </p>
                      </div>
                      <FormField
                        control={paymentForm.control}
                        name="automaticPayments"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={updatePaymentMutation.isPending}
                    >
                      {updatePaymentMutation.isPending
                        ? "Guardando..."
                        : "Guardar Cambios"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}