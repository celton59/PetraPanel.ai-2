
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";
import { migrate } from "drizzle-orm/neon-http/migrator";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function main() {
  try {
    await migrate(db, { migrationsFolder: "migrations" });
    console.log("Migration completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error performing migration:", error);
    process.exit(1);
  }
}

main();
