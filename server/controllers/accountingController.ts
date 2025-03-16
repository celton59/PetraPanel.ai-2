import type { NextFunction, Request, Response } from "express";
import { eq, and, desc, isNull, sql, asc, isNotNull, count } from "drizzle-orm";
import {
  users,
  projects,
  actionRates,
  userActions,
  payments,
} from "@db/schema";
import { db } from "@db";
import { type Express } from "express";


async function getAccountingRates(req: Request, res: Response): Promise<Response> {
  try {
    // Verificar que el usuario sea administrador
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "No tiene permisos para acceder a esta información"
      });
    }

    const rates = await db
      .select()
      .from(actionRates)
      .orderBy(asc(actionRates.actionType), asc(actionRates.roleId));

    return res.status(200).json({
      success: true,
      data: rates
    });
  } catch (error) {
    console.error("Error fetching action rates:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener las tarifas"
    });
  }
}

async function upsertAccountingRate(req: Request, res: Response): Promise<Response> {
  try {
    // Verificar que el usuario sea administrador
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "No tiene permisos para realizar esta acción"
      });
    }

    const { actionType, roleId, rate, projectId } = req.body;

    // Validar datos
    if (!actionType || !roleId || rate === undefined) {
      return res.status(400).json({
        success: false,
        message: "Los campos actionType, roleId y rate son obligatorios"
      });
    }

    // Verificar si ya existe una tarifa para esta acción y rol
    const existingRate = await db
      .select()
      .from(actionRates)
      .where(
        and(
          eq(actionRates.actionType, actionType),
          eq(actionRates.roleId, roleId),
          projectId ? eq(actionRates.projectId, projectId) : isNull(actionRates.projectId)
        )
      )
      .limit(1);

    let result;
    if (existingRate.length > 0) {
      // Actualizar tarifa existente
      result = await db
        .update(actionRates)
        .set({
          rate,
          updatedAt: new Date()
        })
        .where(eq(actionRates.id, existingRate[0].id))
        .returning();
    } else {
      // Crear nueva tarifa
      result = await db
        .insert(actionRates)
        .values({
          actionType,
          roleId,
          rate,
          projectId: projectId || null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
    }

    return res.status(200).json({
      success: true,
      data: result[0],
      message: existingRate.length > 0 ? "Tarifa actualizada correctamente" : "Tarifa creada correctamente"
    });
  } catch (error) {
    console.error("Error creating/updating action rate:", error);
    return res.status(500).json({
      success: false,
      message: "Error al crear/actualizar la tarifa"
    });
  }
}

async function deleteAccountingRate(req: Request, res: Response): Promise<Response> {
  try {
    // Verificar que el usuario sea administrador
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "No tiene permisos para realizar esta acción"
      });
    }

    const rateId = parseInt(req.params.id);

    await db
      .delete(actionRates)
      .where(eq(actionRates.id, rateId));

    return res.status(200).json({
      success: true,
      message: "Tarifa eliminada correctamente"
    });
  } catch (error) {
    console.error("Error deleting action rate:", error);
    return res.status(500).json({
      success: false,
      message: "Error al eliminar la tarifa"
    });
  }
}

async function getPendingPayments(req: Request, res: Response): Promise<Response> {
  try {
    // Verificar que el usuario sea administrador
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "No tiene permisos para acceder a esta información"
      });
    }

    const pendingActions = await db
      .select({
        userId: userActions.userId,
        username: users.username,
        fullName: users.fullName,
        totalAmount: sql<string>`SUM(${userActions.rateApplied})`,
        actionsCount: count()
      })
      .from(userActions)
      .innerJoin(users, eq(users.id, userActions.userId))
      .where(
        and(
          eq(userActions.isPaid, false),
          isNotNull(userActions.rateApplied)
        )
      )
      .groupBy(userActions.userId, users.username, users.fullName);

    return res.status(200).json({
      success: true,
      data: pendingActions
    });
  } catch (error) {
    console.error("Error fetching pending payments:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener pagos pendientes"
    });
  }
}

