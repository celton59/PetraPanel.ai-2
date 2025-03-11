import { users } from '@db/schema';
import { securityUtils } from '../services/security';
import { eq } from 'drizzle-orm';
import { db } from '@db';

async function resetPassword() {
  try {
    const username = 'hola';
    const newPassword = '1234';
    
    // Buscar el usuario
    const user = await db.select().from(users).where(eq(users.username, username)).limit(1);
    
    if (user.length === 0) {
      console.log(`Usuario ${username} no encontrado.`);
      return;
    }
    
    // Generar hash de la nueva contraseña
    const hashedPassword = await securityUtils.hashPassword(newPassword);
    
    // Actualizar contraseña
    await db.update(users)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, user[0].id));
    
    console.log(`Contraseña actualizada para el usuario ${username}`);
  } catch (error) {
    console.error('Error al resetear la contraseña:', error);
  }
}

resetPassword();