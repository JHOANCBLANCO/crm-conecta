import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Por favor ingresa correo y contraseña' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: {
        assignedCampaigns: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    if (!user || user.password !== password) {
      return NextResponse.json(
        { error: 'Credenciales inválidas. Verifica tu correo y contraseña.' },
        { status: 401 }
      );
    }

    if (!user.active) {
      return NextResponse.json(
        { error: 'Tu usuario se encuentra inactivo. Contacta al administrador.' },
        { status: 403 }
      );
    }

    const cookieStore = cookies();
    cookieStore.set('crm_user_id', user.id, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    const safeUser = {
      id: user.id,
      cedula: user.cedula,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      assignedCampaigns: user.assignedCampaigns,
    };

    return NextResponse.json({ success: true, user: safeUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
