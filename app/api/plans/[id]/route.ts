import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { name, price, features, active } = body;

    const updated = await prisma.plan.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(price !== undefined ? { price: parseFloat(price) } : {}),
        ...(features !== undefined ? { features: features.trim() } : {}),
        ...(typeof active === 'boolean' ? { active } : {}),
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
    // Mark as inactive rather than deleting if it has historical sales
    const salesCount = await prisma.sale.count({ where: { planId: id } });
    if (salesCount > 0) {
      await prisma.plan.update({
        where: { id },
        data: { active: false },
      });
      return NextResponse.json({ message: 'Plan desactivado por tener ventas asociadas' });
    }

    await prisma.plan.delete({ where: { id } });
    return NextResponse.json({ message: 'Plan eliminado' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
