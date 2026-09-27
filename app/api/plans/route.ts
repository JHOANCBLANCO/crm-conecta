import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get('campaignId');

    const plans = await prisma.plan.findMany({
      where: {
        active: true,
        ...(campaignId ? { campaignId } : {}),
      },
      include: {
        campaign: {
          select: { id: true, name: true, color: true },
        },
      },
      orderBy: { price: 'asc' },
    });

    return NextResponse.json(plans);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { campaignId, name, price, features } = body;

    if (!campaignId || !name || price === undefined) {
      return NextResponse.json(
        { error: 'Campaña, nombre del plan y precio son requeridos' },
        { status: 400 }
      );
    }

    const plan = await prisma.plan.create({
      data: {
        campaignId,
        name: name.trim(),
        price: parseFloat(price),
        features: features ? features.trim() : '',
      },
      include: {
        campaign: true,
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
