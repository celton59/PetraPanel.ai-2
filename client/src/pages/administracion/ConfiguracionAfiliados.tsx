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
import { Plus, Edit, Trash2, X, Check, Save, PlusCircle, Upload, FileText, AlertCircle } from 'lucide-react';
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
            <Button onClick={handleCreateCompany}>
              <Plus className="mr-2 h-4 w-4" /> Añadir Empresa
            </Button>
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
    </div>
  );
}