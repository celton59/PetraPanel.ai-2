import type { Request, Response } from "express";
import { z } from "zod";
import { users, projectAccess } from "@db/schema";
import { eq, getTableColumns } from "drizzle-orm";
import { db } from "@db";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

const createUserSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(6).max(30),
  role: z.enum(["admin", "reviewer", "optimizer", "youtuber", "content_reviewer", "media_reviewer"]),
  fullName: z.string().min(3).max(30),
  phone: z.string().min(9).optional(),
  bio: z.string().min(3).max(30).optional(),
  projectIds: z.array(z.number()).min(1),
});

const updateUserSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  password: z.string().min(6).max(30).optional(),
  fullName: z.string().min(3).max(30).optional(),
  phone: z.string().min(9).optional(),
  bio: z.string().min(3).max(30).optional(),
  projectIds: z.array(z.number()).min(1).optional(),
  email: z.string().email().optional(),
  role: z
    .enum(["admin", "reviewer", "optimizer", "youtuber", "content_reviewer", "media_reviewer"])
    .optional(),
});

type CreateUserSchema = z.infer<typeof createUserSchema>;
type UpdateUserSchema = z.infer<typeof updateUserSchema>;

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function createUser(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para realizar esta acción",
      });
    }

    const body = req.body as CreateUserSchema;

    // Validar body con schema
    const validationResult = createUserSchema.safeParse(body);
    if (!validationResult.success) {
      return res
        .status(400)
        .json({ success: false, message: validationResult.error.message });
    }

    const {
      username,
      password,
      email,
      fullName,
      phone,
      bio,
      role,
      projectIds,
    } = body;
    console.log("Creando nuevo usuario con datos:", body);

    // Verificar si el usuario ya existe
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: "El nombre de usuario ya está en uso",
      });
    }

    // Hash de la contraseña
    const hashedPassword = await hashPassword(password);

    // Crear nuevo usuario
    const newUser = await db.transaction(async (tx) => {
      console.log("Iniciando transacción para crear usuario");

      // Insertar usuario
      const [user] = await tx
        .insert(users)
        .values({
          username,
          password: hashedPassword,
          email,
          fullName,
          bio,
          createdAt: new Date(),
          updatedAt: new Date(),
          phone,
          role,
        })
        .returning();

      console.log("Usuario creado:", user.id);

      // Si hay projectIds, crear las relaciones
      if (projectIds && projectIds.length > 0) {
        console.log("Asignando proyectos al usuario:", projectIds);

        const projectAccessValues = projectIds.map((projectId) => ({
          userId: user.id,
          projectId,
        }));

        await tx.insert(projectAccess).values(projectAccessValues);

        console.log("Proyectos asignados correctamente");
      }

      // Obtener el usuario con sus relaciones
      const userWithProjects = await tx
        .select({
          ...getTableColumns(users),
          projectAccess: projectAccess,
        })
        .from(users)
        .where(eq(users.id, user.id))
        .leftJoin(projectAccess, eq(users.id, projectAccess.userId))
        .execute();

      console.log("Usuario recuperado con proyectos:", userWithProjects);
      return [userWithProjects];
    });

    // Eliminar el password del objeto de respuesta
    if ("password" in newUser) delete newUser.password;

    return res.status(200).json({
      success: true,
      data: newUser,
      message: "Usuario creado correctamente",
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({
      success: false,
      message: "Error al crear el usuario",
    });
  }
}

export async function updateUser(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para realizar esta acción",
      });
    }

    const body = req.body as UpdateUserSchema;
    const { id } = req.params;

    // Validar body con schema
    const validationResult = updateUserSchema.safeParse(body);
    if (!validationResult.success) {
      return res
        .status(400)
        .json({ success: false, message: validationResult.error.message });
    }

    const {
      fullName,
      username,
      phone,
      bio,
      projectIds,
      password,
      email,
      role,
    } = body;
    console.log("Actualizando usuario:", { id, projectIds });

    // Hash password if provided and user is admin
    const hashedPassword = password ? await hashPassword(password) : undefined;

    const [updatedUser] = await db.transaction(async (tx) => {
      // Verificar si el usuario existe
      const [existingUser] = await tx
        .select()
        .from(users)
        .where(eq(users.id, parseInt(id)))
        .limit(1);

      if (!existingUser) {
        throw new Error("Usuario no encontrado");
      }

      // Actualizar usuario
      const [user] = await tx
        .update(users)
        .set({
          fullName,
          username,
          email,
          phone,
          bio,
          role,
          ...(hashedPassword && { password: hashedPassword }),
          updatedAt: new Date(),
        })
        .where(eq(users.id, parseInt(id)))
        .returning();

      console.log("Usuario actualizado:", user);

      // Eliminar accesos anteriores
      await tx.delete(projectAccess).where(eq(projectAccess.userId, user.id));

      // Si hay projectIds, crear las nuevas relaciones
      if (projectIds && projectIds.length > 0) {
        console.log("Asignando nuevos proyectos:", projectIds);

        const projectAccessValues = projectIds.map((projectId) => ({
          userId: user.id,
          projectId,
        }));

        await tx.insert(projectAccess).values(projectAccessValues);
      }

      // Obtener el usuario actualizado con sus proyectos
      const userProjects = await tx
        .select({
          id: projectAccess.id,
          projectId: projectAccess.projectId,
          userId: projectAccess.userId,
          createdAt: projectAccess.createdAt,
        })
        .from(projectAccess)
        .where(eq(projectAccess.userId, user.id));

      console.log("Usuario recuperado con proyectos:", {
        ...user,
        projectAccess: userProjects,
      });
      return [{ ...user, projectAccess: userProjects }];
    });

    return res.json({
      success: true,
      data: updatedUser,
      message: "Usuario actualizado correctamente",
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Error al actualizar el usuario",
    });
  }
}

export async function getUsers(req: Request, res: Response): Promise<Response> {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para acceder a esta función",
      });
    }

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
        updatedAt: users.updatedAt,
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
            createdAt: projectAccess.createdAt,
          })
          .from(projectAccess)
          .where(eq(projectAccess.userId, user.id));

        return {
          ...user,
          projectAccess: projectAccessList,
        };
      }),
    );

    return res.json({
      success: true,
      data: usersWithProjects,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener usuarios",
    });
  }
}

export async function deleteUser(
  req: Request,
  res: Response,
): Promise<Response> {

  if (req.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "No tienes permisos para acceder a esta función",
    });
  }
  
  const { id } = req.params;

  try {

    // Verificar que el usuario existe
    const [userToDelete] = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(id)))
      .limit(1);

    if (!userToDelete) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    // Eliminar primero las relaciones en projectAccess
    await db
      .delete(projectAccess)
      .where(eq(projectAccess.userId, parseInt(id)));

    // Eliminar el usuario
    const [deletedUser] = await db
      .delete(users)
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

    return res.json({
      success: true,
      message: "Usuario eliminado correctamente",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Error al eliminar el usuario",
    });
  }
}

const UserController = {
  createUser,
  updateUser,
  getUsers,
  deleteUser
};

export default UserController;
