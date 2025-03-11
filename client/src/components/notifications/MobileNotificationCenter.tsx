import React from 'react';
import { 
  useNotifications, 
  useNotificationAPI, 
  Notification 
} from '@/hooks/use-notifications';
import { formatNotificationDate } from '@/lib/utils';
import { 
  InfoIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ServerIcon,
  CheckCheckIcon,
  BookmarkIcon,
  ArchiveIcon,
  BellIcon,
  CheckIcon
} from 'lucide-react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getInitials } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface MobileNotificationItemProps {
  notification: Notification;
}

const MobileNotificationItem = ({ notification }: MobileNotificationItemProps) => {
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

  const handleToggleReadLater = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleReadLater(notification.id);
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.read) {
      markAsRead(notification.id);
      
      const notificationId = parseInt(notification.id);
      if (!isNaN(notificationId)) {
        useNotificationAPI().markAsRead(notificationId);
      }
    }
  };

  return (
    <div 
      className={`p-3 border-b border-gray-100 dark:border-gray-800 transition-colors ${
        notification.read ? 'bg-transparent' : 'bg-blue-50 dark:bg-blue-950/30'
      } hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer relative`}
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
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-1">
            {notification.message}
          </p>
          {notification.actionLabel && (
            <Button variant="link" size="sm" className="p-0 h-auto text-xs font-medium">
              {notification.actionLabel}
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex justify-end mt-2 space-x-1.5">
        {!notification.read && (
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 px-2 py-1 text-xs"
            onClick={handleMarkAsRead}
          >
            <CheckIcon className="h-3.5 w-3.5 mr-1" />
            Marcar leído
          </Button>
        )}
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0"
          onClick={handleToggleReadLater}
          title={notification.readLater ? "Quitar de leer después" : "Leer después"}
        >
          <BookmarkIcon className={`h-4 w-4 ${notification.readLater ? 'fill-current' : ''}`} />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0"
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

export const MobileNotificationCenter = () => {
  const { notifications, unreadCount, markAllAsRead, readLaterCount } = useNotifications();
  const { markAllAsRead: markAllAsReadAPI } = useNotificationAPI();
  const [activeTab, setActiveTab] = React.useState('all');
  
  // Filtrar notificaciones según la pestaña activa
  const filteredNotifications = React.useMemo(() => {
    switch (activeTab) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'saved':
        return notifications.filter(n => n.readLater);
      default:
        return notifications;
    }
  }, [activeTab, notifications]);
  
  const handleMarkAllAsRead = () => {
    markAllAsRead();
    markAllAsReadAPI();
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="w-full grid grid-cols-3 p-0 h-auto border-b border-gray-200 dark:border-gray-800 rounded-none">
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
          
          <TabsContent value="all" className="flex-1 p-0 m-0">
            <ScrollArea className="flex-1 h-full">
              {notifications.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {notifications.map((notification) => (
                    <MobileNotificationItem 
                      key={notification.id} 
                      notification={notification} 
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
                  <BellIcon className="h-12 w-12 mb-2 opacity-20" />
                  <p className="text-sm">No tienes notificaciones</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="unread" className="flex-1 p-0 m-0">
            <ScrollArea className="flex-1 h-full">
              {filteredNotifications.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredNotifications.map((notification) => (
                    <MobileNotificationItem 
                      key={notification.id} 
                      notification={notification} 
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
                  <CheckCircleIcon className="h-12 w-12 mb-2 opacity-20" />
                  <p className="text-sm">No tienes notificaciones sin leer</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="saved" className="flex-1 p-0 m-0">
            <ScrollArea className="flex-1 h-full">
              {filteredNotifications.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredNotifications.map((notification) => (
                    <MobileNotificationItem 
                      key={notification.id} 
                      notification={notification} 
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
                  <BookmarkIcon className="h-12 w-12 mb-2 opacity-20" />
                  <p className="text-sm">No tienes notificaciones guardadas</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
      
      <Separator />
      
      <div className="p-4 flex justify-between">
        {unreadCount > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            className="text-sm"
            onClick={handleMarkAllAsRead}
          >
            <CheckCheckIcon className="h-4 w-4 mr-1" />
            Marcar todo como leído
          </Button>
        )}
        <Button 
          variant="default" 
          size="sm" 
          className="text-sm ml-auto"
        >
          Configuración
        </Button>
      </div>
    </div>
  );
};