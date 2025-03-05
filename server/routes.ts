import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth.js";
import { db } from "@db";
import { users, videos } from "@db/schema"; 
import { eq, count, sql } from "drizzle-orm";
import multer from "multer";
import path from "path";
import sharp from "sharp";
import fs from "fs";
import express from "express";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
// import { BackupService } from "./services/backup";
import { StatsService } from "./services/stats";
import translatorRouter from "./routes/translator";
import { setUpVideoRoutes } from "./controllers/videoController";
import ProjectController from "./controllers/projectController.js";
import UserController from "./controllers/userController.js";
import { setUpTitulinRoutes } from "./controllers/titulinController.js";

const scryptAsync = promisify(scrypt);

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
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
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

    app.post("/api/profile/password", requireAuth, async (req: Request, res: Response) => {
      const { currentPassword, newPassword } = req.body;

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

        const [salt, hash] = user[0].password.split(".");
        const buf = (await scryptAsync(currentPassword, salt, 64)) as Buffer;
        const hashedPassword = `${buf.toString("hex")}.${salt}`;

        if (hashedPassword !== user[0].password) {
          return res.status(400).json({
            success: false,
            message: "Contraseña actual incorrecta"
          });
        }

        // Actualizar con nueva contraseña
        const newHashedPassword = await hashPassword(newPassword);
        await db.update(users)
          .set({ password: newHashedPassword})
          .where(eq(users.id, req.user!.id!));

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

    app.post("/api/profile", requireAuth, async (req: Request, res: Response) => {      const { fullName, username, phone, bio } = req.body;

      try {
        // Validar que los campos requeridos estén presentes
        if (!fullName || !username) {
          return res.status(400).json({
            success: false,
            message: "El nombre completo y el nombre de usuario son requeridos"
          });
        }

        // Verificar si el nombre de usuario ya existe (excluyendo el usuario actual)
        const existingUser = await db
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

        const result = await db
          .update(users)
          .set({
            fullName,
            username,
            phone: phone || null,
            bio: bio || null,
            updatedAt: new Date()
          })
          .where(eq(users.id, req.user!.id as number))
          .returning();

        if (!result || result.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Usuario no encontrado"
          });
        }

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

    const httpServer = createServer(app);
    return httpServer;
  } catch (error) {
    console.error("Error setting up routes:", error);
    throw error;
  }
}