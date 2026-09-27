import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { cedula, name, email, password, role, active, assignedCampaignIds } = body;

    const data: any = {};
    if (cedula) data.cedula = cedula.trim();
    if (name) data.name = name.trim();
    if (email) data.email = email.trim().toLowerCase();
    if (password) data.password = password;
    if (role) data.role = role;
    if (typeof active === 'boolean') data.active = active;

    if (Array.isArray(assignedCampaignIds)) {
      data.assignedCampaigns = {
        set: assignedCampaignIds.map((cId: string) => ({ id: cId })),
      };
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      include: {
        assignedCampaigns: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await prisma.user.update({
      where: { id },
      data: { active: false },
    });
    return NextResponse.json({ message: 'Usuario desactivado' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
