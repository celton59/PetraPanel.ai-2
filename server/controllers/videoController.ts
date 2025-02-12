import type { Request, Response } from "express";
import { eq, and, desc, getTableColumns, aliasedTable } from "drizzle-orm";
import { videos, users, projects, InsertVideo, User, Video, VideoStatus } from "@db/schema";
import { db } from "@db";
import { z } from "zod";

const reviewer = aliasedTable(users, "reviewer");
const optimizer = aliasedTable(users, "optimizer");
const creator = aliasedTable(users, "creator");

const statusTransitions: Record<User['role'], Record<Video['status'], Video['status'][]>> = {
  optimizer: {
    pending: ["in_progress"],  // Permitir que el optimizador vea y trabaje con videos pending
    in_progress: ["optimize_review"],
    title_corrections: ["optimize_review"],
    optimize_review: ["youtube_ready"],
    upload_review: ["youtube_ready"],
    youtube_ready: ["completed"],
    review: [],
    media_corrections: [],
    completed: []
  },
  reviewer: {
    pending: [],
    in_progress: [],
    title_corrections: ["optimize_review"],
    optimize_review: ["title_corrections", "upload_review", "completed"],
    upload_review: ["optimize_review", "completed"],
    youtube_ready: ["completed"],
    review: [],
    media_corrections: ["upload_review"],
    completed: []
  },
  uploader: {
    pending: [],
    in_progress: [],
    title_corrections: [],
    optimize_review: ["youtube_ready"],
    upload_review: ["optimize_review", "youtube_ready"],
    youtube_ready: ["completed"],
    review: [],
    media_corrections: ["upload_review", "youtube_ready"],
    completed: []
  },
  admin: {
    pending: ["in_progress", "optimize_review", "title_corrections", "upload_review", "youtube_ready", "completed"],
    in_progress: ["pending", "optimize_review", "title_corrections", "upload_review", "youtube_ready", "completed"],
    title_corrections: ["pending", "in_progress", "optimize_review", "upload_review", "youtube_ready", "completed"],
    optimize_review: ["pending", "in_progress", "title_corrections", "upload_review", "youtube_ready", "completed"],
    upload_review: ["pending", "in_progress", "optimize_review", "title_corrections", "youtube_ready", "completed"],
    review: ["pending", "in_progress", "optimize_review", "title_corrections", "upload_review", "youtube_ready", "completed"],
    media_corrections: ["pending", "in_progress", "optimize_review", "title_corrections", "upload_review", "youtube_ready", "completed"],
    youtube_ready: ["pending", "in_progress", "optimize_review", "title_corrections", "upload_review", "completed"],
    completed: ["pending", "in_progress", "optimize_review", "title_corrections", "upload_review", "youtube_ready"]
  },
  youtuber: {
    completed: [],
    in_progress: [],
    media_corrections: [],
    optimize_review: [],
    pending: [],
    review: [],
    title_corrections: [],
    upload_review: [],
    youtube_ready: []
  }
};


const updateVideoSchema = z.object({
  title: z.string(),
  description: z.string(),
  status: z.enum(['pending', 'in_progress', 'title_corrections', 'optimize_review', 'upload_review',
    'youtube_ready', 'review', 'media_corrections', 'completed'])
})  

type UpdateVideoSchema = z.infer<typeof updateVideoSchema>;

async function updateVideo(req: Request, res: Response): Promise<Response> {

  if (! req.user?.role)
    return res.status(403).json({ success: false, message: "No tienes permisos para editar videos" })

  const projectId = parseInt(req.params.projectId);
  const videoId = parseInt(req.params.videoId);
  const updates = req.body as UpdateVideoSchema;

  // Validar body con schema
  const validationResult = updateVideoSchema.safeParse(updates);
  if (! validationResult.success) {
    return res.status(400).json({ success: false, message: validationResult.error.message })
  }


  try {
    // Obtener el video actual para preservar los datos existentes
    const [currentVideo] = await db.select()
      .from(videos)
      .where(
        and(
          eq(videos.id, videoId),
          eq(videos.projectId, projectId)
        )
      )
      .limit(1);

    if (!currentVideo) {
      return res.status(404).json({ success: false, message: "Video no encontrado" });
    }

    // Verificar si el rol del usuario está permitido
    if (req.user.role !== 'admin' && req.user.role !== 'optimizer' && req.user.role !== 'reviewer') {
      return res.status(403).json({ success: false, message: "Este rol no puede actualizar videos" })
    }

    if((req.user.role === 'optimizer' && currentVideo.status !== 'in_progress')) {
      return res.status(400).json({ success: false, message: "El vídeo actual no está en progreso" })
    }

    if (updates.status && !statusTransitions[req.user.role][currentVideo.status].includes(updates.status)) {
      return res.status(400).json({ success: false, message: "No se puede actualizar a este estado" })
    }
    

    // Actualizar el video con la metadata combinada
    const [result] = await db.update(videos)
      .set({
        title: updates.title,
        description: updates.description,
        status: updates.status,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(videos.id, videoId),
          eq(videos.projectId, projectId)
        )
      )
      .returning();      

    return res.status(200).json({ success: true, data: result, message: "Video actualizado correctamente" });
  } catch (error) {
    console.error("Error updating video:", error);
    return res.status(500).json({ success: false, message: "Error al actualizar el video" });
  }
}

