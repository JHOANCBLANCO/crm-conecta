import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        assignedCampaigns: {
          select: { id: true, name: true, color: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cedula, name, email, password, role, assignedCampaignIds } = body;

    if (!cedula || !name || !email || !role) {
      return NextResponse.json(
        { error: 'Cédula, nombre, email y rol son requeridos' },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'El correo electrónico ya se encuentra registrado' },
        { status: 400 }
      );
    }

    const newUser = await prisma.user.create({
      data: {
        cedula: cedula.trim(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password || '123456',
        role,
        ...(Array.isArray(assignedCampaignIds) && assignedCampaignIds.length > 0
          ? {
              assignedCampaigns: {
                connect: assignedCampaignIds.map((id: string) => ({ id })),
              },
            }
          : {}),
      },
      include: {
        assignedCampaigns: true,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
