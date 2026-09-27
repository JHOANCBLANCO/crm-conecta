import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { isArchived, name, description, color } = body;

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
