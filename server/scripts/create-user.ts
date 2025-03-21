// Script para crear un usuario con el hash de contraseña adecuado
import { db } from '@db';
import { users } from '@db/schema';
import pg from 'pg';
import { securityUtils } from 'server/services/security';

async function createUser() {
  // Datos del usuario a crear
  const username = 'youtuber';
  const password = '1234';
  const role = 'youtuber'; // Rol youtuber para acceso rápido

  try {

    await db.insert(users).values({
      password: await securityUtils.hashPassword(password),
      username,
      role,
      fullName: 'Creator Demo',
      email: 'creator@demo.com'
    })

  } catch (error) {
    console.error('Error:', error);
  }
}

// Ejecutar la función
createUser();