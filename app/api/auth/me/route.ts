import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get('crm_user_id')?.value;

    if (!userId) {
      return NextResponse.json({ user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        assignedCampaigns: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    if (!user || !user.active) {
      return NextResponse.json({ user: null });
    }

    const safeUser = {
      id: user.id,
      cedula: user.cedula,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      assignedCampaigns: user.assignedCampaigns,
    };

    return NextResponse.json({ user: safeUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
