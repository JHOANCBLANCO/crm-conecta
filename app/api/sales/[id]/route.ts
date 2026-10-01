import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        campaign: true,
        plan: true,
        advisor: true,
        validator: true,
        lockedBy: true,
        auditLogs: {
          include: { user: true },
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!sale) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
    }

    return NextResponse.json(sale);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const {
      action, // 'TOMAR' | 'SOLTAR' | 'GESTIONAR_BACKOFFICE' | 'REENVIAR'
      userId,
      userName,
      userRole,
      nextStage: requestedStage,
      radicado,
      backofficeObservation,
      preactivationDate,
      simSentDate,
      activationDate,
      activationMonth,
      returnReason,
      comment,
      documentCedulaUrl,
      documentCedulaName,
      documentUtilityUrl,
      documentUtilityName,
      clientName,
      clientPhone,
      clientEmail,
    } = body;

    const existingSale = await prisma.sale.findUnique({
      where: { id },
      include: { lockedBy: true },
    });

    if (!existingSale) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
    }

    const userRecord = userId
      ? await prisma.user.findUnique({ where: { id: userId } })
      : null;
    const effectiveUserName = userName || userRecord?.name || 'Back Office';
    const isAdmin =
      userRole === 'ADMIN' ||
      userRole === 'SUPERVISOR' ||
      userRecord?.role === 'ADMIN' ||
      userRecord?.role === 'SUPERVISOR';

    // Verificación de bloqueo concurrente (ningún otro Back Office puede tocarla si ya está tomada)
    if (
      action !== 'REENVIAR' &&
      existingSale.lockedById &&
      existingSale.lockedById !== userId &&
      !isAdmin
    ) {
      return NextResponse.json(
        {
          error: `Esta solicitud está bloqueada porque ya está siendo gestionada por ${
            existingSale.lockedByName || existingSale.lockedBy?.name || 'otro Back Office'
          }.`,
        },
        { status: 409 }
      );
    }

    let nextStage = existingSale.stage;
    let auditAction = 'ACTUALIZADA';
    let auditComment = comment || '';
    let updatedReason = existingSale.returnReason;
    let validatorId = existingSale.validatorId;
    let backofficeName = existingSale.backofficeName;
    let lockedById: string | null = existingSale.lockedById;
    let lockedByName: string | null = existingSale.lockedByName;
    let lockedAt: Date | null = existingSale.lockedAt;

    if (action === 'TOMAR') {
      lockedById = userId;
      lockedByName = effectiveUserName;
      lockedAt = new Date();
      validatorId = userId;
      backofficeName = effectiveUserName;
      auditAction = 'TOMADA_POR_BACKOFFICE';
      auditComment = `Solicitud tomada y bloqueada por ${effectiveUserName} para iniciar o continuar gestión.`;
    } else if (action === 'SOLTAR') {
      lockedById = null;
      lockedByName = null;
      lockedAt = null;
      auditAction = 'LIBERADA_POR_BACKOFFICE';
      auditComment =
        comment ||
        `Solicitud liberada por ${effectiveUserName} (disponible para que otro Back Office continúe el proceso).`;
    } else if (action === 'GESTIONAR_BACKOFFICE') {
      nextStage = requestedStage || existingSale.stage;
      validatorId = userId;
      backofficeName = effectiveUserName;
      // Al guardar y avanzar de estado, se libera el bloqueo para que continúe en el nuevo estado
      lockedById = null;
      lockedByName = null;
      lockedAt = null;
      auditAction = `ESTADO_${nextStage}`;

      if (nextStage === 'DEVOLUCION') {
        updatedReason =
          backofficeObservation ||
          returnReason ||
          'Solicitud en devolución por observaciones de Back Office.';
      } else if (nextStage === 'ACTIVO') {
        updatedReason = null;
      }

      const stageLabels: Record<string, string> = {
        PENDIENTE_BACKOFFICE: 'Pendiente Back Office',
        PREACTIVO: 'Preactivo',
        ENVIO_SIM: 'Envío de SIM',
        ACTIVO: 'Activo',
        DEVOLUCION: 'Devolución',
      };

      auditComment =
        comment ||
        `Gestión completada por ${effectiveUserName}. Nuevo estado: ${
          stageLabels[nextStage] || nextStage
        }${radicado ? ` | Radicado: ${radicado}` : ''}${
          backofficeObservation ? ` | Obs: ${backofficeObservation}` : ''
        }`;
    } else if (action === 'REENVIAR') {
      nextStage = 'PENDIENTE_BACKOFFICE';
      lockedById = null;
      lockedByName = null;
      lockedAt = null;
      auditAction = 'REENVIADA';
      auditComment =
        comment || 'Documentación subsanada por el asesor y reenviada a la cola de Back Office.';
    }

    const dataToUpdate: any = {
      stage: nextStage,
      returnReason: updatedReason,
      validatorId,
      backofficeName,
      lockedById,
      lockedByName,
      lockedAt,
      ...(radicado !== undefined ? { radicado: radicado?.trim() || null } : {}),
      ...(backofficeObservation !== undefined
        ? { backofficeObservation: backofficeObservation?.trim() || null }
        : {}),
      ...(preactivationDate !== undefined
        ? { preactivationDate: preactivationDate || null }
        : {}),
      ...(simSentDate !== undefined ? { simSentDate: simSentDate || null } : {}),
      ...(activationDate !== undefined
        ? { activationDate: activationDate || null }
        : {}),
      ...(activationMonth !== undefined
        ? { activationMonth: activationMonth || null }
        : {}),
      ...(documentCedulaUrl
        ? {
            documentUrl: documentCedulaUrl,
            documentName: documentCedulaName || 'cedula_subsanada.pdf',
            documentCedulaUrl,
            documentCedulaName: documentCedulaName || 'cedula_subsanada.pdf',
          }
        : {}),
      ...(documentUtilityUrl
        ? {
            documentUtilityUrl,
            documentUtilityName: documentUtilityName || 'servicio_publico_subsanado.pdf',
          }
        : {}),
      ...(clientName ? { clientName } : {}),
      ...(clientPhone ? { clientPhone } : {}),
      ...(clientEmail ? { clientEmail } : {}),
      auditLogs: {
        create: {
          userId: userId || existingSale.advisorId,
          action: auditAction,
          comment: auditComment,
        },
      },
    };

    const updatedSale = await prisma.sale.update({
      where: { id },
      data: dataToUpdate,
      include: {
        campaign: true,
        plan: true,
        advisor: true,
        validator: true,
        lockedBy: true,
        auditLogs: {
          include: { user: true },
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    return NextResponse.json(updatedSale);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
