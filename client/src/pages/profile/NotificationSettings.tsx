import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/use-user';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BellRing, Mail, BellOff, MessageSquare, Calendar, AlertTriangle, Info } from 'lucide-react';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  key: string;
  icon: React.ReactNode;
}

export default function NotificationSettings() {
  const { user } = useUser();
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    emailEnabled: true,
    pushEnabled: true,
    inAppEnabled: true,
    contentChangesEnabled: true,
    assignmentsEnabled: true,
    mentionsEnabled: true,
    statusChangesEnabled: true,
    systemMessagesEnabled: true
  });
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Importamos el cliente axios seguro
        const api = (await import('@/lib/axios')).default;
        
        // Utilizamos el cliente axios con manejo de CSRF
        const response = await api.get('/api/notifications/settings');
        const data = response.data;
        
        if (data.success && data.data) {
          setSettings({
            emailEnabled: data.data.emailEnabled || false,
            pushEnabled: data.data.pushEnabled || false,
            inAppEnabled: data.data.inAppEnabled || false,
            contentChangesEnabled: data.data.contentChangesEnabled || false,
            assignmentsEnabled: data.data.assignmentsEnabled || false,
            mentionsEnabled: data.data.mentionsEnabled || false,
            statusChangesEnabled: data.data.statusChangesEnabled || false,
            systemMessagesEnabled: data.data.systemMessagesEnabled || false
          });
          setInitialized(true);
        }
      } catch (error) {
        console.error('Error al cargar configuración de notificaciones:', error);
      }
    };

    if (user) {
      fetchSettings();
    }
  }, [user]);

  const updateSettings = async () => {
    if (!initialized) return;
    
    setLoading(true);
    try {
      // Importamos api y refreshCSRFToken de nuestro archivo axios mejorado
      const { refreshCSRFToken } = await import('@/lib/axios');
      const api = (await import('@/lib/axios')).default;
      
      // Refrescar proactivamente el token CSRF antes de una operación importante
      await refreshCSRFToken();
      
      // Usar nuestra instancia de axios configurada con manejo CSRF
      const response = await api.post('/api/notifications/settings', settings);

      toast({
        title: 'Configuración actualizada',
        description: 'La configuración de notificaciones se ha actualizado correctamente',
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Ha ocurrido un error al actualizar la configuración',
        variant: 'destructive'
      });
      console.error('Error al actualizar configuración:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const channelSettings: NotificationSetting[] = [
    {
      id: 'email',
      title: 'Correo electrónico',
      description: 'Recibe notificaciones por correo electrónico',
      key: 'emailEnabled',
      icon: <Mail className="h-4 w-4" />
    },
    {
      id: 'push',
      title: 'Notificaciones push',
      description: 'Recibe notificaciones en tu navegador',
      key: 'pushEnabled',
      icon: <BellRing className="h-4 w-4" />
    },
    {
      id: 'inApp',
      title: 'En la aplicación',
      description: 'Recibe notificaciones dentro de la aplicación',
      key: 'inAppEnabled',
      icon: <MessageSquare className="h-4 w-4" />
    }
  ];

  const eventSettings: NotificationSetting[] = [
    {
      id: 'contentChanges',
      title: 'Cambios de contenido',
      description: 'Cuando se realizan cambios en el contenido',
      key: 'contentChangesEnabled',
      icon: <Info className="h-4 w-4" />
    },
    {
      id: 'assignments',
      title: 'Asignaciones',
      description: 'Cuando te asignan a un proyecto o tarea',
      key: 'assignmentsEnabled',
      icon: <Calendar className="h-4 w-4" />
    },
    {
      id: 'mentions',
      title: 'Menciones',
      description: 'Cuando te mencionan en comentarios',
      key: 'mentionsEnabled',
      icon: <MessageSquare className="h-4 w-4" />
    },
    {
      id: 'statusChanges',
      title: 'Cambios de estado',
      description: 'Cuando cambia el estado de un proyecto o tarea',
      key: 'statusChangesEnabled',
      icon: <AlertTriangle className="h-4 w-4" />
    },
    {
      id: 'systemMessages',
      title: 'Mensajes del sistema',
      description: 'Notificaciones importantes del sistema',
      key: 'systemMessagesEnabled',
      icon: <BellRing className="h-4 w-4" />
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferencias de notificaciones</CardTitle>
        <CardDescription>
          Configura cómo y cuándo quieres recibir notificaciones
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="channels">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="channels">Canales de notificación</TabsTrigger>
            <TabsTrigger value="events">Tipos de eventos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="channels" className="space-y-4 mt-4">
            <div className="space-y-4">
              {channelSettings.map((setting) => (
                <div key={setting.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-primary/10 p-2 rounded-full">
                      {setting.icon}
                    </div>
                    <div>
                      <Label 
                        htmlFor={setting.id}
                        className="text-base font-medium"
                      >
                        {setting.title}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {setting.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id={setting.id}
                    checked={settings[setting.key as keyof typeof settings]}
                    onCheckedChange={() => handleToggle(setting.key as keyof typeof settings)}
                  />
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="events" className="space-y-4 mt-4">
            <div className="space-y-4">
              {eventSettings.map((setting) => (
                <div key={setting.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-primary/10 p-2 rounded-full">
                      {setting.icon}
                    </div>
                    <div>
                      <Label 
                        htmlFor={setting.id}
                        className="text-base font-medium"
                      >
                        {setting.title}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {setting.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id={setting.id}
                    checked={settings[setting.key as keyof typeof settings]}
                    onCheckedChange={() => handleToggle(setting.key as keyof typeof settings)}
                  />
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        
        <Separator className="my-6" />
        
        <div className="flex justify-end">
          <Button 
            disabled={loading} 
            onClick={updateSettings}
          >
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}