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
    const body = await req.json().catch(() => ({}));
    const { password, adminId } = body;

    const cookieStore = cookies();
    const sessionUserId = cookieStore.get('crm_user_id')?.value;
    const effectiveAdminId = adminId || sessionUserId;

    if (!effectiveAdminId) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión como Administrador.' },
        { status: 401 }
      );
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: effectiveAdminId },
    });

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acción restringida: solo un Administrador puede eliminar planes.' },
        { status: 403 }
      );
    }

    if (!password || password.trim() !== adminUser.password) {
      return NextResponse.json(
        { error: 'Contraseña de administrador incorrecta. No se autorizó la eliminación del plan.' },
        { status: 401 }
      );
    }

    const plan = await prisma.plan.findUnique({ where: { id } });
    if (!plan) {
      return NextResponse.json({ error: 'El plan que intentas eliminar no existe.' }, { status: 404 });
    }

    // Se marca el plan como inactivo (active: false).
    // De esta manera desaparece inmediatamente de la campaña y del formulario de nuevas ventas para asesores,
    // pero TODAS las ventas registradas históricamente con este plan conservan su registro, su nombre original
    // y su valor intactos en la base de datos sin alteración alguna.
    await prisma.plan.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({
      success: true,
      message: `El plan "${plan.name}" fue eliminado de la campaña. Las ventas históricas registradas permanecen 100% intactas.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
