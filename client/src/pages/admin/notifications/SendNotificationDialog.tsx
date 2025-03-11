import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Bell, UserCheck, Users, BellRing } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';

interface SendNotificationDialogProps {
  children?: React.ReactNode;
}

export function SendNotificationDialog({ children }: SendNotificationDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [target, setTarget] = useState<'all' | 'role' | 'user'>('all');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'success' | 'warning' | 'error' | 'system'>('info');
  const [actionUrl, setActionUrl] = useState('');
  const [actionLabel, setActionLabel] = useState('');
  
  const { toast } = useToast();
  const { users } = useUsers();

  const handleSubmit = async () => {
    if (!title || !message) {
      toast({
        title: 'Faltan campos',
        description: 'El título y el mensaje son obligatorios',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let response;

      if (target === 'all') {
        // Enviar a todos los usuarios con rol 'admin'
        response = await fetch('/api/notifications/role/all', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title,
            message,
            type,
            actionUrl: actionUrl || undefined,
            actionLabel: actionLabel || undefined
          })
        });
      } else if (target === 'role' && selectedRole) {
        // Enviar a usuarios con un rol específico
        response = await fetch(`/api/notifications/role/${selectedRole}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title,
            message,
            type,
            actionUrl: actionUrl || undefined,
            actionLabel: actionLabel || undefined
          })
        });
      } else if (target === 'user' && selectedUser) {
        // Enviar a un usuario específico
        response = await fetch('/api/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: selectedUser,
            title,
            message,
            type,
            actionUrl: actionUrl || undefined,
            actionLabel: actionLabel || undefined
          })
        });
      } else {
        throw new Error('Selección de destinatario inválida');
      }

      if (!response.ok) {
        throw new Error('Error al enviar notificación');
      }

      toast({
        title: 'Notificación enviada',
        description: 'La notificación se ha enviado correctamente',
        variant: 'default'
      });

      // Restablecer formulario y cerrar diálogo
      setTitle('');
      setMessage('');
      setType('info');
      setActionUrl('');
      setActionLabel('');
      setOpen(false);
    } catch (error) {
      console.error('Error al enviar notificación:', error);
      toast({
        title: 'Error',
        description: 'Ha ocurrido un error al enviar la notificación',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="gap-2">
            <Bell className="h-4 w-4" />
            <span>Enviar notificación</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar notificación</DialogTitle>
          <DialogDescription>
            Crea y envía una notificación a los usuarios de la plataforma
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="notification-target">Destinatarios</Label>
            <Select value={target} onValueChange={(value: 'all' | 'role' | 'user') => setTarget(value)}>
              <SelectTrigger id="notification-target">
                <SelectValue placeholder="Selecciona destinatarios" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Todos los usuarios</span>
                  </div>
                </SelectItem>
                <SelectItem value="role">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    <span>Por rol</span>
                  </div>
                </SelectItem>
                <SelectItem value="user">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    <span>Usuario específico</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {target === 'role' && (
            <div className="space-y-2">
              <Label htmlFor="role-select">Seleccionar rol</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger id="role-select">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="content_reviewer">Revisor de contenido</SelectItem>
                  <SelectItem value="media_reviewer">Revisor de media</SelectItem>
                  <SelectItem value="optimizer">Optimizador</SelectItem>
                  <SelectItem value="youtuber">Youtuber</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {target === 'user' && (
            <div className="space-y-2">
              <Label htmlFor="user-select">Seleccionar usuario</Label>
              <Select 
                value={selectedUser?.toString() || ''} 
                onValueChange={(value) => setSelectedUser(parseInt(value))}
              >
                <SelectTrigger id="user-select">
                  <SelectValue placeholder="Selecciona un usuario" />
                </SelectTrigger>
                <SelectContent>
                  {users?.map(user => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.fullName || user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notification-type">Tipo de notificación</Label>
            <Select 
              value={type} 
              onValueChange={(value: 'info' | 'success' | 'warning' | 'error' | 'system') => setType(value)}
            >
              <SelectTrigger id="notification-type">
                <SelectValue placeholder="Selecciona tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Información</SelectItem>
                <SelectItem value="success">Éxito</SelectItem>
                <SelectItem value="warning">Advertencia</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notification-title">Título</Label>
            <Input
              id="notification-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título de la notificación"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notification-message">Mensaje</Label>
            <Textarea
              id="notification-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Mensaje de la notificación"
              required
              className="resize-none"
              rows={3}
            />
          </div>

          <div className="space-y-4 pt-2">
            <div className="text-sm font-medium">Acción (opcional)</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="action-url">URL de acción</Label>
                <Input
                  id="action-url"
                  value={actionUrl}
                  onChange={(e) => setActionUrl(e.target.value)}
                  placeholder="/ruta/ejemplo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="action-label">Etiqueta</Label>
                <Input
                  id="action-label"
                  value={actionLabel}
                  onChange={(e) => setActionLabel(e.target.value)}
                  placeholder="Ver detalles"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && (
              <BellRing className="mr-2 h-4 w-4 animate-spin" />
            )}
            Enviar notificación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}