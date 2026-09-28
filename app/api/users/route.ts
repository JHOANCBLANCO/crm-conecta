import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateUsername } from '@/lib/utils';

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

    if (!cedula || !name || !role) {
      return NextResponse.json(
        { error: 'Cédula, nombre y rol son requeridos' },
        { status: 400 }
      );
    }

    const allUsers = await prisma.user.findMany({
      select: { email: true },
    });
    const existingUsernames = allUsers.map((u) => u.email);

    let finalUsername = (email || '').trim().toLowerCase().split('@')[0];
    if (!finalUsername || existingUsernames.includes(finalUsername)) {
      finalUsername = generateUsername(name, existingUsernames);
    }

    const newUser = await prisma.user.create({
      data: {
        cedula: cedula.trim(),
        name: name.trim(),
        email: finalUsername,
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
