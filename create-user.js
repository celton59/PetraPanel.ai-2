// Script para crear un usuario con el hash de contraseña adecuado
import crypto from 'crypto';
import pg from 'pg';
import dotenv from 'dotenv';

// Cargar variables de entorno desde .env si existe
dotenv.config();

const { Client } = pg;

// Función para generar hash de la contraseña (misma que usa la aplicación)
// Esta función debe coincidir con passwordUtils.hash en auth.ts
async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    // Generar salt aleatorio
    const salt = crypto.randomBytes(16).toString("hex");
    
    // Usar scrypt para el hash como en la aplicación original
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${derivedKey.toString("hex")}.${salt}`);
    });
  });
}

async function createOrUpdateUser(username, password, role, fullName = 'Usuario de Prueba') {
  try {
    // Obtener y validar DATABASE_URL desde variables de entorno
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL no está definida en las variables de entorno');
    }
    
    // Crear cliente PostgreSQL
    const client = new Client({
      connectionString,
    });
    
    await client.connect();
    console.log(`Procesando usuario '${username}'...`);
    
    // Verificar si el usuario ya existe
    const checkResult = await client.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );
    
    // Generar el hash de la contraseña
    const hashedPassword = await hashPassword(password);
    
    if (checkResult.rows.length > 0) {
      console.log(`El usuario '${username}' ya existe, actualizando contraseña...`);
      
      // Actualizar usuario existente
      await client.query(
        'UPDATE users SET password = $1, role = $2 WHERE username = $3',
        [hashedPassword, role, username]
      );
      
      console.log(`Contraseña actualizada para el usuario '${username}'`);
    } else {
      console.log(`Creando nuevo usuario '${username}'...`);
      
      // Insertar nuevo usuario
      await client.query(
        'INSERT INTO users (username, password, role, full_name) VALUES ($1, $2, $3, $4)',
        [username, hashedPassword, role, fullName]
      );
      
      console.log(`Usuario '${username}' creado con éxito`);
    }
    
    // Verificar que el usuario existe
    const verifyResult = await client.query(
      'SELECT id, username, role FROM users WHERE username = $1',
      [username]
    );
    
    if (verifyResult.rows.length > 0) {
      console.log('Verificación exitosa:', verifyResult.rows[0]);
    } else {
      console.error('Error: Usuario no encontrado después de la creación/actualización');
    }
    
    await client.end();
    console.log(`Procesamiento de '${username}' completado`);
    return true;
    
  } catch (error) {
    console.error(`Error procesando usuario '${username}':`, error);
    return false;
  }
}

async function createUser() {
  // Lista de usuarios a crear o actualizar
  const users = [
    { username: 'hola', password: '1234', role: 'admin', fullName: 'Administrador' },
    { username: 'mediareviewer', password: '1234', role: 'media_reviewer', fullName: 'Revisor de Medios' },
    { username: 'youtuber', password: '1234', role: 'youtuber', fullName: 'Youtuber' },
    { username: 'optimizer', password: '1234', role: 'optimizer', fullName: 'Optimizador' },
    { username: 'reviewer', password: '1234', role: 'reviewer', fullName: 'Revisor General' },
    { username: 'contentreviewer', password: '1234', role: 'content_reviewer', fullName: 'Revisor de Contenido' },
    { username: 'uploader', password: '1234', role: 'uploader', fullName: 'Subidor de Contenido' }
  ];
  
  console.log('Iniciando actualización de usuarios...');
  
  for (const user of users) {
    await createOrUpdateUser(user.username, user.password, user.role, user.fullName);
    console.log('-----------------------------------');
  }
  
  console.log('Proceso completado para todos los usuarios');
}

// Ejecutar la función
createUser();