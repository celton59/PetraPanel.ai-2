import { db } from "@db";
import { log } from "../vite";

/**
 * Script para asegurarse de que la columna last_login_at existe en la tabla users
 */
async function ensureLastLoginColumn() {
  try {
    // Utiliza SQL nativo para verificar si la columna existe
    const result = await db.execute(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'last_login_at'
      );
    `);
    
    const columnExists = result.rows?.[0]?.exists === true;
    
    if (!columnExists) {
      log('La columna last_login_at no existe, creándola...', 'ensure-column');
      
      // Si la columna no existe, la añadimos
      await db.execute(`
        ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP;
      `);
      
      log('Columna last_login_at añadida con éxito', 'ensure-column');
    } else {
      log('La columna last_login_at ya existe', 'ensure-column');
    }
    
    return true;
  } catch (error) {
    console.error('Error al verificar o crear la columna last_login_at:', error);
    return false;
  }
}

// Auto-ejecutar al importar
ensureLastLoginColumn()
  .then(success => {
    if (success) {
      log('Verificación de columna last_login_at completada', 'ensure-column');
    } else {
      log('Error al verificar la columna last_login_at', 'ensure-column');
    }
  })
  .catch(err => {
    console.error('Error inesperado:', err);
  });

export default ensureLastLoginColumn;