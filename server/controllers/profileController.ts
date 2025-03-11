import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { users, projectAccess } from "@db/schema";
import { eq, getTableColumns } from "drizzle-orm";
import { db } from "@db";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { type Express } from "express";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}


export async function getProfile(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user!.id as number))
      .limit(1);

    if (!user || user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Perfil no encontrado",
      });
    }

    const { password, ...profile } = user[0];
    return res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener el perfil",
    });
  }
}

export async function changePassword(
  req: Request,
  res: Response,
): Promise<Response> {
  const { currentPassword, newPassword } = req.body;

  try {
    // Verificar contraseña actual
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user!.id!))
      .limit(1);

    if (!user.length) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    const [salt, hash] = user[0].password.split(".");
    const buf = (await scryptAsync(currentPassword, salt, 64)) as Buffer;
    const hashedPassword = `${buf.toString("hex")}.${salt}`;

    if (hashedPassword !== user[0].password) {
      return res.status(400).json({
        success: false,
        message: "Contraseña actual incorrecta",
      });
    }

    // Actualizar con nueva contraseña
    const newHashedPassword = await hashPassword(newPassword);
    await db
      .update(users)
      .set({ password: newHashedPassword })
      .where(eq(users.id, req.user!.id!));

    return res.json({
      success: true,
      message: "Contraseña actualizada correctamente",
    });
  } catch (error) {
    console.error("Error updating password:", error);
    return res.status(500).json({
      success: false,
      message: "Error al actualizar la contraseña",
    });
  }
}

export async function updateProfile(
  req: Request,
  res: Response,
): Promise<Response> {
  const { fullName, username, phone, bio } = req.body;

  try {
    // Validar que los campos requeridos estén presentes
    if (!fullName || !username) {
      return res.status(400).json({
        success: false,
        message: "El nombre completo y el nombre de usuario son requeridos",
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
        message: "El nombre de usuario ya está en uso",
      });
    }

    const result = await db
      .update(users)
      .set({
        fullName,
        username,
        phone: phone || null,
        bio: bio || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, req.user!.id as number))
      .returning();

    if (!result || result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    const { password, ...profile } = result[0];
    return res.status(200).json({
      success: true,
      data: profile,
      message: "Perfil actualizado correctamente",
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({
      success: false,
      message: "Error al actualizar el perfil",
    });
  }
}

export function setUpProfileRoutes(
  requireAuth: (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Response<any, Record<string, any>> | undefined,
  app: Express,
) {
  app.get("/api/profile", requireAuth, getProfile);

  app.post( "/api/profile/password", requireAuth, changePassword);

  app.put("/api/profile", requireAuth, updateProfile );
}
