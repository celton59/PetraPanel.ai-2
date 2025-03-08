import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth, passwordUtils } from "./auth.js";
import { db } from "@db";
import { 
  users, videos, actionRates, userActions, payments, projects, youtube_channels
} from "@db/schema"; 
import { eq, count, sql, and, asc, desc, or, isNull, isNotNull, ne } from "drizzle-orm";
import multer from "multer";
import path from "path";
import sharp from "sharp";
import fs from "fs";
import express from "express";
// Importamos validaciones
import { 
  changePasswordSchema, 
  validateBody, 
  validateParams, 
  validateQuery, 
  createProfileSchema, 
  updateProfileSchema 
} from './lib/validation';
// import { BackupService } from "./services/backup";
import { StatsService } from "./services/stats";
import { getOnlineUsersService } from "./services/online-users";
import translatorRouter from "./routes/translator";
import { setUpVideoRoutes } from "./controllers/videoController";
import ProjectController from "./controllers/projectController.js";
import UserController from "./controllers/userController.js";
import { setUpTitulinRoutes } from "./controllers/titulinController.js";
import { setupNotificationRoutes } from "./routes/notifications";

// Utilizamos passwordUtils importado desde auth.ts

const avatarStorage = multer.diskStorage({
  destination: function (req: Express.Request, file: Express.Multer.File, cb: Function) {
    const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req: Express.Request, file: Express.Multer.File, cb: Function) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const avatarUpload = multer({ 
  storage: avatarStorage,
  limits: {
    fileSize: 1024 * 1024 * 10,
  }
});

async function hashPassword(password: string) {
  return passwordUtils.hash(password);
}

export function registerRoutes(app: Express): Server {
  try {
    // Configuración de CORS para permitir credenciales
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Middleware to check authentication
    const requireAuth = (req: Request, res: Response, next: NextFunction) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "No autenticado" });
      }
      next();
    };

    setupAuth(app); // Authentication setup moved here
    console.log("Authentication setup complete");
    console.log("Routes registered successfully");

    // Serve uploaded files
    app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

    // Register translator routes. Requiring authentication.
    app.use('/api/translator', requireAuth, translatorRouter);


    // Rutas de estadísticas
    app.get("/api/stats/overall", requireAuth, async (req: Request, res: Response) => {
      try {
        const stats = await db
          .select({
            total_videos: sql<number>`count(distinct ${videos.id})`,
            total_optimizations: count(videos.optimizedTitle),
            total_uploads: count(videos.videoUrl),
          })
          .from(videos);

        res.json({
          success: true,
          data: stats[0]
        });
      } catch (error) {
        console.error("Error fetching overall stats:", error);
        res.status(500).json({
          success: false,
          message: "Error al obtener estadísticas generales"
        });
      }
    });

    app.get("/api/stats/optimizations", requireAuth, async (req: Request, res: Response) => {
      try {
        const stats = await db
          .select({
            userId: videos.currentReviewerId,
            username: users.username,
            fullName: users.fullName,
            optimizations: count(),
          })
          .from(videos)
          .innerJoin(users, eq(users.id, videos.currentReviewerId))
          .where(sql`${videos.optimizedTitle} is not null`)
          .groupBy(videos.currentReviewerId, users.username, users.fullName);

        res.json(stats);
      } catch (error) {
        console.error("Error fetching optimization stats:", error);
        res.status(500).json({
          success: false,
          message: "Error al obtener estadísticas de optimizaciones"
        });
      }
    });

    app.get("/api/stats/uploads", requireAuth, async (req: Request, res: Response) => {
      try {
        const stats = await db
          .select({
            userId: videos.createdById,
            username: users.username,
            fullName: users.fullName,
            uploads: count(),
          })
          .from(videos)
          .innerJoin(users, eq(users.id, videos.createdById))
          .where(sql`${videos.videoUrl} is not null`)
          .groupBy(videos.createdById, users.username, users.fullName);

        res.json(stats);
      } catch (error) {
        console.error("Error fetching upload stats:", error);
        res.status(500).json({
          success: false,
          message: "Error al obtener estadísticas de subidas"
        });
      }
    });

    // Projects routes

    app.post("/api/projects", requireAuth, ProjectController.createProject);
    
    app.get("/api/projects", requireAuth, ProjectController.getProjects);

    app.put("/api/projects/:id", requireAuth, ProjectController.updateProject);

    app.delete("/api/projects/:id", requireAuth, ProjectController.deleteProject);

    // Videos routes
    
    setUpVideoRoutes(requireAuth, app)

    // Titulin
    setUpTitulinRoutes(app)
    
    // Notificaciones
    setupNotificationRoutes(app, requireAuth)

    // Users routes
    app.post("/api/users", requireAuth, UserController.createUser);

    app.put("/api/users/:id", requireAuth, UserController.updateUser );
    
    app.get("/api/users", requireAuth, UserController.getUsers );

    app.delete("/api/users/:id", requireAuth, UserController.deleteUser );

    // Profile routes
    app.get("/api/profile", requireAuth, async (req: Request, res: Response) => {      try {
        const user = await db.select()          .from(users)
          .where(eq(users.id, req.user!.id as number))
          .limit(1);

        if (!user || user.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Perfil no encontrado"
          });
        }

        const { password, ...profile } = user[0];
                res.json({
          success: true,
          data: profile
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({
          success: false,
          message: "Error al obtener el perfil"
        });
      }
    });

    // Implementar cambio de contraseña con validación robusta
    app.post(
      "/api/profile/password", 
      requireAuth, 
      // Aplicamos middleware de validación
      validateBody(changePasswordSchema),
      async (req: Request, res: Response) => {
        // Los datos ya han sido validados por validateBody
        const { currentPassword, newPassword } = req.validatedData;

        try {
          // Verificar contraseña actual
          const user = await db.select()
            .from(users)
            .where(eq(users.id, req.user!.id))
            .limit(1);

          if (!user.length) {
            return res.status(404).json({
              success: false,
              message: "Usuario no encontrado"
            });
          }

          // Verificar contraseña actual con timing-safe comparison
          const isValidPassword = await passwordUtils.comparePassword(currentPassword, user[0].password);

          if (!isValidPassword) {
            return res.status(400).json({
              success: false,
              message: "Contraseña actual incorrecta"
            });
          }

          // Evaluamos la fortaleza de la nueva contraseña
          const passwordStrength = passwordUtils.evaluatePasswordStrength(newPassword);
          
          // Si la contraseña tiene una puntuación de seguridad baja, registramos pero permitimos
          if (passwordStrength.score < 70) {
            console.warn(`Usuario ${req.user!.id} está usando una contraseña de baja seguridad (score: ${passwordStrength.score})`);
          }

          // Actualizar con nueva contraseña utilizando hash seguro
          const newHashedPassword = await passwordUtils.hashPassword(newPassword);
          await db.update(users)
            .set({ 
              password: newHashedPassword,
              updatedAt: new Date() // Actualizamos la fecha de modificación
            })
            .where(eq(users.id, req.user!.id!));

          // Registramos el cambio de contraseña en logs (sin detalles sensibles)
          console.log(`Usuario ${req.user!.id} ha cambiado su contraseña exitosamente`);

          res.json({
            success: true,
          message: "Contraseña actualizada correctamente"
        });
      } catch (error) {
        console.error("Error updating password:", error);
        res.status(500).json({
          success: false,
          message: "Error al actualizar la contraseña"
        });
      }
    });

    app.post(
      "/api/profile", 
      requireAuth, 
      // Aplicamos middleware de validación
      validateBody(updateProfileSchema),
      async (req: Request, res: Response) => {
        const { fullName, username, phone, bio } = req.validatedData;

        try {
          // Verificar si el nombre de usuario ya existe (excluyendo el usuario actual)
          let existingUser = null;
          if (username) {
            existingUser = await db
              .select()
              .from(users)
              .where(eq(users.username, username))
              .limit(1);

            if (existingUser.length > 0 && existingUser[0].id !== req.user!.id) {
              return res.status(400).json({
                success: false,
                message: "El nombre de usuario ya está en uso"
              });
            }
          }

          // Construir objeto de actualización con campos no nulos
          const updateData: Record<string, any> = {
            updatedAt: new Date()
          };
          
          if (fullName !== undefined) updateData.fullName = fullName;
          if (username !== undefined) updateData.username = username;
          if (phone !== undefined) updateData.phone = phone;
          if (bio !== undefined) updateData.bio = bio;

          const result = await db
            .update(users)
            .set(updateData)
            .where(eq(users.id, req.user!.id as number))
            .returning();

          if (!result || result.length === 0) {
            return res.status(404).json({
              success: false,
              message: "Usuario no encontrado"
            });
          }

          // Registramos la actualización del perfil (sin datos sensibles)
          console.log(`Usuario ${req.user!.id} ha actualizado su perfil`);

          // Excluimos la contraseña de la respuesta
          const { password, ...profile } = result[0];
          res.status(200).json({
            success: true,
            data: profile,
            message: "Perfil actualizado correctamente"
          });
        } catch (error) {
          console.error("Error updating profile:", error);
          res.status(500).json({
            success: false,
            message: "Error al actualizar el perfil"
          });
      }
    });

    // Avatar upload route
    app.post("/api/upload-avatar", requireAuth, avatarUpload.single('avatar'), async (req: Request, res: Response) => {
      const file = req.file;
      if (!file) {
        return res.status(400).json({
          success: false,
          message: "No se subió ningún archivo"
        });
      }

      try {
        const processedImagePath = file.path.replace(path.extname(file.path), '_processed.jpg');
        await sharp(file.path)
          .resize(256, 256)
          .jpeg({ quality: 90 })
          .toFile(processedImagePath);

        fs.unlinkSync(file.path);

        const avatarUrl = `/uploads/avatars/${path.basename(processedImagePath)}`;
        const result = await db
          .update(users)
          .set({ avatarUrl })
          .where(eq(users.id, req.user!.id as number))
          .returning();

        if (!result || result.length === 0) {
          throw new Error("Error al actualizar la URL del avatar");
        }

        res.json({
          success: true,
          data: { avatarUrl },
          message: "Avatar actualizado correctamente"
        });
      } catch (error) {
        console.error("Error processing avatar:", error);
        if (file) {
          fs.unlinkSync(file.path);
        }
        res.status(500).json({
          success: false,
          message: "Error al procesar el avatar"
        });
      }
    });

    // Initialize backup service
    // const backupService = new BackupService();

    // Backup routes
    // app.post("/api/projects/:id/backup", requireAuth, async (req: Request, res: Response) => {
    //   try {
    //     const projectId = parseInt(req.params.id);
    //     const metadata = await backupService.createBackup(projectId);

    //     res.json({
    //       success: true,
    //       data: metadata,
    //       message: "Backup created successfully"
    //     });
    //   } catch (error) {
    //     console.error("Error creating backup:", error);
    //     res.status(500).json({
    //       success: false,
    //       message: error instanceof Error ? error.message : "Error creating backup"
    //     });
    //   }
    // });

    // app.get("/api/projects/:id/backups", requireAuth, async (req: Request, res: Response) => {
    //   try {
    //     const projectId = parseInt(req.params.id);
    //     const backups = await backupService.listBackups(projectId);

    //     res.json({
    //       success: true,
    //       data: backups,
    //       message: "Backups retrieved successfully"
    //     });
    //   } catch (error) {
    //     console.error("Error listing backups:", error);
    //     res.status(500).json({
    //       success: false,
    //       message: error instanceof Error ? error.message : "Error listing backups"
    //     });
    //   }
    // });

    // app.post("/api/projects/:id/restore", requireAuth, async (req: Request, res: Response) => {
    //   try {
    //     const projectId = parseInt(req.params.id);
    //     const { timestamp } = req.body;

    //     if (!timestamp) {
    //       return res.status(400).json({
    //         success: false,
    //         message: "Timestamp is required for restoration"
    //       });
    //     }

    //     await backupService.restoreFromBackup(projectId, timestamp);

    //     res.json({
    //       success: true,
    //       message: "Project restored successfully"
    //     });
    //   } catch (error) {
    //     console.error("Error restoring backup:", error);
    //     res.status(500).json({
    //       success: false,
    //       message: error instanceof Error ? error.message : "Error restoring backup"
    //     });
    //   }
    // });

    // Stats routes
    app.get("/api/stats/overall", requireAuth, async (req: Request, res: Response) => {
      try {
        const stats = await StatsService.getOverallStats();
        res.json({
          success: true,
          data: stats
        });
      } catch (error) {
        console.error("Error fetching overall stats:", error);
        res.status(500).json({
          success: false,
          message: "Error al obtener estadísticas generales"
        });
      }
    });

    app.get("/api/stats/optimizations", requireAuth, async (req: Request, res: Response) => {
      try {
        const stats = await StatsService.getOptimizationStats();
        res.json(stats);
      } catch (error) {
        console.error("Error fetching optimization stats:", error);
        res.status(500).json({
          success: false,
          message: "Error al obtener las estadísticas de optimización"
        });
      }
    });

    app.get("/api/stats/uploads", requireAuth, async (req: Request, res: Response) => {
      try {
        const stats = await StatsService.getUploadStats();
        res.json(stats);
      } catch (error) {
        console.error("Error fetching upload stats:", error);
        res.status(500).json({
          success: false,
          message: "Error al obtener las estadísticas de subidas"
        });
      }
    });

    // Rutas para el sistema de contabilidad
    
    // Obtener todas las tarifas por acción
    app.get("/api/accounting/rates", requireAuth, async (req: Request, res: Response) => {
      try {
        // Verificar que el usuario sea administrador
        if (req.user?.role !== "admin") {
          return res.status(403).json({
            success: false,
            message: "No tiene permisos para acceder a esta información"
          });
        }

        const rates = await db
          .select()
          .from(actionRates)
          .orderBy(asc(actionRates.actionType), asc(actionRates.roleId));

        res.json({
          success: true,
          data: rates
        });
      } catch (error) {
        console.error("Error fetching action rates:", error);
        res.status(500).json({
          success: false,
          message: "Error al obtener las tarifas"
        });
      }
    });

    // Crear/Actualizar tarifa
    app.post("/api/accounting/rates", requireAuth, async (req: Request, res: Response) => {
      try {
        // Verificar que el usuario sea administrador
        if (req.user?.role !== "admin") {
          return res.status(403).json({
            success: false,
            message: "No tiene permisos para realizar esta acción"
          });
        }

        const { actionType, roleId, rate, projectId } = req.body;

        // Validar datos
        if (!actionType || !roleId || rate === undefined) {
          return res.status(400).json({
            success: false,
            message: "Los campos actionType, roleId y rate son obligatorios"
          });
        }

        // Verificar si ya existe una tarifa para esta acción y rol
        const existingRate = await db
          .select()
          .from(actionRates)
          .where(
            and(
              eq(actionRates.actionType, actionType),
              eq(actionRates.roleId, roleId),
              projectId ? eq(actionRates.projectId, projectId) : isNull(actionRates.projectId)
            )
          )
          .limit(1);

        let result;
        if (existingRate.length > 0) {
          // Actualizar tarifa existente
          result = await db
            .update(actionRates)
            .set({
              rate,
              updatedAt: new Date()
            })
            .where(eq(actionRates.id, existingRate[0].id))
            .returning();
        } else {
          // Crear nueva tarifa
          result = await db
            .insert(actionRates)
            .values({
              actionType,
              roleId,
              rate,
              projectId: projectId || null,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            })
            .returning();
        }

        res.json({
          success: true,
          data: result[0],
          message: existingRate.length > 0 ? "Tarifa actualizada correctamente" : "Tarifa creada correctamente"
        });
      } catch (error) {
        console.error("Error creating/updating action rate:", error);
        res.status(500).json({
          success: false,
          message: "Error al crear/actualizar la tarifa"
        });
      }
    });

    // Eliminar tarifa
    app.delete("/api/accounting/rates/:id", requireAuth, async (req: Request, res: Response) => {
      try {
        // Verificar que el usuario sea administrador
        if (req.user?.role !== "admin") {
          return res.status(403).json({
            success: false,
            message: "No tiene permisos para realizar esta acción"
          });
        }

        const rateId = parseInt(req.params.id);

        await db
          .delete(actionRates)
          .where(eq(actionRates.id, rateId));

        res.json({
          success: true,
          message: "Tarifa eliminada correctamente"
        });
      } catch (error) {
        console.error("Error deleting action rate:", error);
        res.status(500).json({
          success: false,
          message: "Error al eliminar la tarifa"
        });
      }
    });

    // Registrar acción
    app.post("/api/accounting/actions", requireAuth, async (req: Request, res: Response) => {
      try {
        const { userId, actionType, videoId, projectId } = req.body;

        // Validar datos
        if (!userId || !actionType) {
          return res.status(400).json({
            success: false,
            message: "Los campos userId y actionType son obligatorios"
          });
        }

        // Obtener información del usuario
        const userInfo = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (!userInfo.length) {
          return res.status(404).json({
            success: false,
            message: "Usuario no encontrado"
          });
        }

        // Obtener tarifa aplicable
        const rate = await db
          .select()
          .from(actionRates)
          .where(
            and(
              eq(actionRates.actionType, actionType),
              eq(actionRates.roleId, userInfo[0].role),
              projectId ? eq(actionRates.projectId, projectId) : isNull(actionRates.projectId),
              eq(actionRates.isActive, true)
            )
          )
          .limit(1);

        // Registrar la acción
        const action = await db
          .insert(userActions)
          .values({
            userId,
            actionType,
            videoId: videoId || null,
            projectId: projectId || null,
            rateApplied: rate.length > 0 ? rate[0].rate : null,
            isPaid: false,
            createdAt: new Date()
          })
          .returning();

        res.json({
          success: true,
          data: action[0],
          message: "Acción registrada correctamente"
        });
      } catch (error) {
        console.error("Error registering action:", error);
        res.status(500).json({
          success: false,
          message: "Error al registrar la acción"
        });
      }
    });

    // Obtener acciones pendientes de pago
    app.get("/api/accounting/pending-payments", requireAuth, async (req: Request, res: Response) => {
      try {
        // Verificar que el usuario sea administrador
        if (req.user?.role !== "admin") {
          return res.status(403).json({
            success: false,
            message: "No tiene permisos para acceder a esta información"
          });
        }

        const pendingActions = await db
          .select({
            userId: userActions.userId,
            username: users.username,
            fullName: users.fullName,
            totalAmount: sql<string>`SUM(${userActions.rateApplied})`,
            actionsCount: count()
          })
          .from(userActions)
          .innerJoin(users, eq(users.id, userActions.userId))
          .where(
            and(
              eq(userActions.isPaid, false),
              isNotNull(userActions.rateApplied)
            )
          )
          .groupBy(userActions.userId, users.username, users.fullName);

        res.json({
          success: true,
          data: pendingActions
        });
      } catch (error) {
        console.error("Error fetching pending payments:", error);
        res.status(500).json({
          success: false,
          message: "Error al obtener pagos pendientes"
        });
      }
    });

    // Obtener detalle de acciones por usuario
    app.get("/api/accounting/user-actions/:userId", requireAuth, async (req: Request, res: Response) => {
      try {
        // Verificar que el usuario sea administrador o el propio usuario
        if (req.user?.role !== "admin" && req.user?.id !== parseInt(req.params.userId)) {
          return res.status(403).json({
            success: false,
            message: "No tiene permisos para acceder a esta información"
          });
        }

        const userId = parseInt(req.params.userId);
        const { paid } = req.query;

        let query = db
          .select({
            id: userActions.id,
            actionType: userActions.actionType,
            videoId: userActions.videoId,
            projectId: userActions.projectId,
            projectName: projects.name,
            rate: userActions.rateApplied,
            isPaid: userActions.isPaid,
            createdAt: userActions.createdAt,
            paymentDate: userActions.paymentDate,
            paymentReference: userActions.paymentReference
          })
          .from(userActions)
          .leftJoin(projects, eq(projects.id, userActions.projectId))
          .where(eq(userActions.userId, userId));

        // Filtrar por estado de pago si se especifica
        if (paid !== undefined) {
          query = query.where(eq(userActions.isPaid, paid === 'true'));
        }

        // Ordenar por fecha (más reciente primero)
        query = query.orderBy(desc(userActions.createdAt));

        const actions = await query;

        res.json({
          success: true,
          data: actions
        });
      } catch (error) {
        console.error("Error fetching user actions:", error);
        res.status(500).json({
          success: false,
          message: "Error al obtener acciones del usuario"
        });
      }
    });

    // Registrar pago
    app.post("/api/accounting/payments", requireAuth, async (req: Request, res: Response) => {
      try {
        // Verificar que el usuario sea administrador
        if (req.user?.role !== "admin") {
          return res.status(403).json({
            success: false,
            message: "No tiene permisos para realizar esta acción"
          });
        }

        const { userId, amount, reference, notes, actionIds } = req.body;

        if (!userId || !amount || !actionIds || !Array.isArray(actionIds)) {
          return res.status(400).json({
            success: false,
            message: "Los campos userId, amount y actionIds son obligatorios"
          });
        }

        // Registrar el pago
        const payment = await db
          .insert(payments)
          .values({
            userId,
            amount,
            paymentDate: new Date(),
            reference: reference || null,
            notes: notes || null,
            createdAt: new Date()
          })
          .returning();

        // Actualizar acciones como pagadas
        if (actionIds && actionIds.length > 0) {
          await db
            .update(userActions)
            .set({
              isPaid: true,
              paymentDate: new Date(),
              paymentReference: payment[0].id.toString()
            })
            .where(
              and(
                eq(userActions.userId, userId),
                eq(userActions.isPaid, false),
                sql`${userActions.id} = ANY(ARRAY[${actionIds.join(',')}]::int[])`
              )
            );
        }

        res.json({
          success: true,
          data: payment[0],
          message: "Pago registrado correctamente"
        });
      } catch (error) {
        console.error("Error registering payment:", error);
        res.status(500).json({
          success: false,
          message: "Error al registrar el pago"
        });
      }
    });

    // Historial de pagos
    app.get("/api/accounting/payments-history", requireAuth, async (req: Request, res: Response) => {
      try {
        // Verificar que el usuario sea administrador
        if (req.user?.role !== "admin") {
          return res.status(403).json({
            success: false,
            message: "No tiene permisos para acceder a esta información"
          });
        }

        const paymentsHistory = await db
          .select({
            id: payments.id,
            userId: payments.userId,
            username: users.username,
            fullName: users.fullName,
            amount: payments.amount,
            paymentDate: payments.paymentDate,
            reference: payments.reference,
            notes: payments.notes
          })
          .from(payments)
          .innerJoin(users, eq(users.id, payments.userId))
          .orderBy(desc(payments.paymentDate));

        res.json({
          success: true,
          data: paymentsHistory
        });
      } catch (error) {
        console.error("Error fetching payments history:", error);
        res.status(500).json({
          success: false,
          message: "Error al obtener historial de pagos"
        });
      }
    });
    
    app.get("/api/stats/user/:userId", requireAuth, async (req: Request, res: Response) => {
      try {
        const stats = await StatsService.getUserStats(parseInt(req.params.userId));
        res.json({
          success: true,
          data: stats
        });
      } catch (error) {
        console.error("Error fetching user stats:", error);
        res.status(500).json({
          success: false,
          message: "Error al obtener estadísticas del usuario"
        });
      }
    });

    // Ruta para obtener usuarios en línea (alternativa REST al WebSocket)
    app.get("/api/online-users", requireAuth, async (req: Request, res: Response) => {
      try {
        const onlineUsersService = getOnlineUsersService();
        if (!onlineUsersService) {
          return res.status(503).json({
            success: false,
            message: "El servicio de usuarios en línea no está disponible"
          });
        }

        // Registra la actividad del usuario actual mediante REST
        if (req.user) {
          onlineUsersService.registerUserActivity(req.user);
        }

        const activeUsers = onlineUsersService.getActiveUsers();
        res.json({
          success: true,
          data: activeUsers
        });
      } catch (error) {
        console.error("Error fetching online users:", error);
        res.status(500).json({
          success: false,
          message: "Error al obtener usuarios en línea"
        });
      }
    });
    
    // Endpoint para búsqueda global
    app.get("/api/search", requireAuth, async (req: Request, res: Response) => {
      try {
        const query = (req.query.q as string || '').toLowerCase();
        
        // Si no hay query, devolver resultados vacíos
        if (!query || query.length < 2) {
          return res.json({ results: [] });
        }
        
        // Arrays para almacenar los diferentes tipos de resultados
        let dbUsers = [] as any[];
        let dbVideos = [] as any[];
        let dbProjects = [] as any[];
        let dbYoutubeChannels = [] as any[];
        
        // 1. Obtener usuarios de la base de datos
        try {
          const usersResult = await db.select().from(users).limit(20);
          
          dbUsers = usersResult.map(user => ({
            id: user.id,
            title: user.fullName || user.username,
            subtitle: user.email || `@${user.username}`,
            type: 'user' as const,
            url: `/users/${user.id}`,
            thumbnail: user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
          }));
          
          console.log(`Encontrados ${dbUsers.length} usuarios en la base de datos`);
        } catch (error) {
          console.error('Error al obtener usuarios de la base de datos:', error);
        }
        
        // 2. Obtener videos de la base de datos
        try {
          const videosResult = await db.select({
            id: videos.id,
            title: videos.title,
            description: videos.description,
            status: videos.status,
            projectId: videos.projectId,
            projectName: projects.name,
            thumbnailUrl: videos.thumbnailUrl,
            createdAt: videos.createdAt,
            tags: videos.tags
          })
          .from(videos)
          .leftJoin(projects, eq(videos.projectId, projects.id))
          .limit(30);
          
          dbVideos = videosResult.map(video => ({
            id: video.id,
            title: video.title,
            subtitle: video.projectName ? `Proyecto: ${video.projectName}` : (video.description || 'Sin descripción'),
            type: 'video' as const,
            url: `/videos/${video.id}`,
            thumbnail: video.thumbnailUrl || `https://api.dicebear.com/7.x/shapes/svg?seed=video${video.id}`,
            status: video.status,
            date: video.createdAt,
            tags: video.tags || [],
          }));
          
          console.log(`Encontrados ${dbVideos.length} videos en la base de datos`);
        } catch (error) {
          console.error('Error al obtener videos de la base de datos:', error);
        }
        
        // Mantener algunos resultados de ejemplo para compatibilidad
        const results = [
          // Videos
          {
            id: 1,
            title: 'Cómo optimizar videos para YouTube',
            subtitle: 'Tutorial SEO',
            type: 'video',
            url: '/videos/1',
            thumbnail: 'https://api.dicebear.com/7.x/shapes/svg?seed=video1',
            status: 'completed',
            tags: ['tutorial', 'seo', 'youtube']
          },
          {
            id: 2,
            title: 'Los mejores plugins para WordPress 2025',
            subtitle: 'Guía completa',
            type: 'video',
            url: '/videos/2',
            thumbnail: 'https://api.dicebear.com/7.x/shapes/svg?seed=video2',
            status: 'content_review',
            tags: ['wordpress', 'plugins', 'web']
          },
          {
            id: 3,
            title: 'Entrevista con Aitor Menta',
            subtitle: 'Especialista en SEO',
            type: 'video',
            url: '/videos/3',
            thumbnail: 'https://api.dicebear.com/7.x/shapes/svg?seed=video3',
            status: 'completed',
            tags: ['entrevista', 'seo', 'marketing']
          },
          {
            id: 4,
            title: 'Análisis de redes sociales',
            subtitle: 'Por Aitor Tilla',
            type: 'video',
            url: '/videos/4',
            thumbnail: 'https://api.dicebear.com/7.x/shapes/svg?seed=video4',
            status: 'media_review',
            tags: ['redes', 'social', 'analisis']
          },
          // Proyectos
          {
            id: 1,
            title: 'Marketing Digital',
            type: 'project',
            url: '/projects/1',
            icon: '💼',
          },
          {
            id: 2,
            title: 'Tutoriales de código',
            type: 'project',
            url: '/projects/2',
            icon: '💻',
          },
          {
            id: 3,
            title: 'Proyecto Aitor',
            subtitle: 'Investigación de mercado',
            type: 'project',
            url: '/projects/3',
            icon: '🔍',
          },
          // Usuarios
          {
            id: 1,
            title: 'Ana González',
            subtitle: 'Diseñadora UX',
            type: 'user',
            url: '/users/1',
            thumbnail: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana',
          },
          {
            id: 2,
            title: 'Carlos Martínez',
            subtitle: 'Editor de video',
            type: 'user',
            url: '/users/2',
            thumbnail: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos',
          },
          {
            id: 3,
            title: 'Aitor García',
            subtitle: 'Especialista en SEO',
            type: 'user',
            url: '/users/3',
            thumbnail: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aitor',
          },
          {
            id: 4,
            title: 'Elena Aitor',
            subtitle: 'Content Manager',
            type: 'user',
            url: '/users/4',
            thumbnail: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena',
          },
          // Canales
          {
            id: 1,
            title: 'TechTutorials',
            subtitle: 'Canal YouTube',
            type: 'channel',
            url: '/titulin/channels/1',
            icon: '📺',
          },
          {
            id: 2,
            title: 'AitorTech',
            subtitle: 'Canal de tecnología',
            type: 'channel',
            url: '/titulin/channels/2',
            icon: '📱',
          },
          // Configuración
          {
            id: 1,
            title: 'Ajustes de perfil',
            type: 'settings',
            url: '/profile',
            icon: '⚙️',
          },
          {
            id: 2,
            title: 'Configuración de notificaciones',
            type: 'settings',
            url: '/settings/notifications',
            icon: '🔔',
          },
          {
            id: 3,
            title: 'Gestión de usuarios',
            type: 'settings',
            url: '/admin/users',
            icon: '👥',
          }
        ];
        
        // 3. Obtener proyectos de la base de datos
        try {
          const projectsResult = await db.select().from(projects).limit(20);
          
          dbProjects = projectsResult.map(project => ({
            id: project.id,
            title: project.name,
            subtitle: project.description || 'Proyecto',
            type: 'project' as const,
            url: `/projects/${project.id}`,
            icon: project.prefix || '📁',
          }));
          
          console.log(`Encontrados ${dbProjects.length} proyectos en la base de datos`);
        } catch (error) {
          console.error('Error al obtener proyectos de la base de datos:', error);
        }
        
        // 4. Obtener canales de YouTube
        try {
          const channelsResult = await db.select().from(youtube_channels).limit(15);
          
          dbYoutubeChannels = channelsResult.map(channel => ({
            id: channel.id,
            title: channel.name,
            subtitle: 'Canal YouTube',
            type: 'channel' as const,
            url: `/titulin/channels/${channel.id}`,
            thumbnail: channel.thumbnailUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${channel.name}`,
            icon: '📺',
          }));
          
          console.log(`Encontrados ${dbYoutubeChannels.length} canales de YouTube en la base de datos`);
        } catch (error) {
          console.error('Error al obtener canales de YouTube de la base de datos:', error);
        }
        
        // 5. Configuración y elementos estáticos
        const settingsItems = [
          {
            id: 'profile',
            title: 'Ajustes de perfil',
            type: 'settings' as const,
            url: '/profile',
            icon: '⚙️',
          },
          {
            id: 'notifications',
            title: 'Configuración de notificaciones',
            type: 'settings' as const,
            url: '/settings/notifications',
            icon: '🔔',
          },
          {
            id: 'users',
            title: 'Gestión de usuarios',
            type: 'settings' as const,
            url: '/admin/users',
            icon: '👥',
          },
          {
            id: 'search',
            title: 'Configuración de búsqueda',
            type: 'settings' as const,
            url: '/settings/search',
            icon: '🔍',
          }
        ];
        
        // Combinamos todos los resultados con prioridad a los datos reales
        const allResults = [
          ...dbUsers,           // Usuarios reales de la base de datos
          ...dbVideos,          // Videos reales de la base de datos
          ...dbProjects,        // Proyectos reales de la base de datos
          ...dbYoutubeChannels, // Canales reales de YouTube
          ...settingsItems,     // Items estáticos de configuración
        ];
        
        // Filtrar resultados según query (mejorado para ser más inclusivo)
        const filteredResults = allResults.filter(item => {
          const titleMatch = item.title?.toLowerCase().includes(query);
          const subtitleMatch = item.subtitle?.toLowerCase().includes(query);
          const tagsMatch = item.tags?.some(tag => tag.toLowerCase().includes(query));
          
          // Buscamos también coincidencias parciales en palabras
          const words = item.title?.toLowerCase().split(' ') || [];
          const wordMatch = words.some(word => word.startsWith(query));
          
          return titleMatch || subtitleMatch || tagsMatch || wordMatch;
        });
        
        console.log(`Búsqueda "${query}" encontró ${filteredResults.length} resultados`);
        
        return res.json({ results: filteredResults });
      } catch (error) {
        console.error('Error en búsqueda global:', error);
        return res.status(500).json({ success: false, message: 'Error al realizar la búsqueda' });
      }
    });

    const httpServer = createServer(app);
    return httpServer;
  } catch (error) {
    console.error("Error setting up routes:", error);
    throw error;
  }
}