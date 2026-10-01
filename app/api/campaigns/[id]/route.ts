import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { isArchived, name, description, color } = body;

    if (typeof isArchived === 'boolean') {
      const cookieStore = cookies();
      const sessionUserId = cookieStore.get('crm_user_id')?.value;
      if (sessionUserId) {
        const requester = await prisma.user.findUnique({ where: { id: sessionUserId } });
        if (requester && requester.role === 'SUPERVISOR') {
          return NextResponse.json(
            { error: 'Acción restringida: el Supervisor no tiene permisos para ocultar o archivar campañas.' },
            { status: 403 }
          );
        }
      }
    }

    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        ...(typeof isArchived === 'boolean' ? { isArchived } : {}),
        ...(name ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(color ? { color } : {}),
      },
      include: {
        plans: true,
        _count: {
          select: { sales: true, plans: true },
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
    const cookieStore = cookies();
    const sessionUserId = cookieStore.get('crm_user_id')?.value;
    if (sessionUserId) {
      const requester = await prisma.user.findUnique({ where: { id: sessionUserId } });
      if (requester && requester.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Acción restringida: solo un Administrador puede eliminar campañas.' },
          { status: 403 }
        );
      }
    }

    // Instead of hard delete if there are sales, we can archive it
    const salesCount = await prisma.sale.count({
      where: { campaignId: id },
    });

    if (salesCount > 0) {
      // Soft-archive
      const archived = await prisma.campaign.update({
        where: { id },
        data: { isArchived: true },
      });
      return NextResponse.json({ message: 'Campaña archivada porque contiene ventas registradas', campaign: archived });
    }

    await prisma.campaign.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Campaña eliminada exitosamente' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
