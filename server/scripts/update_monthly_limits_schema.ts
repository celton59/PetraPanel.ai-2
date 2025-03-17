import { db } from "@db";
import { sql } from "drizzle-orm";

async function updateMonthlyLimitsSchema() {
  try {
    console.log('Updating monthly_video_limits table...');
    
    // Agregar columnas a monthly_video_limits
    await db.execute(sql`
      ALTER TABLE monthly_video_limits 
      ADD COLUMN IF NOT EXISTS is_prorated BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS override_reason TEXT;
    `);

    // Crear tabla monthly_limit_changes si no existe
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS monthly_limit_changes (
        id SERIAL PRIMARY KEY,
        limit_id INTEGER NOT NULL REFERENCES monthly_video_limits(id),
        previous_limit INTEGER NOT NULL,
        new_limit INTEGER NOT NULL,
        reason TEXT,
        changed_by INTEGER NOT NULL REFERENCES users(id),
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Successfully updated monthly limits schema');
  } catch (error) {
    console.error('Error updating monthly limits schema:', error);
    throw error;
  }
}

updateMonthlyLimitsSchema()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
