// Script para crear un usuario con el hash de contraseña adecuado
import { db } from '@db';
import { users } from '@db/schema';
import pg from 'pg';
import { securityUtils } from 'server/services/security';

async function createUser() {
  // Datos del usuario a crear
  const username = 'hola';
  const password = '1234';
  const role = 'admin'; // Para que tenga acceso completo
  
  try {
    
    await db.insert(users).values({
      password: await securityUtils.hashPassword(password),
      username,
      role
    })
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Ejecutar la función
createUser();