async function deleteVideo(req: Request, res: Response): Promise<Response> {
  const projectId = parseInt(req.params.projectId);
  const videoId = parseInt(req.params.videoId);

  // Verificar si el usuario es administrador
  if (req.user!.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: "Solo los administradores pueden eliminar videos"
    });
  }

  try {
    const [result] = await db.delete(videos)
      .where(
        and(
          eq(videos.id, videoId),
          eq(videos.projectId, projectId)
        )
      )
      .returning();

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Video no encontrado"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Video eliminado correctamente"
    });
  } catch (error) {
    console.error("Error deleting video:", error);
    return res.status(500).json({
      success: false,
      message: "Error al eliminar el video"
    });
  }
}

async function getVideos(req: Request, res: Response): Promise<Response> {
  try {
    // let videoQuery: type VideoWithReviewer = InferSelectModel<typeof videos> & {
    //     reviewerName: InferSelectModel<typeof users>['fullName'];
    //     reviewerUsername: InferSelectModel<typeof users>['username'];
    //   };

    const result = await db
    .select({
      ...getTableColumns(videos),

      // Datos del reviewer
      reviewerName: reviewer.fullName,
      reviewerUsername: reviewer.username,

      // Datos del creador
      creatorName: creator.fullName,
      creatorUsername: creator.username,

      // Datos del optimizador
      optimizerName: optimizer.fullName,
      optimizerUsername: optimizer.username,
    })
    .from(videos)
    .leftJoin(reviewer, eq(videos.reviewedBy, reviewer.id))
    .leftJoin(creator, eq(videos.createdBy, creator.id))
    .leftJoin(optimizer, eq(videos.optimizedBy, optimizer.id))
    .orderBy(desc(videos.updatedAt))
    .execute();


    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching all videos:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener los videos"
    });
  }
}

async function getVideosByProject(req: Request, res: Response): Promise<Response> {
  
  const projectId = parseInt(req.params.projectId);
  
  try {
    // let videoQuery: type VideoWithReviewer = InferSelectModel<typeof videos> & {
    //     reviewerName: InferSelectModel<typeof users>['fullName'];
    //     reviewerUsername: InferSelectModel<typeof users>['username'];
    //   };

    const result = await db
    .select({
      ...getTableColumns(videos),

      // Datos del reviewer
      reviewerName: reviewer.fullName,
      reviewerUsername: reviewer.username,

      // Datos del creador
      creatorName: creator.fullName,
      creatorUsername: creator.username,

      // Datos del optimizador
      optimizerName: optimizer.fullName,
      optimizerUsername: optimizer.username,
    })
    .from(videos)
    .leftJoin(reviewer, eq(videos.reviewedBy, reviewer.id))
    .leftJoin(creator, eq(videos.createdBy, creator.id))
    .leftJoin(optimizer, eq(videos.optimizedBy, optimizer.id))
    .where(eq(videos.projectId, projectId))
    .orderBy(desc(videos.updatedAt))
    .execute();

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching all videos:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener los videos"
    });
  }
}

async function createVideo(req: Request, res: Response): Promise<Response> {
  const projectId = parseInt(req.params.projectId);
  const { title, description } = req.body;

  const user = req.user!;

  if (user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: "Solo los administradores pueden crear videos"
    });
  }
  
  try {
    // Use transaction to ensure atomic operations
    const [result] = await db.transaction(async (tx) => {
      // Get project details
      const [project] = await tx.select()
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

      if (!project) {
        throw new Error("Proyecto no encontrado");
      }

      // Generate series number
      const newNumber = (project.current_number || 0) + 1;
      const seriesNumber = project.prefix ?
        `${project.prefix}-${String(newNumber).padStart(4, '0')}` :
        String(newNumber).padStart(4, '0');

      // Update project's current number
      await tx.update(projects)
        .set({ current_number: newNumber })
        .where(eq(projects.id, projectId));

      // Create video
      const videoData: InsertVideo = {
        projectId,
        title,
        description: description || null,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
        seriesNumber,
        createdBy: user.id
      };

      const [video] = await tx.insert(videos)
        .values(videoData)
        .returning();

      return [video];
    });

    return res.json(result);
  } catch (error) {
    console.error("Error creating video:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Error al crear el video"
    });
  }
}



const VideoController = {
  updateVideo,
  deleteVideo,
  getVideos,
  getVideosByProject,
  createVideo
}


export default VideoController