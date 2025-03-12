// Script para crear un usuario con el hash de contraseña adecuado
import crypto from 'crypto';
import pg from 'pg';
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

async function createUser() {
  // Datos del usuario a crear - Personalizar según sea necesario
  const username = 'mediareviewer';
  const password = 'Petra123!';
  const role = 'media_reviewer'; // Opciones: admin, reviewer, content_reviewer, media_reviewer, optimizer, youtuber
  
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
    console.log('Conectado a la base de datos');
    
    // Verificar si el usuario ya existe
    const checkResult = await client.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );
    
    if (checkResult.rows.length > 0) {
      console.log(`El usuario '${username}' ya existe, actualizando contraseña...`);
      
      // Generar el hash de la contraseña
      const hashedPassword = await hashPassword(password);
      
      // Actualizar usuario existente
      await client.query(
        'UPDATE users SET password = $1, role = $2 WHERE username = $3',
        [hashedPassword, role, username]
      );
      
      console.log(`Contraseña actualizada para el usuario '${username}'`);
    } else {
      console.log(`Creando nuevo usuario '${username}'...`);
      
      // Generar el hash de la contraseña
      const hashedPassword = await hashPassword(password);
      
      // Insertar nuevo usuario
      await client.query(
        'INSERT INTO users (username, password, role, full_name) VALUES ($1, $2, $3, $4)',
        [username, hashedPassword, role, 'Usuario de Prueba']
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
    console.log('Desconectado de la base de datos');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Ejecutar la función
createUser();