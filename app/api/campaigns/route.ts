import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim();
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const userId = searchParams.get('userId');

    let userAssignedCampaignIds: string[] | null = null;

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { assignedCampaigns: { select: { id: true } } },
      });

      // Si no es admin ni supervisor, limitar a las campañas que tiene asignadas
      if (user && user.role !== 'ADMIN' && user.role !== 'SUPERVISOR') {
        userAssignedCampaignIds = user.assignedCampaigns.map((c) => c.id);
      }
    }

    let whereClause: any = {};

    if (userAssignedCampaignIds !== null) {
      whereClause.id = { in: userAssignedCampaignIds };
    }

    if (search && search.length > 0) {
      // Si el usuario busca por nombre, debe salir incluso si está oculta/archivada
      whereClause.name = {
        contains: search,
      };
    } else if (!includeArchived) {
      // Si no hay búsqueda y no pide explícitamente archivadas, solo mostrar activas
      whereClause.isArchived = false;
    }

    const campaigns = await prisma.campaign.findMany({
      where: whereClause,
      include: {
        plans: {
          where: { active: true },
          orderBy: { price: 'asc' },
        },
        _count: {
          select: {
            sales: true,
            plans: true,
          },
        },
      },
      orderBy: [
        { isArchived: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(campaigns);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, color, assignedUserIds } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'El nombre de la campaña es requerido' }, { status: 400 });
    }

    const campaign = await prisma.campaign.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#0284c7',
        isArchived: false,
        ...(Array.isArray(assignedUserIds) && assignedUserIds.length > 0
          ? {
              assignedUsers: {
                connect: assignedUserIds.map((id: string) => ({ id })),
              },
            }
          : {}),
      },
      include: {
        plans: true,
        _count: {
          select: { sales: true, plans: true },
        },
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
