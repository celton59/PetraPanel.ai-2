import { db } from "@db";
import { sql } from "drizzle-orm";

async function addCompletedAtColumn() {
  try {
    console.log('Adding completed_at column to videos table...');
    
    await db.execute(sql`
      ALTER TABLE videos 
      ADD COLUMN completed_at TIMESTAMP;
    `);

    // Update existing completed videos to set completed_at
    await db.execute(sql`
      UPDATE videos 
      SET completed_at = updated_at 
      WHERE status = 'completed' AND completed_at IS NULL;
    `);

    console.log('Successfully added completed_at column and updated existing records');
  } catch (error) {
    console.error('Error adding completed_at column:', error);
    throw error;
  }
}

addCompletedAtColumn()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
