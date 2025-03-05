import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Activity, Clock, FileVideo, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getStatusBadgeColor } from '@/lib/status-labels';

interface ActivityItem {
  id: number;
  type: 'video' | 'project' | 'login' | 'notification' | 'settings';
  title: string;
  description: string;
  timestamp: Date;
  entity?: {
    id: number;
    title?: string;
    status?: string;
    url?: string;
  };
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // En una implementación real, obtendríamos la actividad del usuario desde la API
    // Por ahora usaremos datos de ejemplo
    
    const mockActivities: ActivityItem[] = [
      {
        id: 1,
        type: 'login',
        title: 'Inicio de sesión',
        description: 'Has iniciado sesión en el sistema',
        timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutos atrás
      },
      {
        id: 2,
        type: 'video',
        title: 'Actualización de video',
        description: 'Has cambiado el estado del video "Introducción a la IA"',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 horas atrás
        entity: {
          id: 1,
          title: 'Introducción a la IA',
          status: 'completed',
          url: '/videos/1',
        },
      },
      {
        id: 3,
        type: 'project',
        title: 'Nuevo proyecto',
        description: 'Has sido asignado al proyecto "Campaña Q4"',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 día atrás
        entity: {
          id: 1,
          title: 'Campaña Q4',
          url: '/proyectos/1',
        },
      },
      {
        id: 4,
        type: 'notification',
        title: 'Nueva notificación',
        description: 'Has recibido una mención en un comentario',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36), // 1.5 días atrás
      },
      {
        id: 5,
        type: 'video',
        title: 'Revisión de contenido',
        description: 'Has completado la revisión del video "Tutoriales avanzados"',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 días atrás
        entity: {
          id: 2,
          title: 'Tutoriales avanzados',
          status: 'content_review',
          url: '/videos/2',
        },
      },
      {
        id: 6, 
        type: 'settings',
        title: 'Configuración actualizada',
        description: 'Has actualizado tus preferencias de notificaciones',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72), // 3 días atrás
      },
    ];
    
    setActivities(mockActivities);
    setLoading(false);
  }, []);

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'video':
        return <FileVideo className="h-4 w-4" />;
      case 'project':
        return <Calendar className="h-4 w-4" />;
      case 'login':
        return <Activity className="h-4 w-4" />;
      case 'notification':
        return <Activity className="h-4 w-4" />;
      case 'settings':
        return <Activity className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const renderActivityItem = (activity: ActivityItem) => (
    <div 
      key={activity.id} 
      className="flex gap-4 py-3 border-b last:border-0 border-border"
    >
      <div className="mt-1">
        <div className="bg-muted rounded-full p-2">
          {getActivityIcon(activity.type)}
        </div>
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex justify-between items-center">
          <p className="text-sm font-medium">{activity.title}</p>
          <p className="text-xs text-muted-foreground">
            {formatDate(activity.timestamp, false)}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {activity.description}
        </p>
        {activity.entity && (
          <div className="flex items-center gap-2 mt-1">
            {activity.type === 'video' && activity.entity.status && (
              <Badge variant="outline" className={getStatusBadgeColor(activity.entity.status as any)}>
                {activity.entity.status}
              </Badge>
            )}
            {activity.entity.title && (
              <Badge variant="secondary" className="font-normal">
                {activity.entity.title}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const recentActivities = activities.slice(0, 3);
  const olderActivities = activities.slice(3);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Activity className="h-5 w-5" /> 
          <span>Actividad reciente</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="projects">Proyectos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-1">
                {activities.map(renderActivityItem)}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="videos">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-1">
                {activities
                  .filter(activity => activity.type === 'video')
                  .map(renderActivityItem)}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="projects">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-1">
                {activities
                  .filter(activity => activity.type === 'project')
                  .map(renderActivityItem)}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}