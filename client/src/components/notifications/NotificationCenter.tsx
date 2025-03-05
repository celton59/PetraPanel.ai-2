import React, { useState, useEffect } from 'react';
import { useUser } from '@/hooks/use-user';
import { 
  useNotifications, 
  useNotificationWebSocket, 
  useNotificationAPI, 
  Notification 
} from '@/hooks/use-notifications';
import { formatNotificationDate } from '@/lib/utils';
import { 
  BellIcon, 
  BellRingIcon, 
  CheckCheckIcon, 
  BookmarkIcon, 
  ArchiveIcon, 
  XIcon, 
  Settings2Icon,
  InfoIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ServerIcon
} from 'lucide-react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { getInitials } from '@/lib/utils';

const NotificationItem = ({ notification }: { notification: Notification }) => {
  const { markAsRead, toggleReadLater, removeNotification } = useNotifications();
  const { archiveNotification } = useNotificationAPI();

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'info':
        return <InfoIcon className="h-5 w-5 text-blue-500" />;
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <AlertCircleIcon className="h-5 w-5 text-red-500" />;
      case 'system':
        return <ServerIcon className="h-5 w-5 text-purple-500" />;
      default:
        return <InfoIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const handleClick = () => {
    if (!notification.read) {
      markAsRead(notification.id);
      
      // También marcamos como leído en el servidor
      const notificationId = parseInt(notification.id);
      if (!isNaN(notificationId)) {
        useNotificationAPI().markAsRead(notificationId);
      }
    }

    // Si hay URL de acción, navegar
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Remover de la UI
    removeNotification(notification.id);
    
    // Archivar en el servidor
    const notificationId = parseInt(notification.id);
    if (!isNaN(notificationId)) {
      archiveNotification(notificationId);
    }
  };

  return (
    <div 
      className={`p-3 border-b border-gray-100 dark:border-gray-800 transition-colors ${
        notification.read ? 'bg-transparent' : 'bg-blue-50 dark:bg-blue-950/30'
      } hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer relative group`}
      onClick={handleClick}
    >
      <div className="flex space-x-3">
        <div className="flex-shrink-0">
          {notification.sender?.avatar ? (
            <Avatar className="h-9 w-9">
              <AvatarImage src={notification.sender.avatar} alt={notification.sender.name} />
              <AvatarFallback>{getInitials(notification.sender.name)}</AvatarFallback>
            </Avatar>
          ) : (
            <div className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/10">
              {getNotificationIcon()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {notification.title}
            </p>
            <div className="flex space-x-1">
              <p className="text-xs text-gray-500 ml-1">
                {formatNotificationDate(notification.createdAt)}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-1">
            {notification.message}
          </p>
          {notification.actionLabel && (
            <Button variant="link" size="sm" className="p-0 h-auto text-xs font-medium">
              {notification.actionLabel}
            </Button>
          )}
        </div>
      </div>
      
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-6 w-6" 
          onClick={(e) => {
            e.stopPropagation();
            toggleReadLater(notification.id);
          }}
          title={notification.readLater ? "Quitar de leer más tarde" : "Leer más tarde"}
        >
          <BookmarkIcon className={`h-4 w-4 ${notification.readLater ? 'fill-current' : ''}`} />
        </Button>
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-6 w-6" 
          onClick={handleArchive}
          title="Archivar"
        >
          <ArchiveIcon className="h-4 w-4" />
        </Button>
      </div>
      
      {!notification.read && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
      )}
    </div>
  );
};

export const NotificationCenter = () => {
  const { notifications, unreadCount, markAllAsRead, readLaterCount } = useNotifications();
  const { connect } = useNotificationWebSocket();
  const { markAllAsRead: markAllAsReadAPI, fetchNotifications } = useNotificationAPI();
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [initialized, setInitialized] = useState(false);
  
  useEffect(() => {
    // Solo inicializar el WebSocket y cargar notificaciones cuando tenemos un usuario
    if (user && !initialized) {
      // Conectar WebSocket
      if (user.id) {
        const ws = connect(user.id);
        
        // Limpiar al desmontar
        return () => {
          ws.close();
        };
      }
      
      // Cargar notificaciones desde API
      const loadNotifications = async () => {
        const notificationsData = await fetchNotifications(true);
        
        // Aquí podríamos procesar y cargar las notificaciones en el estado global
        // Por ahora, el sistema WebSocket se encargará de esto
        
        setInitialized(true);
      };
      
      loadNotifications();
    }
  }, [user, initialized]);
  
  // Filtrar notificaciones según la pestaña activa
  const filteredNotifications = (() => {
    switch (activeTab) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'saved':
        return notifications.filter(n => n.readLater);
      default:
        return notifications;
    }
  })();
  
  const handleMarkAllAsRead = () => {
    markAllAsRead();
    markAllAsReadAPI();
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          aria-label="Notificaciones"
        >
          {unreadCount > 0 ? (
            <>
              <BellRingIcon className="h-5 w-5" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 px-1 min-w-[1.25rem] h-5 flex items-center justify-center"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            </>
          ) : (
            <BellIcon className="h-5 w-5" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        className="w-[380px] p-0"
        sideOffset={10}
      >
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800">
          <h3 className="font-medium text-sm">Notificaciones</h3>
          <div className="flex items-center space-x-1">
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 text-xs"
                onClick={handleMarkAllAsRead}
              >
                <CheckCheckIcon className="h-4 w-4 mr-1" />
                Marcar todo como leído
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings2Icon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  Configurar notificaciones
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  Ver todas las notificaciones
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3 p-0 h-auto border-b border-gray-200 dark:border-gray-800">
            <TabsTrigger 
              value="all"
              className="rounded-none py-2 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              Todas
            </TabsTrigger>
            <TabsTrigger 
              value="unread"
              className="rounded-none py-2 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              No leídas
              {unreadCount > 0 && <Badge className="ml-1">{unreadCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger 
              value="saved"
              className="rounded-none py-2 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              Guardadas
              {readLaterCount > 0 && <Badge className="ml-1">{readLaterCount}</Badge>}
            </TabsTrigger>
          </TabsList>
          
          <ScrollArea className="h-[400px]">
            {filteredNotifications.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredNotifications.map((notification) => (
                  <NotificationItem 
                    key={notification.id} 
                    notification={notification} 
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
                {activeTab === 'unread' ? (
                  <>
                    <CheckCircleIcon className="h-12 w-12 mb-2 opacity-20" />
                    <p className="text-sm">No tienes notificaciones sin leer</p>
                  </>
                ) : activeTab === 'saved' ? (
                  <>
                    <BookmarkIcon className="h-12 w-12 mb-2 opacity-20" />
                    <p className="text-sm">No tienes notificaciones guardadas</p>
                  </>
                ) : (
                  <>
                    <BellIcon className="h-12 w-12 mb-2 opacity-20" />
                    <p className="text-sm">No tienes notificaciones</p>
                  </>
                )}
              </div>
            )}
          </ScrollArea>
        </Tabs>
        
        <Separator />
        
        <div className="p-2">
          <Button variant="ghost" size="sm" className="w-full text-sm justify-center">
            Ver todas las notificaciones
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};