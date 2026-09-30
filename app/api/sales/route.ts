import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { saveCustomOperatorToFile } from '@/app/api/operators/route';

export const dynamic = 'force-dynamic';

let columnsEnsured = false;
async function ensureSaleColumns() {
  if (columnsEnsured) return;
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "Sale" ADD COLUMN "originOperator" TEXT').catch(() => {});
    await prisma.$executeRawUnsafe('ALTER TABLE "Sale" ADD COLUMN "salesChannel" TEXT').catch(() => {});
    columnsEnsured = true;
  } catch (e) {
    // ignore
  }
}

export async function GET(req: Request) {
  try {
    await ensureSaleColumns();
    const { searchParams } = new URL(req.url);
    const advisorId = searchParams.get('advisorId');
    const campaignId = searchParams.get('campaignId');
    const planId = searchParams.get('planId');
    const stage = searchParams.get('stage');
    const search = searchParams.get('search')?.trim();
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const userId = searchParams.get('userId');
    const userRole = searchParams.get('userRole');

    const where: any = {};

    if (userRole === 'ASESOR' && userId) {
      where.advisorId = userId;
    } else if (userRole === 'BACKOFFICE' && userId) {
      const boUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { assignedCampaigns: { select: { id: true } } },
      });
      const assignedIds = boUser?.assignedCampaigns.map((c) => c.id) || [];
      where.campaignId = { in: assignedIds };
    }

    if (advisorId) where.advisorId = advisorId;
    if (campaignId) where.campaignId = campaignId;
    if (planId) where.planId = planId;
    if (stage) where.stage = stage;

    if (search && search.length > 0) {
      where.OR = [
        { clientCedula: { contains: search } },
        { clientName: { contains: search } },
        { contractNumber: { contains: search } },
        { otMin: { contains: search } },
        { radicado: { contains: search } },
      ];
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        where.createdAt.lte = to;
      }
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        campaign: { select: { id: true, name: true, color: true } },
        plan: { select: { id: true, name: true, price: true, features: true } },
        advisor: { select: { id: true, cedula: true, name: true, email: true, role: true } },
        validator: { select: { id: true, cedula: true, name: true, email: true } },
        lockedBy: { select: { id: true, cedula: true, name: true, email: true } },
        auditLogs: {
          include: { user: { select: { id: true, name: true, role: true } } },
          orderBy: { timestamp: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(sales, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureSaleColumns();
    const body = await req.json();
    const {
      campaignId,
      planId,
      advisorId,
      documentType,
      clientCedula,
      clientName,
      legalRepCedula,
      address,
      neighborhood,
      department,
      city,
      contactName,
      clientPhone,
      contactPhone2,
      clientEmail,
      otMin,
      acquiredServices,
      recurrent,
      nip,
      contractNumber,
      contractType,
      validationMethod,
      identityValidationDate,
      otpLine,
      otpCode,
      saleType,
      originOperator,
      salesChannel,
      databaseName,
      externalId,
      observation,
      documentCedulaUrl,
      documentCedulaName,
      documentUtilityUrl,
      documentUtilityName,
    } = body;

    if (!campaignId || !planId || !advisorId || !clientCedula || !clientName) {
      return NextResponse.json(
        { error: 'Campaña, plan, consultor, número de documento y nombre del cliente son obligatorios' },
        { status: 400 }
      );
    }

    // Validación estricta del Correo Electrónico (debe contener @)
    if (!clientEmail || !clientEmail.includes('@')) {
      return NextResponse.json(
        { error: 'El correo electrónico es obligatorio y debe contener el símbolo @' },
        { status: 400 }
      );
    }

    // Validación estricta de campos numéricos: Número de Contacto 1, Número de Contacto 2, OT/MIN
    if (clientPhone && !/^\d+$/.test(clientPhone.trim())) {
      return NextResponse.json(
        { error: 'El Número de Contacto 1 solo puede contener números' },
        { status: 400 }
      );
    }
    if (contactPhone2 && !/^\d+$/.test(contactPhone2.trim())) {
      return NextResponse.json(
        { error: 'El Número de Contacto 2 solo puede contener números' },
        { status: 400 }
      );
    }
    if (otMin && !/^\d+$/.test(otMin.trim())) {
      return NextResponse.json(
        { error: 'El campo OT/MIN solo puede contener números' },
        { status: 400 }
      );
    }

    if (!documentCedulaUrl) {
      return NextResponse.json(
        { error: 'Es obligatorio adjuntar la Cédula / Documento del cliente' },
        { status: 400 }
      );
    }

    if (!documentUtilityUrl) {
      return NextResponse.json(
        { error: 'Es obligatorio adjuntar el Recibo de Servicio Público' },
        { status: 400 }
      );
    }

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json({ error: 'El plan seleccionado no existe' }, { status: 404 });
    }

    const cleanOriginOperator = originOperator?.trim() || null;
    if (cleanOriginOperator && cleanOriginOperator.toLowerCase() !== 'otro') {
      saveCustomOperatorToFile(cleanOriginOperator);
    }

    const sale = await prisma.sale.create({
      data: {
        campaignId,
        planId,
        advisorId,
        documentType: documentType || 'Cédula',
        clientCedula: clientCedula.trim(),
        clientName: clientName.trim(),
        legalRepCedula: legalRepCedula?.trim() || null,
        address: address?.trim() || null,
        neighborhood: neighborhood?.trim() || null,
        department: department?.trim() || null,
        city: city?.trim() || null,
        contactName: contactName?.trim() || null,
        clientPhone: clientPhone?.trim() || null,
        contactPhone2: contactPhone2?.trim() || null,
        clientEmail: clientEmail.trim(),
        otMin: otMin?.trim() || null,
        acquiredServices: acquiredServices?.trim() || plan.name,
        recurrent: recurrent?.trim() || null,
        saleValue: plan.price,
        nip: nip?.trim() || null,
        contractNumber: contractNumber?.trim() || null,
        contractType: contractType || 'Firmado',
        validationMethod: validationMethod || 'Claro Safe',
        identityValidationDate: identityValidationDate || new Date().toISOString().slice(0, 10),
        otpLine: otpLine?.trim() || null,
        otpCode: otpCode?.trim() || null,
        saleType: saleType || 'Línea Nueva',
        originOperator: cleanOriginOperator,
        salesChannel: salesChannel?.trim() || 'Telemercadeo',
        databaseName: databaseName?.trim() || null,
        externalId: externalId?.trim() || null,
        observation: observation?.trim() || null,
        stage: 'PENDIENTE_BACKOFFICE',
        documentUrl: documentCedulaUrl,
        documentName: documentCedulaName || 'cedula_cliente.svg',
        documentCedulaUrl,
        documentCedulaName: documentCedulaName || 'cedula_cliente.svg',
        documentUtilityUrl,
        documentUtilityName: documentUtilityName || 'servicio_publico.svg',
        auditLogs: {
          create: {
            userId: advisorId,
            action: 'CREADA',
            comment: `Venta radicada (${saleType || 'Línea Nueva'}) para el cliente ${clientName.trim()} (${documentType || 'Cédula'}: ${clientCedula.trim()}) con el plan ${plan.name} (CFM con IVA: $${plan.price}). Enviada a Back Office.`,
          },
        },
      },
      include: {
        campaign: true,
        plan: true,
        advisor: true,
        auditLogs: true,
      },
    });

    return NextResponse.json(sale, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
