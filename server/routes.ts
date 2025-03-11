import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth.js";
import { db } from "@db";
import { 
  users, actionRates, userActions, payments, projects
} from "@db/schema"; 
import { eq, count, sql, and, asc, desc, isNull, isNotNull } from "drizzle-orm";
import multer from "multer";
import path from "path";
import sharp from "sharp";
import fs from "fs";
import express from "express";
// import { BackupService } from "./services/backup";
import { StatsService } from "./services/stats";
import { getOnlineUsersService } from "./services/online-users";
import translatorRouter from "./routes/translator";
import { setUpVideoRoutes } from "./controllers/videoController";
import { setUpProjectRoutes } from "./controllers/projectController.js";
import { setUpUserRoutes } from "./controllers/userController.js";
import { setUpTitulinRoutes } from "./controllers/titulinController.js";
import { setUpProfileRoutes } from "./controllers/profileController.js";


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

    setupAuth(app);

    // Serve uploaded files
    app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

    // Register translator routes. Requiring authentication.
    app.use('/api/translator', requireAuth, translatorRouter);

    // Projects routes
    setUpProjectRoutes(requireAuth, app)

    // Videos routes
    setUpVideoRoutes(requireAuth, app)

    // Titulin
    setUpTitulinRoutes(requireAuth, app)

    // Users routes
    setUpUserRoutes(requireAuth, app)

    // Profile routes
    setUpProfileRoutes(requireAuth, app)

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
          .where(and(
            eq(userActions.userId, userId),
            // Filtrar por estado de pago si se especifica
            paid !== undefined ? eq(userActions.isPaid, paid === "true") : undefined
          ))
          // Ordenar por fecha (más reciente primero)
          .orderBy(desc(userActions.createdAt)); 


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
          onlineUsersService.registerUserActivity(req.user.id, req.user.username);
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

    const httpServer = createServer(app);
    return httpServer;
  } catch (error) {
    console.error("Error setting up routes:", error);
    throw error;
  }
}