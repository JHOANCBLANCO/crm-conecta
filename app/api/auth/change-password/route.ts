import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get('crm_user_id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Sesión no válida o expirada' }, { status: 401 });
    }

    const { newPassword } = await req.json();

    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 4) {
      return NextResponse.json(
        { error: 'La nueva contraseña debe tener al menos 4 caracteres.' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        password: newPassword.trim(),
        mustChangePassword: false,
      },
      include: {
        assignedCampaigns: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    const safeUser = {
      id: updatedUser.id,
      cedula: updatedUser.cedula,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      active: updatedUser.active,
      mustChangePassword: false,
      createdAt: updatedUser.createdAt,
      assignedCampaigns: updatedUser.assignedCampaigns,
    };

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada con éxito.',
      user: safeUser,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
