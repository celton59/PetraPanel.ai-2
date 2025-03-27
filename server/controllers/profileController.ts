import type { NextFunction, Request, Response } from "express";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import { db } from "@db";
import { type Express } from "express";
import { changePasswordSchema, updateProfileSchema, validateBody } from "server/services/validation";
import { passwordUtils } from "server/auth";
import sharp from "sharp";
import multer from "multer";
import { generateS3Key, PutObjectCommand, s3 } from "../services/s3";

// Configurar multer para procesar solo la subida de archivos en memoria
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 * 10 } // 10MB límite
}).single('avatar');

export async function addAvatar(req: Request, res: Response): Promise<Response> {
  try {
    // Usar multer para procesar el archivo en memoria
    await new Promise<void>((resolve, reject) => {
      avatarUpload(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No se subió ningún archivo"
      });
    }

    // Procesar la imagen con sharp
    const processedImageBuffer = await sharp(file.buffer)
      .resize(256, 256)
      .jpeg({ quality: 90 })
      .toBuffer();

    // Generar una clave única para S3
    const objectKey = generateS3Key(file.originalname, 'avatars');

    // Subir la imagen procesada a S3
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: objectKey,
      Body: processedImageBuffer,
      ContentType: 'image/jpeg'
    });

    await s3.send(command);

    // Construir la URL pública del avatar
    const avatarUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${objectKey}`;

    // Actualizar la URL del avatar en la base de datos
    const result = await db
      .update(users)
      .set({ 
        avatarUrl,
        updatedAt: new Date()
      })
      .where(eq(users.id, req.user!.id as number))
      .returning();

    if (!result || result.length === 0) {
      throw new Error("Error al actualizar la URL del avatar");
    }

    return res.json({
      success: true,
      data: { avatarUrl },
      message: "Avatar actualizado correctamente"
    });
  } catch (error) {
    console.error("Error processing avatar:", error);
    return res.status(500).json({
      success: false,
      message: "Error al procesar el avatar"
    });
  }
}

export async function getProfile(
  req: Request,
  res: Response,
): Promise<Response> {
  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user!.id!))
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
    // Los datos ya han sido validados por validateBody
    const { currentPassword, newPassword } = req.validatedData;

    try {
      // Verificar contraseña actual
      const user = await db.select()
        .from(users)
        .where(eq(users.id, req.user!.id!))
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

      return res.json({
        success: true,
      message: "Contraseña actualizada correctamente"
    });
  } catch (error) {
    console.error("Error updating password:", error);
    return res.status(500).json({
      success: false,
      message: "Error al actualizar la contraseña"
    });
  }
}

export async function updateProfile(
  req: Request,
  res: Response,
): Promise<Response> {
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
      return res.status(200).json({
        success: true,
        data: profile,
        message: "Perfil actualizado correctamente"
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      return res.status(500).json({
        success: false,
        message: "Error al actualizar el perfil"
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
  app.post("/api/profile/password", requireAuth, validateBody(changePasswordSchema), changePassword);
  app.put("/api/profile", requireAuth, validateBody(updateProfileSchema), updateProfile);
  app.post('/api/profile/avatar', requireAuth, addAvatar);
}