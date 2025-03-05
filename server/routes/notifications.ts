import { Express, Request, Response, NextFunction } from 'express';
import { getNotificationsService } from '../services/notifications';
import { db } from '@db/index';
import { notifications, notificationSettings } from '@db/schema';
import { eq, and } from 'drizzle-orm';

export function setupNotificationRoutes(app: Express, requireAuth: (req: Request, res: Response, next: NextFunction) => void) {
  // Obtener todas las notificaciones del usuario
  app.get('/api/notifications', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const includeRead = req.query.includeRead === 'true';
      const limit = parseInt(req.query.limit as string) || 50;
      
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      }
      
      const notificationsService = getNotificationsService();
      if (!notificationsService) {
        return res.status(500).json({ success: false, message: 'Servicio de notificaciones no disponible' });
      }
      
      const userNotifications = await notificationsService.getUserNotifications(userId, includeRead, limit);
      return res.json({ success: true, data: userNotifications });
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      return res.status(500).json({ success: false, message: 'Error al obtener notificaciones' });
    }
  });

  // Marcar notificación como leída
  app.post('/api/notifications/:id/read', requireAuth, async (req: Request, res: Response) => {
    try {
      const notificationId = parseInt(req.params.id);
      const userId = req.user?.id;
      
      if (!userId || !notificationId) {
        return res.status(400).json({ success: false, message: 'Parámetros inválidos' });
      }
      
      await db.update(notifications)
        .set({ isRead: true })
        .where(and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        ));
      
      return res.json({ success: true });
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      return res.status(500).json({ success: false, message: 'Error al actualizar notificación' });
    }
  });

  // Marcar todas las notificaciones como leídas
  app.post('/api/notifications/read-all', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      }
      
      await db.update(notifications)
        .set({ read: true })
        .where(eq(notifications.userId, userId));
      
      return res.json({ success: true });
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
      return res.status(500).json({ success: false, message: 'Error al actualizar notificaciones' });
    }
  });

  // Archivar notificación
  app.post('/api/notifications/:id/archive', requireAuth, async (req: Request, res: Response) => {
    try {
      const notificationId = parseInt(req.params.id);
      const userId = req.user?.id;
      
      if (!userId || !notificationId) {
        return res.status(400).json({ success: false, message: 'Parámetros inválidos' });
      }
      
      await db.update(notifications)
        .set({ archived: true })
        .where(and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        ));
      
      return res.json({ success: true });
    } catch (error) {
      console.error('Error al archivar notificación:', error);
      return res.status(500).json({ success: false, message: 'Error al archivar notificación' });
    }
  });

  // Crear una notificación (para administradores)
  app.post('/api/notifications', requireAuth, async (req: Request, res: Response) => {
    try {
      const { userId, title, message, type, actionUrl, actionLabel, relatedEntityType, relatedEntityId } = req.body;
      const createdBy = req.user?.id;
      
      if (!userId || !title || !message) {
        return res.status(400).json({ success: false, message: 'Faltan campos requeridos' });
      }
      
      // Verificar permisos (solo administradores pueden crear notificaciones para otros)
      if (req.user?.role !== 'admin' && userId !== createdBy) {
        return res.status(403).json({ success: false, message: 'No tienes permisos para crear notificaciones para otros usuarios' });
      }
      
      const notificationsService = getNotificationsService();
      if (!notificationsService) {
        return res.status(500).json({ success: false, message: 'Servicio de notificaciones no disponible' });
      }
      
      const notificationId = await notificationsService.createNotification({
        userId,
        title,
        message,
        type: type || 'info',
        actionUrl,
        actionLabel,
        relatedEntityType,
        relatedEntityId,
        createdBy
      });
      
      return res.json({ success: true, data: { id: notificationId } });
    } catch (error) {
      console.error('Error al crear notificación:', error);
      return res.status(500).json({ success: false, message: 'Error al crear notificación' });
    }
  });

  // Enviar notificación a todos los usuarios (solo admin)
  app.post('/api/notifications/role/all', requireAuth, async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Solo los administradores pueden enviar notificaciones a todos los usuarios' });
      }
      
      const { title, message, type, actionUrl, actionLabel } = req.body;
      
      if (!title || !message) {
        return res.status(400).json({ success: false, message: 'Faltan campos requeridos' });
      }
      
      const notificationsService = getNotificationsService();
      if (!notificationsService) {
        return res.status(500).json({ success: false, message: 'Servicio de notificaciones no disponible' });
      }
      
      // Obtener todos los usuarios
      const users = await db.query.users.findMany();
      
      // Enviar notificación a cada usuario
      const promises = users.map(user => 
        notificationsService.createNotification({
          userId: user.id,
          title,
          message,
          type: type || 'info',
          actionUrl,
          actionLabel,
          createdBy: req.user.id
        })
      );
      
      await Promise.all(promises);
      
      return res.json({ success: true });
    } catch (error) {
      console.error('Error al enviar notificaciones a todos los usuarios:', error);
      return res.status(500).json({ success: false, message: 'Error al enviar notificaciones' });
    }
  });

  // Enviar notificación a usuarios con rol específico (solo admin)
  app.post('/api/notifications/role/:role', requireAuth, async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Solo los administradores pueden enviar notificaciones a roles' });
      }
      
      const role = req.params.role;
      const { title, message, type, actionUrl, actionLabel } = req.body;
      
      if (!title || !message) {
        return res.status(400).json({ success: false, message: 'Faltan campos requeridos' });
      }
      
      const notificationsService = getNotificationsService();
      if (!notificationsService) {
        return res.status(500).json({ success: false, message: 'Servicio de notificaciones no disponible' });
      }
      
      await notificationsService.notifyUsersWithRole(role, {
        title,
        message,
        type: type || 'info',
        actionUrl,
        actionLabel,
        createdBy: req.user.id
      });
      
      return res.json({ success: true });
    } catch (error) {
      console.error('Error al enviar notificaciones a rol:', error);
      return res.status(500).json({ success: false, message: 'Error al enviar notificaciones' });
    }
  });

  // Obtener configuración de notificaciones
  app.get('/api/notifications/settings', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      }
      
      const notificationsService = getNotificationsService();
      if (!notificationsService) {
        return res.status(500).json({ success: false, message: 'Servicio de notificaciones no disponible' });
      }
      
      // Asegurar que el usuario tenga configuración
      await notificationsService.ensureUserHasSettings(userId);
      
      // Obtener configuración
      const settings = await notificationsService.getUserSettings(userId);
      return res.json({ success: true, data: settings });
    } catch (error) {
      console.error('Error al obtener configuración de notificaciones:', error);
      return res.status(500).json({ success: false, message: 'Error al obtener configuración' });
    }
  });

  // Actualizar configuración de notificaciones
  app.post('/api/notifications/settings', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
      }
      
      const { 
        emailEnabled, 
        pushEnabled, 
        inAppEnabled,
        contentChangesEnabled,
        assignmentsEnabled,
        mentionsEnabled,
        statusChangesEnabled,
        systemMessagesEnabled
      } = req.body;
      
      const notificationsService = getNotificationsService();
      if (!notificationsService) {
        return res.status(500).json({ success: false, message: 'Servicio de notificaciones no disponible' });
      }
      
      // Asegurar que el usuario tenga configuración
      await notificationsService.ensureUserHasSettings(userId);
      
      // Actualizar configuración
      await notificationsService.updateUserSettings(userId, {
        emailEnabled: emailEnabled !== undefined ? emailEnabled : true,
        pushEnabled: pushEnabled !== undefined ? pushEnabled : true,
        inAppEnabled: inAppEnabled !== undefined ? inAppEnabled : true,
        contentChangesEnabled: contentChangesEnabled !== undefined ? contentChangesEnabled : true,
        assignmentsEnabled: assignmentsEnabled !== undefined ? assignmentsEnabled : true,
        mentionsEnabled: mentionsEnabled !== undefined ? mentionsEnabled : true,
        statusChangesEnabled: statusChangesEnabled !== undefined ? statusChangesEnabled : true,
        systemMessagesEnabled: systemMessagesEnabled !== undefined ? systemMessagesEnabled : true
      });
      
      return res.json({ success: true });
    } catch (error) {
      console.error('Error al actualizar configuración de notificaciones:', error);
      return res.status(500).json({ success: false, message: 'Error al actualizar configuración' });
    }
  });
}