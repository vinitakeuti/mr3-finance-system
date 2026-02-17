import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Erro em GET /api/admin/users', error);
    return NextResponse.json(
      { error: 'Erro ao buscar usuários' },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, role, isActive } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 },
      );
    }

    const data: Record<string, unknown> = {};
    if (role) data.role = role;
    if (typeof isActive === 'boolean') data.isActive = isActive;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'Nada para atualizar' },
        { status: 400 },
      );
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erro em PATCH /api/admin/users', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar usuário' },
      { status: 500 },
    );
  }
}

