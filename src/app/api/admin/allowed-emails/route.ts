import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const items = await prisma.allowedEmail.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error('Erro em GET /api/admin/allowed-emails', error);
    return NextResponse.json(
      { error: 'Erro ao buscar emails permitidos' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, role } = await req.json();

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email e papel são obrigatórios' },
        { status: 400 },
      );
    }

    const created = await prisma.allowedEmail.create({
      data: {
        email,
        role,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Erro em POST /api/admin/allowed-emails', error);

    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as any).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'Este email já foi autorizado' },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: 'Erro ao adicionar email autorizado' },
      { status: 500 },
    );
  }
}

