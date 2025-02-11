import type { Request, Response } from "express";
import { eq, and, desc, getTableColumns } from "drizzle-orm";
import { videos, users, projectAccess, InsertProject, projects } from "@db/schema";
import { db } from "@db";

async function createProject(req: Request, res: Response): Promise<Response> {
  const { name, prefix, description } = req.body;

  const user = req.user!;

  if (user.role !== "admin")
    return res.status(403).json({
      success: false,
      message: "No tienes permisos para crear proyectos"
    })
  
  if (!name) {
    return res.status(400).json({
      success: false,
      message: "El nombre del proyecto es requerido"
    });
  }

  try {
    const projectData: InsertProject = {
      name,
      prefix: prefix || null,
      description: description || null,
      current_number: 0
    };

    const [result] = await db.insert(projects)
      .values(projectData)
      .returning();

    console.log("Created project:", result);

    return res.status(200).json({
      success: true,
      data: result,
      message: "Proyecto creado correctamente"
    });
  } catch (error) {
    console.error("Error creating project:", error);
    return res.status(500).json({
      success: false,
      message: "Error al crear el proyecto"
    });
  }
}

async function getProjects(req: Request, res: Response): Promise<Response> {
  try {
    let result;
    const user = req.user!;

    if (user.role === 'admin') {
      // Admin sees all projects
      result = await db.select().from(projects);
    } else {
      // Regular users only see their assigned projects
      result = await db
        .select({
          ...getTableColumns(projects)
        })
        .from(projects)
        // .innerJoin(
        //   projectAccess,
        //   and(
        //     eq(projectAccess.projectId, projects.id),
        //     eq(projectAccess.userId, user.id)
        //   )
        // );
    }

    return res.status(200).json({
      success: true,
      data: result,
      message: "Proyectos obtenidos correctamente"
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener los proyectos"
    });
  }
}

async function updateProject(req: Request, res: Response): Promise<Response> {
  const { id } = req.params;
  const { name, description, prefix } = req.body;

  const user = req.user!;
  if (user.role !== "admin")
    return res.status(403).json({
      success: false,
      message: "No tienes permisos para actualizar proyectos"
    })
  
  try {
    const [result] = await db.update(projects)
      .set({ name, description, prefix })
      .where(eq(projects.id, parseInt(id)))
      .returning();

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Proyecto no encontrado"
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
      message: "Proyecto actualizado correctamente"
    });
  } catch (error) {
    console.error("Error updating project:", error);
    return res.status(500).json({
      success: false,
      message: "Error al actualizar el proyecto"
    });
  }
}

async function deleteProject(req: Request, res: Response): Promise<Response> {
  const { id } = req.params;

  // Verificar si el usuario es administrador
  if (req.user!.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: "Solo los administradores pueden eliminar proyectos"
    });
  }

  try {
    const [result] = await db.delete(projects)
      .where(eq(projects.id, parseInt(id)))
      .returning();

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Proyecto no encontrado"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Proyecto eliminado correctamente"
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    return res.status(500).json({
      success: false,
      message: "Error al eliminar el proyecto"
    });
  }
}


const ProjectController = {
  createProject,
  getProjects,
  updateProject,
  deleteProject
}


export default ProjectController