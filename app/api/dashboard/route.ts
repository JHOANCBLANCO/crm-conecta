import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get('campaignId');
    const advisorId = searchParams.get('advisorId');
    const planId = searchParams.get('planId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const where: any = {};
    if (campaignId) where.campaignId = campaignId;
    if (advisorId) where.advisorId = advisorId;
    if (planId) where.planId = planId;

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
        plan: { select: { id: true, name: true, price: true } },
        advisor: { select: { id: true, cedula: true, name: true, email: true } },
        validator: { select: { id: true, cedula: true, name: true, email: true } },
        lockedBy: { select: { id: true, cedula: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalSalesCount = sales.length;
    const approvedSales = sales.filter((s) => s.stage === 'ACTIVO' || s.stage === 'APROBADO');
    const preactiveSales = sales.filter((s) => s.stage === 'PREACTIVO');
    const simSentSales = sales.filter((s) => s.stage === 'ENVIO_SIM');
    const pendingSales = sales.filter((s) => s.stage === 'PENDIENTE_BACKOFFICE');
    const returnedSales = sales.filter((s) => s.stage === 'DEVOLUCION' || s.stage === 'DEVUELTO');

    const totalSoldAmountApproved = approvedSales.reduce((acc, s) => acc + s.saleValue, 0);
    const totalSoldAmountOverall = sales.reduce((acc, s) => acc + s.saleValue, 0);

    const uniqueClientsSet = new Set(sales.map((s) => s.clientCedula));
    const uniqueClientsCount = uniqueClientsSet.size;

    const approvalRate =
      totalSalesCount > 0 ? Math.round((approvedSales.length / totalSalesCount) * 100) : 0;

    return NextResponse.json({
      summary: {
        totalSalesCount,
        approvedSalesCount: approvedSales.length,
        preactiveSalesCount: preactiveSales.length,
        simSentSalesCount: simSentSales.length,
        pendingSalesCount: pendingSales.length,
        returnedSalesCount: returnedSales.length,
        totalSoldAmountApproved,
        totalSoldAmountOverall,
        uniqueClientsCount,
        approvalRate,
      },
      sales,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