async function getAccountingActionsByUser(req: Request, res: Response): Promise<Response> {
  try {
    // Verificar que el usuario sea administrador o el propio usuario
    if (req.user?.role !== "admin" && req.user?.id !== parseInt(req.params.userId)) {
      return res.status(403).json({
        success: false,
        message: "No tiene permisos para acceder a esta información"
      });
    }

    const userId = parseInt(req.params.userId);
    const { paid } = req.query;

    let query = db
      .select({
        id: userActions.id,
        actionType: userActions.actionType,
        videoId: userActions.videoId,
        projectId: userActions.projectId,
        projectName: projects.name,
        rate: userActions.rateApplied,
        isPaid: userActions.isPaid,
        createdAt: userActions.createdAt,
        paymentDate: userActions.paymentDate,
        paymentReference: userActions.paymentReference
      })
      .from(userActions)
      .leftJoin(projects, eq(projects.id, userActions.projectId))
      .where(and(
        eq(userActions.userId, userId),
        // Filtrar por estado de pago si se especifica
        paid !== undefined ? eq(userActions.isPaid, paid === "true") : undefined
      ))
      // Ordenar por fecha (más reciente primero)
      .orderBy(desc(userActions.createdAt)); 


    const actions = await query;

    return res.json({
      success: true,
      data: actions
    });
  } catch (error) {
    console.error("Error fetching user actions:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener acciones del usuario"
    });
  }
}

async function registerPayment (req: Request, res: Response) {
  try {
    // Verificar que el usuario sea administrador
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "No tiene permisos para realizar esta acción"
      });
    }

    const { userId, amount, reference, notes, actionIds } = req.body;

    if (!userId || !amount || !actionIds || !Array.isArray(actionIds)) {
      return res.status(400).json({
        success: false,
        message: "Los campos userId, amount y actionIds son obligatorios"
      });
    }

    // Registrar el pago
    const payment = await db
      .insert(payments)
      .values({
        userId,
        amount,
        paymentDate: new Date(),
        reference: reference || null,
        notes: notes || null,
        createdAt: new Date()
      })
      .returning();

    // Actualizar acciones como pagadas
    if (actionIds && actionIds.length > 0) {
      await db
        .update(userActions)
        .set({
          isPaid: true,
          paymentDate: new Date(),
          paymentReference: payment[0].id.toString()
        })
        .where(
          and(
            eq(userActions.userId, userId),
            eq(userActions.isPaid, false),
            sql`${userActions.id} = ANY(ARRAY[${actionIds.join(',')}]::int[])`
          )
        );
    }

    return res.json({
      success: true,
      data: payment[0],
      message: "Pago registrado correctamente"
    });
  } catch (error) {
    console.error("Error registering payment:", error);
    return res.status(500).json({
      success: false,
      message: "Error al registrar el pago"
    });
  }
}

async function getPaymentHistory (req: Request, res: Response) {
  try {
    // Verificar que el usuario sea administrador
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "No tiene permisos para acceder a esta información"
      });
    }

    const paymentsHistory = await db
      .select({
        id: payments.id,
        userId: payments.userId,
        username: users.username,
        fullName: users.fullName,
        amount: payments.amount,
        paymentDate: payments.paymentDate,
        reference: payments.reference,
        notes: payments.notes
      })
      .from(payments)
      .innerJoin(users, eq(users.id, payments.userId))
      .orderBy(desc(payments.paymentDate));

    return res.json({
      success: true,
      data: paymentsHistory
    });
  } catch (error) {
    console.error("Error fetching payments history:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener historial de pagos"
    });
  }
}

export function setUpAccoutingRoutes (requireAuth: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined, app: Express) {
 
  // Obtener todas las tarifas por acción
  app.get("/api/accounting/rates", requireAuth, getAccountingRates);

  // Crear/Actualizar tarifa
  app.post("/api/accounting/rates", requireAuth, upsertAccountingRate );

  // Eliminar tarifa
  app.delete("/api/accounting/rates/:id", requireAuth, deleteAccountingRate );

  // Obtener acciones pendientes de pago
  app.get("/api/accounting/pending-payments", requireAuth, getPendingPayments );

  // Obtener detalle de acciones por usuario
  app.get("/api/accounting/user-actions/:userId", requireAuth, getAccountingActionsByUser );

  // Registrar pago
  app.post("/api/accounting/payments", requireAuth, registerPayment );

  // Historial de pagos
  app.get("/api/accounting/payments-history", requireAuth, getPaymentHistory );
}
