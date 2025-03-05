import React, { useState } from 'react';
import { 
  BellIcon, 
  CheckIcon, 
  Clock,
  Trash2, 
  X, 
  BookmarkIcon,
  BookmarkCheckIcon,
  ExternalLinkIcon
} from 'lucide-react';
import { useNotifications, Notification, NotificationType } from '@/hooks/use-notifications';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn, getInitials, formatNotificationDate } from '@/lib/utils';

// Icon mapping for notification types
const NotificationTypeIcon: Record<
  NotificationType,
  React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>
> = {
  info: BellIcon,
  success: CheckIcon,
  warning: Clock,
  error: X,
  system: BellIcon,
};

// Background color mapping for notification types
const notificationTypeStyles: Record<NotificationType, string> = {
  info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  success: 'bg-green-500/10 text-green-600 dark:text-green-400',
  warning: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  error: 'bg-red-500/10 text-red-600 dark:text-red-400',
  system: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
};

// Individual notification item component
const NotificationItem = ({ notification }: { notification: Notification }) => {
  const { markAsRead, toggleReadLater, removeNotification } = useNotifications();
  
  const handleRead = () => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navigate to action URL if exists
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };
  
  const handleToggleReadLater = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleReadLater(notification.id);
  };
  
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeNotification(notification.id);
  };
  
  const NotificationIcon = NotificationTypeIcon[notification.type];
  
  return (
    <div 
      className={cn(
        "p-3 rounded-lg mb-2 cursor-pointer transition-all relative group",
        notification.read ? 'opacity-70' : '',
        !notification.read && 'border-l-2 border-primary'
      )}
      onClick={handleRead}
    >
      {/* Actions overlay visible on hover */}
      <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          size="icon"
          variant="ghost" 
          className="h-7 w-7"
          onClick={handleToggleReadLater} 
          title={notification.readLater ? "Quitar de leer más tarde" : "Leer más tarde"}
        >
          {notification.readLater ? 
            <BookmarkCheckIcon className="h-4 w-4 text-primary" /> : 
            <BookmarkIcon className="h-4 w-4" />
          }
        </Button>
        <Button 
          size="icon"
          variant="ghost" 
          className="h-7 w-7 hover:text-destructive"
          onClick={handleRemove}
          title="Eliminar"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex items-start gap-3">
        {/* Avatar or notification type icon */}
        {notification.sender ? (
          <Avatar className="h-9 w-9">
            <AvatarImage src={notification.sender.avatar} />
            <AvatarFallback>{getInitials(notification.sender.name)}</AvatarFallback>
          </Avatar>
        ) : (
          <div className={cn(
            "h-9 w-9 rounded-full flex items-center justify-center",
            notificationTypeStyles[notification.type]
          )}>
            <NotificationIcon className="h-5 w-5" />
          </div>
        )}
        
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <p className={cn(
              "text-sm font-medium leading-none",
              !notification.read && "font-semibold"
            )}>
              {notification.title}
            </p>
            <span className="text-xs text-muted-foreground">
              {formatNotificationDate(new Date(notification.createdAt))}
            </span>
          </div>
          
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {notification.message}
          </p>
          
          {notification.actionLabel && (
            <div className="mt-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="h-7 text-xs px-2"
                onClick={handleRead}
              >
                {notification.actionLabel}
                {notification.actionUrl && (
                  <ExternalLinkIcon className="ml-1 h-3 w-3" />
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const NotificationCenter = () => {
  const { 
    notifications, 
    unreadCount, 
    readLaterCount,
    markAllAsRead, 
    clearAll 
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notification.read;
    if (activeTab === 'read-later') return notification.readLater;
    return true;
  });
  
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 min-w-[1.25rem] text-[10px] px-1"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-[380px] p-0"
      >
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-medium">Notificaciones</h3>
          <div className="flex items-center gap-1">
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 text-xs" 
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              Marcar como leídas
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 text-xs text-destructive hover:text-destructive" 
              onClick={clearAll}
              disabled={notifications.length === 0}
            >
              Limpiar todo
            </Button>
          </div>
        </div>
        
        <Tabs 
          defaultValue="all" 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="w-full"
        >
          <div className="px-3 pt-2 border-b">
            <TabsList className="w-full bg-transparent">
              <TabsTrigger 
                value="all" 
                className="flex-1 data-[state=active]:bg-muted"
              >
                Todas
              </TabsTrigger>
              <TabsTrigger 
                value="unread" 
                className="flex-1 data-[state=active]:bg-muted"
                disabled={unreadCount === 0}
              >
                No leídas {unreadCount > 0 && `(${unreadCount})`}
              </TabsTrigger>
              <TabsTrigger 
                value="read-later" 
                className="flex-1 data-[state=active]:bg-muted"
                disabled={readLaterCount === 0}
              >
                <BookmarkIcon className="mr-1 h-3 w-3" />
                Leer después
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="all" className="m-0">
            <NotificationsContent notifications={filteredNotifications} />
          </TabsContent>
          
          <TabsContent value="unread" className="m-0">
            <NotificationsContent notifications={filteredNotifications} />
          </TabsContent>
          
          <TabsContent value="read-later" className="m-0">
            <NotificationsContent notifications={filteredNotifications} />
          </TabsContent>
        </Tabs>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Component for rendering the notifications list
const NotificationsContent = ({ notifications }: { notifications: Notification[] }) => {
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <BellIcon className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">
          No hay notificaciones
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Las notificaciones aparecerán aquí cuando las recibas
        </p>
      </div>
    );
  }
  
  return (
    <ScrollArea className="h-[400px] p-3">
      {notifications.map(notification => (
        <NotificationItem 
          key={notification.id} 
          notification={notification} 
        />
      ))}
    </ScrollArea>
  );
};