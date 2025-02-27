// import { Client } from '@replit/object-storage';
// import { db } from "@db";
// import { projects, videos, projectAccess, users } from "@db/schema";
// import { eq } from "drizzle-orm";
// import type { Project, Video, ProjectAccess } from "@db/schema";

// interface BackupMetadata {
//   timestamp: string;
//   projectId: number;
//   version: string;
//   contentHash: string;
//   size: number;
// }

// interface ProjectBackup {
//   project: Project;
//   videos: Video[];
//   access: ProjectAccess[];
//   metadata: BackupMetadata;
// }

// export class BackupService {
//   private client: Client;
//   private readonly BUCKET_ID = 'replit-objstore-cf499cd2-8666-4219-bb8b-6e5a039bf18b';
//   private readonly BACKUP_PREFIX = 'backups/projects';

//   constructor() {
//     this.client = new Client();
//   }

//   private generateBackupKey(projectId: number, timestamp: string): string {
//     return `${this.BACKUP_PREFIX}/${projectId}/${timestamp}.json`;
//   }

//   private async generateContentHash(data: string): Promise<string> {
//     const encoder = new TextEncoder();
//     const buffer = encoder.encode(data);
//     const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
//     const hashArray = Array.from(new Uint8Array(hashBuffer));
//     return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
//   }

//   async createBackup(projectId: number): Promise<BackupMetadata> {
//     try {
//       // Fetch project data
//       const [project] = await db
//         .select()
//         .from(projects)
//         .where(eq(projects.id, projectId))
//         .limit(1);

//       if (!project) {
//         throw new Error(`Project with ID ${projectId} not found`);
//       }

//       // Fetch related videos
//       const projectVideos = await db
//         .select()
//         .from(videos)
//         .where(eq(videos.projectId, projectId));

//       // Fetch project access records
//       const projectAccessRecords = await db
//         .select()
//         .from(projectAccess)
//         .where(eq(projectAccess.projectId, projectId));

//       const timestamp = new Date().toISOString();
//       const backupData: ProjectBackup = {
//         project,
//         videos: projectVideos,
//         access: projectAccessRecords,
//         metadata: {
//           timestamp,
//           projectId,
//           version: '1.0',
//           contentHash: '',
//           size: 0
//         }
//       };

//       // Generate content hash
//       const jsonData = JSON.stringify(backupData);
//       backupData.metadata.contentHash = await this.generateContentHash(jsonData);
//       backupData.metadata.size = new TextEncoder().encode(jsonData).length;

//       // Upload to object storage
//       const backupKey = this.generateBackupKey(projectId, timestamp);
//       const { ok, error } = await this.client.uploadJson(backupKey, backupData);

//       if (!ok) {
//         throw new Error(`Failed to upload backup: ${error}`);
//       }

//       return backupData.metadata;
//     } catch (error) {
//       console.error('Error creating backup:', error);
//       throw error;
//     }
//   }

//   async listBackups(projectId: number): Promise<BackupMetadata[]> {
//     try {
//       const prefix = `${this.BACKUP_PREFIX}/${projectId}/`;
//       const { objects } = await this.client.list({ prefix });

//       if (!objects) {
//         return [];
//       }

//       const backups: BackupMetadata[] = [];
//       for (const object of objects) {
//         const { json } = await this.client.downloadJson(object.key);
//         if (json && 'metadata' in json) {
//           backups.push((json as ProjectBackup).metadata);
//         }
//       }

//       return backups.sort((a, b) => 
//         new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
//       );
//     } catch (error) {
//       console.error('Error listing backups:', error);
//       throw error;
//     }
//   }

//   async restoreFromBackup(projectId: number, timestamp: string): Promise<void> {
//     try {
//       const backupKey = this.generateBackupKey(projectId, timestamp);
//       const { json, error } = await this.client.downloadJson(backupKey);

//       if (error || !json) {
//         throw new Error(`Failed to download backup: ${error || 'No data found'}`);
//       }

//       const backup = json as ProjectBackup;

//       // Restore project data using a transaction
//       await db.transaction(async (tx) => {
//         // Update project
//         await tx
//           .update(projects)
//           .set({ ...backup.project, updatedAt: new Date() })
//           .where(eq(projects.id, projectId));

//         // Delete existing videos
//         await tx
//           .delete(videos)
//           .where(eq(videos.projectId, projectId));

//         // Restore videos
//         if (backup.videos.length > 0) {
//           await tx
//             .insert(videos)
//             .values(backup.videos.map(video => ({
//               ...video,
//               updatedAt: new Date()
//             })));
//         }

//         // Delete existing access records
//         await tx
//           .delete(projectAccess)
//           .where(eq(projectAccess.projectId, projectId));

//         // Restore access records
//         if (backup.access.length > 0) {
//           await tx
//             .insert(projectAccess)
//             .values(backup.access);
//         }
//       });
//     } catch (error) {
//       console.error('Error restoring backup:', error);
//       throw error;
//     }
//   }
// }
