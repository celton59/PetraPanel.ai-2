import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { useToast } from '@/hooks/use-toast';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, X, Check, Save, PlusCircle, Upload, FileText, AlertCircle, Search } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface AffiliateCompany {
  id: number;
  name: string;
  description: string | null;
  logo_url: string | null;
  affiliate_url: string;
  keywords: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface FormData {
  name: string;
  description: string;
  logo_url: string;
  affiliate_url: string;
  keywords: string;
  active: boolean;
}

export default function ConfiguracionAfiliados() {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<AffiliateCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [currentCompanyId, setCurrentCompanyId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    logo_url: '',
    affiliate_url: '',
    keywords: '',
    active: true
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<AffiliateCompany | null>(null);
  
  // Estados para la importación masiva
  const [bulkImportDialogOpen, setBulkImportDialogOpen] = useState(false);
  const [bulkNames, setBulkNames] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/affiliates/companies');
      setCompanies(response.data);
    } catch (error) {
      console.error('Error al cargar empresas afiliadas:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar las empresas afiliadas'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = () => {
    setDialogMode('create');
    setFormData({
      name: '',
      description: '',
      logo_url: '',
      affiliate_url: '',
      keywords: '',
      active: true
    });
    setOpenDialog(true);
  };

  const handleEditCompany = (company: AffiliateCompany) => {
    setDialogMode('edit');
    setCurrentCompanyId(company.id);
    setFormData({
      name: company.name,
      description: company.description || '',
      logo_url: company.logo_url || '',
      affiliate_url: company.affiliate_url,
      keywords: company.keywords.join(', '),
      active: company.active
    });
    setOpenDialog(true);
  };

  const handleDeleteClick = (company: AffiliateCompany) => {
    setCompanyToDelete(company);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!companyToDelete) return;
    
    try {
      await axios.delete(`/api/affiliates/companies/${companyToDelete.id}`);
      
      toast({
        title: 'Éxito',
        description: `Empresa afiliada ${companyToDelete.name} eliminada correctamente`,
      });
      
      // Actualizar lista
      fetchCompanies();
    } catch (error) {
      console.error('Error al eliminar empresa:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo eliminar la empresa afiliada'
      });
    } finally {
      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      active: checked
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Convertir keywords de string a array
      const keywordsArray = formData.keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);
      
      const payload = {
        name: formData.name,
        description: formData.description || null,
        logo_url: formData.logo_url || null,
        affiliate_url: formData.affiliate_url,
        keywords: keywordsArray,
        active: formData.active
      };
      
      if (dialogMode === 'create') {
        await axios.post('/api/affiliates/companies', payload);
        toast({
          title: 'Éxito',
          description: 'Empresa afiliada creada correctamente',
        });
      } else {
        await axios.put(`/api/affiliates/companies/${currentCompanyId}`, payload);
        toast({
          title: 'Éxito',
          description: 'Empresa afiliada actualizada correctamente',
        });
      }
      
      // Cerrar diálogo y actualizar lista
      setOpenDialog(false);
      fetchCompanies();
    } catch (error: any) {
      console.error('Error al guardar empresa:', error);
      
      // Mostrar mensaje de error específico si está disponible
      const errorMessage = error.response?.data?.error || 'No se pudo guardar la empresa afiliada';
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage
      });
    }
  };
  
  // Abrir el diálogo de importación masiva
  const handleOpenBulkImport = () => {
    setBulkNames('');
    setBulkImportDialogOpen(true);
  };
  
  // Función para importar empresas en masa
  const handleBulkImport = async () => {
    if (bulkLoading) return;
    
    try {
      setBulkLoading(true);
      
      // Procesar los nombres de empresas
      const names = bulkNames
        .split('\n')
        .map(name => name.trim())
        .filter(name => name.length > 0);
      
      if (names.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No se encontraron nombres válidos de empresas'
        });
        return;
      }
      
      // Enviar la solicitud al servidor
      const response = await axios.post('/api/affiliates/companies/bulk', {
        names
      });
      
      // Manejar la respuesta
      if (response.data.success) {
        toast({
          title: 'Éxito',
          description: response.data.message,
        });
        
        // Si hay empresas que fueron omitidas por duplicación, mostrar advertencia
        if (response.data.skippedCount > 0) {
          toast({
            title: 'Advertencia',
            description: `${response.data.skippedCount} empresas omitidas por estar duplicadas`,
          });
        }
        
        // Cerrar diálogo y actualizar lista
        setBulkImportDialogOpen(false);
        fetchCompanies();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: response.data.message || 'Error al crear empresas en masa'
        });
      }
    } catch (error: any) {
      console.error('Error al importar empresas en masa:', error);
      
      // Mostrar mensaje de error específico si está disponible
      const errorMessage = error.response?.data?.error || 'Error al crear empresas en masa';
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage
      });
    } finally {
      setBulkLoading(false);
    }
  };
  
  // Función para manejar la importación desde archivo
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      
      if (file.name.endsWith('.csv')) {
        // Si es un CSV, procesar como tal
        const lines = content.split(/\r?\n/).filter(line => line.trim());
        if (lines.length === 1 && lines[0].includes(',')) {
          // Si hay una sola línea con comas, asumimos que es un CSV de una línea
          const names = lines[0].split(',').map(name => name.trim()).filter(Boolean);
          setBulkNames(names.join('\n'));
        } else {
          // Múltiples líneas
          setBulkNames(lines.join('\n'));
        }
      } else {
        // Si es un TXT u otro formato de texto, usamos como está
        setBulkNames(content);
      }
      
      toast({
        title: 'Archivo importado',
        description: 'Los nombres se han cargado correctamente',
      });
      
      // Limpiar el input file
      event.target.value = '';
    };
    
    reader.onerror = () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo leer el archivo'
      });
    };
    
    reader.readAsText(file);
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Configuración de Afiliados</CardTitle>
              <CardDescription>
                Gestiona las empresas afiliadas y sus enlaces para incluir en videos
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  // Mostrar un indicador de carga
                  toast({
                    title: 'Escaneando...',
                    description: 'Buscando menciones de afiliados en todos los videos',
                  });
                  
                  // Llamar al endpoint para escanear videos
                  axios.post('/api/affiliates/scan-all-videos')
                    .then(response => {
                      toast({
                        title: 'Escaneo completado',
                        description: response.data.message,
                      });
                    })
                    .catch(error => {
                      console.error('Error al escanear videos:', error);
                      toast({
                        variant: 'destructive',
                        title: 'Error',
                        description: error.response?.data?.error || 'No se pudieron escanear los videos'
                      });
                    });
                }} 
                variant="outline" 
                className="bg-blue-50 text-blue-600 hover:bg-blue-100"
              >
                <Search className="mr-2 h-4 w-4" /> Escanear Videos
              </Button>
              <Button 
                onClick={() => {
                  if (window.confirm('¿Estás seguro de que deseas eliminar TODAS las empresas afiliadas? Esta acción no se puede deshacer.')) {
                    axios.delete('/api/affiliates/companies')
                      .then(response => {
                        toast({
                          title: 'Éxito',
                          description: `${response.data.deletedCount} empresas afiliadas eliminadas correctamente`,
                        });
                        fetchCompanies();
                      })
                      .catch(error => {
                        console.error('Error al eliminar todas las empresas:', error);
                        toast({
                          variant: 'destructive',
                          title: 'Error',
                          description: error.response?.data?.error || 'No se pudieron eliminar las empresas'
                        });
                      });
                  }
                }} 
                variant="outline" 
                className="bg-red-50 text-red-600 hover:bg-red-100"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Eliminar Todas
              </Button>
              <Button onClick={handleOpenBulkImport} variant="outline">
                <Upload className="mr-2 h-4 w-4" /> Importar en Masa
              </Button>
              <Button onClick={handleCreateCompany}>
                <Plus className="mr-2 h-4 w-4" /> Añadir Empresa
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No hay empresas afiliadas configuradas</p>
              <Button onClick={handleCreateCompany}>
                <PlusCircle className="mr-2 h-4 w-4" /> Crear Primera Empresa
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>URL de Afiliado</TableHead>
                  <TableHead>Palabras Clave</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      <a 
                        href={company.affiliate_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {company.affiliate_url}
                      </a>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {company.keywords.length > 0 ? (
                          company.keywords.map((keyword, idx) => (
                            <Badge key={idx} variant="outline">{keyword}</Badge>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">Sin palabras clave</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={company.active ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-800 border-gray-200"}>
                        {company.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditCompany(company)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-red-600"
                          onClick={() => handleDeleteClick(company)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog para crear/editar empresa */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' ? 'Añadir Nueva Empresa Afiliada' : 'Editar Empresa Afiliada'}
            </DialogTitle>
            <DialogDescription>
              Completa los detalles de la empresa afiliada. Las palabras clave se utilizarán para detectar menciones en los títulos de videos.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nombre
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="Amazon, Aliexpress, etc."
                  className="col-span-3"
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Descripción
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Descripción breve de la empresa"
                  className="col-span-3"
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="logo_url" className="text-right">
                  URL del Logo
                </Label>
                <Input
                  id="logo_url"
                  name="logo_url"
                  value={formData.logo_url}
                  onChange={handleFormChange}
                  placeholder="https://ejemplo.com/logo.png"
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="affiliate_url" className="text-right">
                  URL de Afiliado
                </Label>
                <Input
                  id="affiliate_url"
                  name="affiliate_url"
                  value={formData.affiliate_url}
                  onChange={handleFormChange}
                  placeholder="https://www.amazon.es/?tag=miafiliado-21"
                  className="col-span-3"
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="keywords" className="text-right">
                  Palabras Clave
                </Label>
                <Textarea
                  id="keywords"
                  name="keywords"
                  value={formData.keywords}
                  onChange={handleFormChange}
                  placeholder="palabra1, palabra2, palabra3"
                  className="col-span-3"
                  rows={2}
                />
                <div className="col-span-3 col-start-2">
                  <p className="text-sm text-gray-500">
                    Separa las palabras clave con comas. Estas palabras se usarán para detectar menciones además del nombre de la empresa.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="active" className="text-right">
                  Estado
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={handleSwitchChange}
                  />
                  <Label htmlFor="active" className="cursor-pointer">
                    {formData.active ? 'Activo' : 'Inactivo'}
                  </Label>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpenDialog(false)}
              >
                <X className="mr-2 h-4 w-4" /> 
                Cancelar
              </Button>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" /> 
                {dialogMode === 'create' ? 'Crear' : 'Actualizar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación para eliminar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar empresa afiliada?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la empresa afiliada 
              <span className="font-semibold"> {companyToDelete?.name}</span> y todas sus coincidencias.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Dialog de importación masiva de empresas */}
      <Dialog open={bulkImportDialogOpen} onOpenChange={setBulkImportDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Importación Masiva de Empresas
            </DialogTitle>
            <DialogDescription>
              Importa múltiples empresas afiliadas a la vez. Introduce un nombre de empresa por línea o importa desde un archivo.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="manual" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Ingreso Manual</TabsTrigger>
              <TabsTrigger value="file">Desde Archivo</TabsTrigger>
            </TabsList>
            
            <TabsContent value="manual" className="mt-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bulkNames">Nombres de Empresas</Label>
                  <Textarea
                    id="bulkNames"
                    placeholder="Amazon&#10;Aliexpress&#10;Microsoft&#10;Apple&#10;..."
                    className="mt-2"
                    rows={8}
                    value={bulkNames}
                    onChange={(e) => setBulkNames(e.target.value)}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Introduce un nombre de empresa por línea. Las empresas se crearán con una URL de afiliado genérica que podrás editar después.
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="file" className="mt-4">
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <FileText className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                  <p className="text-sm font-medium mb-2">
                    Sube un archivo TXT o CSV con los nombres de las empresas
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    Un nombre por línea o separados por comas
                  </p>
                  <Input
                    type="file"
                    accept=".txt,.csv"
                    onChange={handleFileImport}
                    className="hidden"
                    id="file-upload"
                  />
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <div className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                      <Upload className="mr-2 h-4 w-4" />
                      Seleccionar archivo
                    </div>
                  </Label>
                </div>
                
                {bulkNames && (
                  <div className="mt-4">
                    <Label htmlFor="preview">Vista previa</Label>
                    <div className="mt-2 bg-gray-50 p-3 rounded-md max-h-[200px] overflow-y-auto">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap break-all">{bulkNames}</pre>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
          
          {bulkNames && bulkNames.split('\n').filter(name => name.trim()).length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mt-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-amber-500 mr-3 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Información importante
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  Se crearán {bulkNames.split('\n').filter(name => name.trim()).length} empresas con el nombre proporcionado. 
                  Cada empresa se creará con una URL de afiliado genérica que deberás actualizar posteriormente.
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter className="mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setBulkImportDialogOpen(false)}
              disabled={bulkLoading}
            >
              <X className="mr-2 h-4 w-4" /> 
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={handleBulkImport}
              disabled={bulkLoading || !bulkNames || bulkNames.split('\n').filter(name => name.trim()).length === 0}
            >
              {bulkLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> 
                  Importar Empresas
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}