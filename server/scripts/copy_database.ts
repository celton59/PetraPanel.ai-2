
import { BackupService } from "../services/backup";
import { db } from "@db";
import { projects } from "@db/schema";

async function copyDatabase() {
  const backupService = new BackupService();
  
  // Obtener todos los projectos
  const allProjects = await db.select().from(projects);
  
  // Crear backup de cada proyecto
  for (const project of allProjects) {
    try {
      await backupService.createBackup(project.id);
      console.log(`Backup creado para proyecto ${project.id}`);
    } catch (error) {
      console.error(`Error al crear backup del proyecto ${project.id}:`, error);
    }
  }
  
  console.log('Todos los backups han sido creados');
}

copyDatabase().catch(console.error);
