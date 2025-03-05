import { Request, Response, NextFunction, Express } from 'express';
import { z } from 'zod';
import { getNotificationsService, setupNotificationsService } from '../services/notifications';
import { User } from '@db/schema';
import { log } from '../vite';

// Esquema para validar la creación de notificaciones
const createNotificationSchema = z.object({
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  type: z.enum(['info', 'success', 'warning', 'error', 'system']).optional(),
  actionUrl: z.string().optional(),
  actionLabel: z.string().optional(),
  relatedEntityType: z.string().optional(),
  relatedEntityId: z.number().optional(),
  userId: z.number()
});

// Esquema para actualizar configuración de notificaciones
const updateSettingsSchema = z.object({
  emailEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  contentChangesEnabled: z.boolean().optional(),
  assignmentsEnabled: z.boolean().optional(),
  mentionsEnabled: z.boolean().optional(),
  statusChangesEnabled: z.boolean().optional(),
  systemMessagesEnabled: z.boolean().optional()
});

export function setupNotificationRoutes(app: Express, requireAuth: (req: Request, res: Response, next: NextFunction) => void) {
  // Obtener todas las notificaciones del usuario actual
  app.get('/api/notifications', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const includeRead = req.query.includeRead === 'true';
      const limit = parseInt(req.query.limit as string) || 50;
      
      const notificationsService = getNotificationsService();
      if (!notificationsService) {
        return res.status(500).json({ success: false, message: 'Servicio de notificaciones no disponible' });
      }

      const notifications = await notificationsService.getUserNotifications(userId, includeRead, limit);
      
      return res.json({ success: true, data: notifications });
    } catch (error) {
      log(`Error al obtener notificaciones: ${error}`, 'notifications');
      return res.status(500).json({ success: false, message: 'Error al obtener notificaciones' });
    }
  });

  // Marcar notificación como leída
  app.post('/api/notifications/:id/read', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const notificationId = parseInt(req.params.id);
      
      const notificationsService = getNotificationsService();
      if (!notificationsService) {
        return res.status(500).json({ success: false, message: 'Servicio de notificaciones no disponible' });
      }

      await notificationsService['markNotificationAsRead'](userId, notificationId);
      
      return res.json({ success: true });
    } catch (error) {
      log(`Error al marcar notificación como leída: ${error}`, 'notifications');
      return res.status(500).json({ success: false, message: 'Error al marcar notificación como leída' });
    }
  });

  // Marcar todas las notificaciones como leídas
  app.post('/api/notifications/read-all', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }
      
      const notificationsService = getNotificationsService();
      if (!notificationsService) {
        return res.status(500).json({ success: false, message: 'Servicio de notificaciones no disponible' });
      }

      await notificationsService['markAllNotificationsAsRead'](userId);
      
      return res.json({ success: true });
    } catch (error) {
      log(`Error al marcar todas las notificaciones como leídas: ${error}`, 'notifications');
      return res.status(500).json({ success: false, message: 'Error al marcar notificaciones como leídas' });
    }
  });

  // Archivar notificación
  app.post('/api/notifications/:id/archive', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const notificationId = parseInt(req.params.id);
      
      const notificationsService = getNotificationsService();
      if (!notificationsService) {
        return res.status(500).json({ success: false, message: 'Servicio de notificaciones no disponible' });
      }

      await notificationsService['archiveNotification'](userId, notificationId);
      
      return res.json({ success: true });
    } catch (error) {
      log(`Error al archivar notificación: ${error}`, 'notifications');
      return res.status(500).json({ success: false, message: 'Error al archivar notificación' });
    }
  });

  // Crear notificación (solo admin)
  app.post('/api/notifications', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      
      if (!userId || userRole !== 'admin') {
        return res.status(403).json({ success: false, message: 'No autorizado' });
      }

      const validation = createNotificationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ success: false, message: 'Datos inválidos', errors: validation.error.errors });
      }

      const notificationsService = getNotificationsService();
      if (!notificationsService) {
        return res.status(500).json({ success: false, message: 'Servicio de notificaciones no disponible' });
      }

      const notificationId = await notificationsService.createNotification({
        ...validation.data,
        createdBy: userId
      });
      
      return res.json({ success: true, data: { id: notificationId } });
    } catch (error) {
      log(`Error al crear notificación: ${error}`, 'notifications');
      return res.status(500).json({ success: false, message: 'Error al crear notificación' });
    }
  });

  // Crear notificación para todos los usuarios con un rol específico (solo admin)
  app.post('/api/notifications/role/:role', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      
      if (!userId || userRole !== 'admin') {
        return res.status(403).json({ success: false, message: 'No autorizado' });
      }

      const targetRole = req.params.role as User['role'];
      const validation = createNotificationSchema.omit({ userId: true }).safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ success: false, message: 'Datos inválidos', errors: validation.error.errors });
      }

      const notificationsService = getNotificationsService();
      if (!notificationsService) {
        return res.status(500).json({ success: false, message: 'Servicio de notificaciones no disponible' });
      }

      await notificationsService.notifyUsersWithRole(targetRole, {
        ...validation.data,
        createdBy: userId
      });
      
      return res.json({ success: true });
    } catch (error) {
      log(`Error al crear notificación para rol: ${error}`, 'notifications');
      return res.status(500).json({ success: false, message: 'Error al crear notificación para rol' });
    }
  });

  // Obtener configuración de notificaciones
  app.get('/api/notifications/settings', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
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
      log(`Error al obtener configuración de notificaciones: ${error}`, 'notifications');
      return res.status(500).json({ success: false, message: 'Error al obtener configuración' });
    }
  });

  // Actualizar configuración de notificaciones
  app.post('/api/notifications/settings', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const validation = updateSettingsSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ success: false, message: 'Datos inválidos', errors: validation.error.errors });
      }
      
      const notificationsService = getNotificationsService();
      if (!notificationsService) {
        return res.status(500).json({ success: false, message: 'Servicio de notificaciones no disponible' });
      }

      // Asegurar que el usuario tenga configuración
      await notificationsService.ensureUserHasSettings(userId);
      
      // Actualizar configuración
      const success = await notificationsService.updateUserSettings(userId, validation.data);
      
      if (!success) {
        return res.status(500).json({ success: false, message: 'Error al actualizar configuración' });
      }
      
      return res.json({ success: true });
    } catch (error) {
      log(`Error al actualizar configuración de notificaciones: ${error}`, 'notifications');
      return res.status(500).json({ success: false, message: 'Error al actualizar configuración' });
    }
  });
}