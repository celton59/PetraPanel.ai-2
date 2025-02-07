import type { Request, Response } from "express";
import { eq, and, desc } from "drizzle-orm";
import { videos, users, projectAccess } from "@db/schema";
import { db } from "@db";
import { getPrismaClient } from "@db/prismaClient";

const prisma = getPrismaClient();

async function updateVideo(req: Request, res: Response): Promise<Response> {
    const projectId = parseInt(req.params.projectId);
    const videoId = parseInt(req.params.videoId);
    const updates = req.body;

    if (! req.user?.role)
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para editar videos"
      })

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
        return res.status(404).json({
          success: false,
          message: "Video no encontrado"
        });
      }

      // Verificar si el usuario es administrador
      console.log("ROLE", req.user?.role)
      if (req.user.role !== 'admin' && req.user.role !== 'optimizer' && req.user.role !== 'reviewer') {
        return res.status(403).json({
          success: false,
          message: "Este rol no puede actualizar videos"
        })
      }

      if((req.user.role === 'optimizer' && currentVideo.status !== 'in_progress')) {
        return res.status(400).json({
          success: false,
          message: "El vídeo actual no está en progreso"
        })
      }

      // Preparar la actualización de metadata
      let updatedMetadata = currentVideo.metadata || {};
      if (updates.metadata) {
        updatedMetadata = {
          ...updatedMetadata,
          ...updates.metadata
        };
      }

      // Actualizar el video con la metadata combinada
      const [result] = await db.update(videos)
        .set({
          ...updates,
          metadata: updatedMetadata,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(videos.id, videoId),
            eq(videos.projectId, projectId)
          )
        )
        .returning();

      console.log("Video actualizado con metadata:", result.metadata);

      return res.status(200).json({
        success: true,
        data: result,
        message: "Video actualizado correctamente"
      });
    } catch (error) {
      console.error("Error updating video:", error);
      return res.status(500).json({
        success: false,
        message: "Error al actualizar el video"
      });
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
    const user = req.user!;


    const result = await prisma.video.findMany({
      include: {
        currentReviewer: true
      },
      orderBy: {
        updatedAt: "desc"
      }
      
    })
    
    // let videoQuery;

    // if (user.role === 'admin') {
    //   // Admin sees all videos
    //   videoQuery = db.select({
    //     id: videos.id,
    //     projectId: videos.projectId,
    //     title: videos.title,
    //     description: videos.description,
    //     status: videos.status,
    //     videoUrl: videos.videoUrl,
    //     thumbnailUrl: videos.thumbnailUrl,
    //     youtubeUrl: videos.youtubeUrl,
    //     optimizedTitle: videos.optimizedTitle,
    //     optimizedDescription: videos.optimizedDescription,
    //     tags: videos.tags,
    //     seriesNumber: videos.seriesNumber,
    //     currentReviewerId: videos.currentReviewerId,
    //     reviewerName: users.fullName,
    //     reviewerUsername: users.username,
    //     lastReviewedAt: videos.lastReviewedAt,
    //     lastReviewComments: videos.lastReviewComments,
    //     metadata: videos.metadata,
    //     createdById: videos.createdById,
    //     createdAt: videos.createdAt,
    //     updatedAt: videos.updatedAt,
    //     publishedAt: videos.publishedAt,
    //     title_corrected: videos.title_corrected,
    //     media_corrected: videos.media_corrected,
    //   })
    //     .from(videos)
    //     .leftJoin(users, eq(videos.currentReviewerId, users.id));
    // } else {
    //   // Regular users only see videos from their assigned projects
    //   videoQuery = db.select({
    //     id: videos.id,
    //     projectId: videos.projectId,
    //     title: videos.title,
    //     description: videos.description,
    //     status: videos.status,
    //     videoUrl: videos.videoUrl,
    //     thumbnailUrl: videos.thumbnailUrl,
    //     youtubeUrl: videos.youtubeUrl,
    //     optimizedTitle: videos.optimizedTitle,
    //     optimizedDescription: videos.optimizedDescription,
    //     tags: videos.tags,
    //     seriesNumber: videos.seriesNumber,
    //     currentReviewerId: videos.currentReviewerId,
    //     reviewerName: users.fullName,
    //     reviewerUsername: users.username,
    //     lastReviewedAt: videos.lastReviewedAt,
    //     lastReviewComments: videos.lastReviewComments,
    //     metadata: videos.metadata,
    //     createdById: videos.createdById,
    //     createdAt: videos.createdAt,
    //     updatedAt: videos.updatedAt,
    //     publishedAt: videos.publishedAt,
    //     title_corrected: videos.title_corrected,
    //     media_corrected: videos.media_corrected,
    //   })
    //     .from(videos)
    //     .innerJoin(projectAccess, eq(videos.projectId, projectAccess.projectId))
    //     .leftJoin(users, eq(videos.currentReviewerId, users.id))
    //     .where(eq(projectAccess.userId, user.id));
    // }

    // const result = await videoQuery.orderBy(desc(videos.updatedAt));

    // Agregar logs para debugging
    console.log("Videos fetched:", result.map(video => ({
      id: video.id,
      status: video.status,
    })));

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching all videos:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener los videos"
    });
  }
}


const VideoController = {
  updateVideo,
  deleteVideo,
  getVideos
}


export default VideoController