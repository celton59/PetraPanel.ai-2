import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth.js";
import { db } from "@db";
import { users, projects, videos, projectAccess } from "@db/schema"; 
import { eq, and, desc, count, sql } from "drizzle-orm";
import multer from "multer";
import path from "path";
import sharp from "sharp";
import fs from "fs";
import express from "express";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import type { SQL } from "drizzle-orm";
import type { InsertVideo, InsertProject } from "@db/schema";
import { Client } from '@replit/object-storage';
import { BackupService } from "./services/backup";
import { StatsService } from "./services/stats";
import translatorRouter from "./routes/translator";

const scryptAsync = promisify(scrypt);

const storage = multer.diskStorage({
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
  }
});

const upload = multer({ storage: storage });

// Configuración de multer para videos
const videoStorage = multer.diskStorage({
  destination: function (req: Express.Request, file: Express.Multer.File, cb: Function) {
    const uploadDir = path.join(process.cwd(), 'uploads', 'videos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req: Express.Request, file: Express.Multer.File, cb: Function) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const videoUpload = multer({
  storage: videoStorage,
  limits: {
    fileSize: 1024 * 1024 * 1024 // 1GB limit
  }
});

const client = new Client();

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

    // Serve uploaded files
    app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

    // Middleware to check authentication
    const requireAuth = (req: Request, res: Response, next: NextFunction) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "No autenticado" });
      }
      next();
    };

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
    app.delete("/api/users/:id", requireAuth, async (req: Request, res: Response) => {
      const { id } = req.params;

      try {
        // Verificar si el usuario tiene permisos para eliminar usuarios
        if (req.user?.role !== 'admin') {
          return res.status(403).json({
            success: false,
            message: "No tienes permisos para eliminar usuarios"
          });
        }

        // Verificar que el usuario existe
        const [userToDelete] = await db.select()
          .from(users)
          .where(eq(users.id, parseInt(id)))
          .limit(1);

        if (!userToDelete) {
          return res.status(404).json({
            success: false,
            message: "Usuario no encontrado"
          });
        }

        // Eliminar primero las relaciones en projectAccess
        await db.delete(projectAccess)
          .where(eq(projectAccess.userId, parseInt(id)));

        // Eliminar el usuario
        const [deletedUser] = await db.delete(users)
          .where(eq(users.id, parseInt(id)))
          .returning();

        if (!deletedUser) {
          throw new Error("Error al eliminar el usuario");
        }

        // Si el usuario eliminado es el mismo que está logueado, cerrar su sesión
        if (req.user?.id === parseInt(id)) {
          req.logout((err) => {
            if (err) {
              console.error("Error logging out user:", err);
            }
          });
        }

        res.json({
          success: true,
          message: "Usuario eliminado correctamente"
        });
      } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({
          success: false,
          message: error instanceof Error ? error.message : "Error al eliminar el usuario"
        });
      }
    });

    app.get("/api/videos", requireAuth, async (req: Request, res: Response) => {
      try {
        const user = req.user!;
        let videoQuery;

        if (user.role === 'admin') {
          // Admin sees all videos
          videoQuery = db.select({
            id: videos.id,
            projectId: videos.projectId,
            title: videos.title,
            description: videos.description,
            status: videos.status,
            videoUrl: videos.videoUrl,
            thumbnailUrl: videos.thumbnailUrl,
            youtubeUrl: videos.youtubeUrl,
            optimizedTitle: videos.optimizedTitle,
            optimizedDescription: videos.optimizedDescription,
            tags: videos.tags,
            seriesNumber: videos.seriesNumber,
            currentReviewerId: videos.currentReviewerId,
            reviewerName: users.fullName,
            reviewerUsername: users.username,
            lastReviewedAt: videos.lastReviewedAt,
            lastReviewComments: videos.lastReviewComments,
            metadata: videos.metadata,
            createdById: videos.createdById,
            createdAt: videos.createdAt,
            updatedAt: videos.updatedAt,
            publishedAt: videos.publishedAt,
          })
            .from(videos)
            .leftJoin(users, eq(videos.currentReviewerId, users.id));
        } else {
          // Regular users only see videos from their assigned projects
          videoQuery = db.select({
            id: videos.id,
            projectId: videos.projectId,
            title: videos.title,
            description: videos.description,
            status: videos.status,
            videoUrl: videos.videoUrl,
            thumbnailUrl: videos.thumbnailUrl,
            youtubeUrl: videos.youtubeUrl,
            optimizedTitle: videos.optimizedTitle,
            optimizedDescription: videos.optimizedDescription,
            tags: videos.tags,
            seriesNumber: videos.seriesNumber,
            currentReviewerId: videos.currentReviewerId,
            reviewerName: users.fullName,
            reviewerUsername: users.username,
            lastReviewedAt: videos.lastReviewedAt,
            lastReviewComments: videos.lastReviewComments,
            metadata: videos.metadata,
            createdById: videos.createdById,
            createdAt: videos.createdAt,
            updatedAt: videos.updatedAt,
            publishedAt: videos.publishedAt,
          })
            .from(videos)
            .innerJoin(projectAccess, eq(videos.projectId, projectAccess.projectId))
            .leftJoin(users, eq(videos.currentReviewerId, users.id))
            .where(eq(projectAccess.userId, user.id));
        }

        const result = await videoQuery.orderBy(desc(videos.updatedAt));

        // Agregar logs para debugging
        console.log("Videos fetched:", result.map(video => ({
          id: video.id,
          status: video.status,
          metadata: video.metadata
        })));

        res.json(result);
      } catch (error) {
        console.error("Error fetching all videos:", error);
        res.status(500).json({
          success: false,
          message: "Error al obtener los videos"
        });
      }
    });
    // Projects routes
    app.get("/api/projects", requireAuth, async (req: Request, res: Response) => {
      try {
        let result;
        const user = req.user!;

        if (user.role === 'admin') {
          // Admin sees all projects
          result = await db.select().from(projects);
        } else {
          // Regular users only see their assigned projects
          result = await db
            .select({
              id: projects.id,
              name: projects.name,
              prefix: projects.prefix,
              current_number: projects.current_number,
              description: projects.description,
              createdById: projects.createdById,
              created_at: projects.created_at,
              updated_at: projects.updated_at
            })
            .from(projects)
            .innerJoin(
              projectAccess,
              and(
                eq(projectAccess.projectId, projects.id),
                eq(projectAccess.userId, user.id)
              )
            );
        }

        res.json({
          success: true,
          data: result,
          message: "Proyectos obtenidos correctamente"
        });
      } catch (error) {
        console.error("Error fetching projects:", error);
        res.status(500).json({
          success: false,
          message: "Error al obtener los proyectos"
        });
      }
    });

    app.post("/api/projects", requireAuth, async (req: Request, res: Response) => {
      const { name, prefix, description } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "El nombre del proyecto es requerido"
        });
      }

      try {
        const projectData: InsertProject = {
          name,
          prefix: prefix || null,
          description: description || null,
          createdById: req.user!.id,
          current_number: 0
        };

        const [result] = await db.insert(projects)
          .values(projectData)
          .returning();

        console.log("Created project:", result);

        res.json({
          success: true,
          data: result,
          message: "Proyecto creado correctamente"
        });
      } catch (error) {
        console.error("Error creating project:", error);
        res.status(500).json({
          success: false,
          message: "Error al crear el proyecto"
        });
      }
    });

    app.put("/api/projects/:id", requireAuth, async (req: Request, res: Response) => {
      const { id } = req.params;
      const { name, description } = req.body;
      try {
        const [result] = await db.update(projects)
          .set({
            name,
            description,
          })
          .where(eq(projects.id, parseInt(id)))
          .returning();

        if (!result) {
          return res.status(404).json({
            success: false,
            message: "Proyecto no encontrado"
          });
        }

        res.json({
          success: true,
          data: result,
          message: "Proyecto actualizado correctamente"
        });
      } catch (error) {
        console.error("Error updating project:", error);
        res.status(500).json({
          success: false,
          message: "Error al actualizar el proyecto"
        });
      }
    });

    app.delete("/api/projects/:id", requireAuth, async (req: Request, res: Response) => {
      const { id } = req.params;

      // Verificar si el usuario es administrador
      if (req.user!.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: "Solo los administradores pueden eliminar proyectos"
        });
      }

      try {
        const [result] = await db.delete(projects)
          .where(eq(projects.id, parseInt(id)))
          .returning();

        if (!result) {
          return res.status(404).json({
            success: false,
            message: "Proyecto no encontrado"
          });
        }

        res.json({
          success: true,
          message: "Proyecto eliminado correctamente"
        });
      } catch (error) {
        console.error("Error deleting project:", error);
        res.status(500).json({
          success: false,
          message: "Error al eliminar el proyecto"
        });
      }
    });

    // Videos routes
    app.get("/api/projects/:projectId/videos", requireAuth, async (req: Request, res: Response) => {
      const projectId = parseInt(req.params.projectId);
      try {
        const result = await db.select()
          .from(videos)
          .where(eq(videos.projectId, projectId))
          .orderBy(desc(videos.updatedAt));

        res.json(result);
      } catch (error) {
        console.error("Error fetching videos:", error);
        res.status(500).json({
          success: false,
          message: "Error al obtener los videos"
        });
      }
    });

    app.post("/api/projects/:projectId/videos", requireAuth, async (req: Request, res: Response) => {
      const projectId = parseInt(req.params.projectId);
      const { title, description } = req.body;
      try {
        // Use transaction to ensure atomic operations
        const [result] = await db.transaction(async (tx) => {
          // Get project details
          const [project] = await tx.select()
            .from(projects)
            .where(eq(projects.id, projectId))
            .limit(1);

          if (!project) {
            throw new Error("Proyecto no encontrado");
          }

          // Generate series number
          const newNumber = (project.current_number || 0) + 1;
          const seriesNumber = project.prefix ?
            `${project.prefix}-${String(newNumber).padStart(4, '0')}` :
            String(newNumber).padStart(4, '0');

          // Update project's current number
          await tx.update(projects)
            .set({ current_number: newNumber })
            .where(eq(projects.id, projectId));

          // Create video
          const videoData: InsertVideo = {
            projectId,
            title,
            description: description || null,
            status: "pending",
            createdById: req.user!.id,
            createdAt: new Date(),
            updatedAt: new Date(),
            seriesNumber
          };

          const [video] = await tx.insert(videos)
            .values(videoData)
            .returning();

          return [video];
        });

        res.json(result);
      } catch (error) {
        console.error("Error creating video:", error);
        res.status(500).json({
          success: false,
          message: error instanceof Error ? error.message : "Error al crear el video"
        });
      }
    });

    app.patch("/api/videos/:videoId", requireAuth, async (req: Request, res: Response) => {
      const videoId = parseInt(req.params.videoId);
      const updates = req.body;

      try {
        // Obtener el video actual para preservar los datos existentes
        const [currentVideo] = await db.select()
          .from(videos)
          .where(eq(videos.id, videoId))
          .limit(1);

        if (!currentVideo) {
          return res.status(404).json({
            success: false,
            message: "Video no encontrado"
          });
        }

        // Preparar la actualización de metadata
        let updatedMetadata = currentVideo.metadata || {};
        if (updates.metadata) {
          updatedMetadata = {
            ...updatedMetadata,
            ...updates.metadata
          };
        }

        // Actualizar el video con la metadata combinada
        const [result] = await db.update(videos)
          .set({
            ...updates,
            metadata: updatedMetadata,
            updatedAt: new Date()
          })
          .where(eq(videos.id, videoId))
          .returning();

        console.log("Video actualizado con metadata:", result.metadata);

        res.json({
          success: true,
          data: result,
          message: "Video actualizado correctamente"
        });
      } catch (error) {
        console.error("Error updating video:", error);
        res.status(500).json({
          success: false,
          message: "Error al actualizar el video"
        });
      }
    });

    app.patch("/api/projects/:projectId/videos/:videoId", requireAuth, async (req: Request, res: Response) => {
      const projectId = parseInt(req.params.projectId);
      const videoId = parseInt(req.params.videoId);
      const updates = req.body;

      try {
        // Verify the video exists and belongs to the project
        const existingVideo = await db.select()
          .from(videos)
          .where(
            and(
              eq(videos.id, videoId),
              eq(videos.projectId, projectId)
            )
          )
          .limit(1);

        if (!existingVideo.length) {
          return res.status(404).json({
            success: false,
            message: "Video no encontrado"
          });
        }

        // Update the video with the provided data
        const [result] = await db.update(videos)
          .set({
            ...updates,
            updatedAt: new Date()
          })
          .where(
            and(
              eq(videos.id, videoId),
              eq(videos.projectId, projectId)
            )
          )
          .returning();

        res.json(result);
      } catch (error) {
        console.error("Error updating video:", error);
        res.status(500).json({
          success: false,
          message: "Error al actualizar el video"
        });
      }
    });

    app.delete("/api/projects/:projectId/videos/:videoId", requireAuth, async (req: Request, res: Response) => {
      const projectId = parseInt(req.params.projectId);
      const videoId = parseInt(req.params.videoId);

      // Verificar si el usuario es administrador
      if (req.user!.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: "Solo los administradores pueden eliminar videos"
        });
      }

      try {
        const [result] = await db.delete(videos)
          .where(
            and(
              eq(videos.id, videoId),
              eq(videos.projectId, projectId)
            )
          )
          .returning();

        if (!result) {
          return res.status(404).json({
            success: false,
            message: "Video no encontrado"
          });
        }

        res.json({
          success: true,
          message: "Video eliminado correctamente"
        });
      } catch (error) {
        console.error("Error deleting video:", error);
        res.status(500).json({
          success: false,
          message: "Error al eliminar el video"
        });
      }
    });

    app.delete("/api/videos/:videoId", requireAuth, async (req: Request, res: Response) => {
      const videoId = parseInt(req.params.videoId);

      // Verificar si el usuario es administrador
      if (req.user!.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: "Solo los administradores pueden eliminar videos"
        });
      }

      try {
        const [result] = await db.delete(videos)
          .where(eq(videos.id, videoId))
          .returning();

        if (!result) {
          return res.status(404).json({
            success: false,
            message: "Video no encontrado"
          });
        }

        res.json({
          success: true,
          message: "Video eliminado correctamente"
        });
      } catch (error) {
        console.error("Error deleting video:", error);
        res.status(500).json({
          success: false,
          message: "Error al eliminar el video"
        });
      }
    });


    // Users routes
    app.post("/api/users", requireAuth, async (req: Request, res: Response) => {
      try {
        const { username, password, email, fullName, phone, bio, role, projectIds } = req.body;
        console.log("Creando nuevo usuario con datos:", {
          username,
          email,
          fullName,
          role,
          projectIds
        });

        // Verificar si el usuario ya existe
        const existingUser = await db.select()
          .from(users)
          .where(eq(users.username, username))
          .limit(1);

        if (existingUser.length > 0) {
          return res.status(400).json({
            success: false,
            message: "El nombre de usuario ya está en uso"
          });
        }

        // Hash de la contraseña
        const hashedPassword = await hashPassword(password);

        // Crear nuevo usuario
        const [newUser] = await db.transaction(async (tx) => {
          console.log("Iniciando transacción para crear usuario");

          // Insertar usuario
          const [user] = await tx.insert(users)
            .values({
              username,
              password: hashedPassword,
              email,
              fullName,
              phone,
              bio,
              role,
              createdAt: new Date(),
              updatedAt: new Date()
            })
            .returning();

          console.log("Usuario creado:", user.id);

          // Si hay projectIds, crear las relaciones
          if (projectIds && projectIds.length > 0) {
            console.log("Asignando proyectos al usuario:", projectIds);

            const projectAccessValues = projectIds.map(projectId => ({
              userId: user.id,
              projectId: parseInt(projectId as any)
            }));

            await tx.insert(projectAccess)
              .values(projectAccessValues);

            console.log("Proyectos asignados correctamente");
          }

          // Obtener el usuario con sus relaciones
          const [userWithProjects] = await tx.select({
            id: users.id,
            username: users.username,
            email: users.email,
            fullName: users.fullName,
            phone: users.phone,
            bio: users.bio,
            role: users.role,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
            projectAccess: projectAccess
          })
            .from(users)
            .where(eq(users.id, user.id))
            .leftJoin(projectAccess, eq(users.id, projectAccess.userId));

          console.log("Usuario recuperado con proyectos:", userWithProjects);
          return [userWithProjects];
        });

        // Eliminar el password del objeto de respuesta
        const { password: _, ...userWithoutPassword } = newUser;

        res.status(200).json({
          success: true,
          data: userWithoutPassword,
          message: "Usuario creado correctamente"
        });
      } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({
          success: false,
          message: "Error al crear el usuario"
        });
      }
    });

    app.put("/api/users/:id", requireAuth, async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { fullName, username, email, phone, bio, role, projectIds, password } = req.body;
        console.log("Actualizando usuario:", { id, projectIds });

        // Hash password if provided and user is admin
        let hashedPassword;
        if (password && req.user?.role === 'admin') {
          hashedPassword = await hashPassword(password);
        }

        const [updatedUser] = await db.transaction(async (tx) => {
          // Verificar si el usuario existe
          const [existingUser] = await tx.select()
            .from(users)
            .where(eq(users.id, parseInt(id)))
            .limit(1);

          if (!existingUser) {
            throw new Error("Usuario no encontrado");
          }

          // Actualizar usuario
          const [user] = await tx.update(users)
            .set({
              fullName,
              username,
              email,
              phone,
              bio,
              role,
              ...(hashedPassword && { password: hashedPassword }),
              updatedAt: new Date()
            })
            .where(eq(users.id, parseInt(id)))
            .returning();

          console.log("Usuario actualizado:", user);

          // Eliminar accesos anteriores
          await tx.delete(projectAccess)
            .where(eq(projectAccess.userId, user.id));

          // Si hay projectIds, crear las nuevas relaciones
          if (projectIds && projectIds.length > 0) {
            console.log("Asignando nuevos proyectos:", projectIds);

            const projectAccessValues = projectIds.map(projectId => ({
              userId: user.id,
              projectId: parseInt(projectId)
            }));

            await tx.insert(projectAccess)
              .values(projectAccessValues);
          }

          // Obtener el usuario actualizado con sus proyectos
          const userProjects = await tx.select({
            id: projectAccess.id,
            projectId: projectAccess.projectId,
            userId: projectAccess.userId,
            createdAt: projectAccess.createdAt
          })
            .from(projectAccess)
            .where(eq(projectAccess.userId, user.id));

          console.log("Usuario recuperado con proyectos:", { ...user, projectAccess: userProjects });
          return [{ ...user, projectAccess: userProjects }];
        });

        res.json({
          success: true,
          data: updatedUser,
          message: "Usuario actualizado correctamente"
        });
      } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({
          success: false,
          message: error instanceof Error ? error.message : "Error al actualizar el usuario"
        });
      }
    });

    // Get users list
    app.get("/api/users", requireAuth, async (req: Request, res: Response) => {
      try {
        const usersList = await db
          .select({
            id: users.id,
            username: users.username,
            email: users.email,
            fullName: users.fullName,
            phone: users.phone,
            bio: users.bio,
            role: users.role,
            avatarUrl: users.avatarUrl,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt
          })
          .from(users);

        // Get project access for each user
        const usersWithProjects = await Promise.all(
          usersList.map(async (user) => {
            const projectAccessList = await db
              .select({
                id: projectAccess.id,
                projectId: projectAccess.projectId,
                userId: projectAccess.userId,
                createdAt: projectAccess.createdAt
              })
              .from(projectAccess)
              .where(eq(projectAccess.userId, user.id));

            return {
              ...user,
              projectAccess: projectAccessList
            };
          })
        );

        res.json({
          success: true,
          data: usersWithProjects
        });
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({
          success: false,
          message: "Error al obtener usuarios"
        });
      }
    });

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
          .where(eq(users.id, req.user!.id));

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
    app.post("/api/upload-avatar", requireAuth, upload.single('avatar'), async (req: Request, res: Response) => {
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

    // Video upload endpoint
    app.post("/api/videos/upload", requireAuth, videoUpload.single('file'), async (req: Request, res: Response) => {
      const file = req.file;
      const { type, videoId } = req.body;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: "No se subió ningún archivo"
        });
      }

      try {
        let processedFilePath = file.path;
        const fileExt = path.extname(file.path);
        const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
        const objectKey = `videos/${type}/${uniqueFilename}`; // Ruta simple y organizada

        // Si es una miniatura, procesarla con sharp
        if (type === 'thumbnail') {
          const processedPath = file.path.replace(fileExt, '_processed' + fileExt);
          await sharp(file.path)
            .resize(1280, 720)
            .toFile(processedPath);

          // Subir la miniatura procesada al bucket
          const { ok, error } = await client.uploadFromFilename(objectKey, processedPath);
          if (!ok) {
            throw new Error(`Error al subir la miniatura: ${error}`);
          }

          // Limpiar archivos temporales
          fs.unlinkSync(file.path);
          fs.unlinkSync(processedPath);
        } else {
          // Subir el video directamente
          const { ok, error } = await client.uploadFromFilename(objectKey, file.path);
          if (!ok) {
            throw new Error(`Error al subir el video: ${error}`);
          }

          // Limpiar archivo temporal
          fs.unlinkSync(file.path);
        }

        // Construir la URL del archivo
        const fileUrl = `/api/videos/stream/${type}/${uniqueFilename}`;

        // Actualizar la URL en la base de datos si se proporciona videoId
        if (videoId) {
          const urlField = type === 'video' ? 'videoUrl' : 'thumbnailUrl';
          await db.update(videos)
            .set({ [urlField]: fileUrl })
            .where(eq(videos.id, parseInt(videoId)));
        }

        res.json({
          success: true,
          url: fileUrl,
          message: `${type === 'video' ? 'Video' : 'Miniatura'} subido correctamente`
        });
      } catch (error: any) {
        console.error("Error processing file:", error);
        if (file && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        res.status(500).json({
          success: false,
          message: error.message || `Error al procesar el ${type === 'video' ? 'video' : 'miniatura'}`
        });
      }
    });

    // Video streaming endpoint
    app.get("/api/videos/stream/:type/:filename", requireAuth, async (req: Request, res: Response) => {
      const { type, filename } = req.params;
      const objectKey = `videos/${type}/${filename}`;

      try {
        // Configurar headers de caché para miniaturas
        if (type === 'thumbnail') {
          res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache por 1 año
          res.setHeader('Content-Type', 'image/jpeg');
        } else {
          res.setHeader('Content-Type', 'video/mp4');
        }

        const stream = await client.downloadAsStream(objectKey);

        if (!stream) {
          console.error("Error downloading file: stream is null");
          return res.status(404).json({
            success: false,
            message: "Archivo no encontrado"
          });
        }

        // Manejar errores en el stream
        stream.on('error', (err) => {
          console.error("Stream error:", err);
          if (!res.headersSent) {
            res.status(500).json({
              success: false,
              message: "Error al transmitir el archivo"
            });
          }
        });

        // Pipe el stream a la respuesta
        stream.pipe(res);
      } catch (error: any) {
        console.error("Error streaming file:", error);
        return res.status(500).json({
          success: false,
          message: error.message || "Error al obtener el archivo"
        });
      }
    });

    // Initialize backup service
    const backupService = new BackupService();

    // Backup routes
    app.post("/api/projects/:id/backup", requireAuth, async (req: Request, res: Response) => {
      try {
        const projectId = parseInt(req.params.id);
        const metadata = await backupService.createBackup(projectId);

        res.json({
          success: true,
          data: metadata,
          message: "Backup created successfully"
        });
      } catch (error) {
        console.error("Error creating backup:", error);
        res.status(500).json({
          success: false,
          message: error instanceof Error ? error.message : "Error creating backup"
        });
      }
    });

    app.get("/api/projects/:id/backups", requireAuth, async (req: Request, res: Response) => {
      try {
        const projectId = parseInt(req.params.id);
        const backups = await backupService.listBackups(projectId);

        res.json({
          success: true,
          data: backups,
          message: "Backups retrieved successfully"
        });
      } catch (error) {
        console.error("Error listing backups:", error);
        res.status(500).json({
          success: false,
          message: error instanceof Error ? error.message : "Error listing backups"
        });
      }
    });

    app.post("/api/projects/:id/restore", requireAuth, async (req: Request, res: Response) => {
      try {
        const projectId = parseInt(req.params.id);
        const { timestamp } = req.body;

        if (!timestamp) {
          return res.status(400).json({
            success: false,
            message: "Timestamp is required for restoration"
          });
        }

        await backupService.restoreFromBackup(projectId, timestamp);

        res.json({
          success: true,
          message: "Project restored successfully"
        });
      } catch (error) {
        console.error("Error restoring backup:", error);
        res.status(500).json({
          success: false,
          message: error instanceof Error ? error.message : "Error restoring backup"
        });
      }
    });

    setupAuth(app); // Authentication setup moved here
    console.log("Authentication setup complete");
    console.log("Routes registered successfully");
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

    // Ruta para subir miniaturas
    app.post("/api/upload/thumbnail", requireAuth, videoUpload.single('thumbnail'), async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: "No se proporcionó ningún archivo"
          });
        }

        const fileName = `thumbnail-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(req.file.originalname)}`;

        // Subir al object storage usando la API correcta
        await client.putObject(
          BUCKET_ID,
          fileName,
          req.file.buffer || fs.readFileSync(req.file.path),
          {
            accessControl: 'public-read',
          }
        );

        // Si el archivo se guardó temporalmente en el disco, eliminarlo
        if (req.file.path) {
          fs.unlinkSync(req.file.path);
        }

        // Obtener la URL pública
        const fileUrl = await client.getSignedUrl(BUCKET_ID, fileName, { expiresIn: 3600 * 24 * 365 }); // URL válida por 1 año

        res.json({
          success: true,
          url: fileUrl,
          message: "Miniatura subida correctamente"
        });
      } catch (error) {
        console.error("Error uploading thumbnail:", error);
        res.status(500).json({
          success: false,
          message: "Error al subir la miniatura"
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