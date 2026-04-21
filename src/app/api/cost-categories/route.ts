import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const categories = await prisma.costCategory.findMany({
      where: { user_id: auth.userId },
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { costs: true } } },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Erro ao buscar cost_categories', error);
    return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { name, color, description, sort_order } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    const created = await prisma.costCategory.create({
      data: {
        name: name.trim(),
        color: color || '#737373',
        description: description || null,
        sort_order: sort_order ?? 0,
        user_id: auth.userId,
      },
      include: { _count: { select: { costs: true } } },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Já existe uma categoria com esse nome' }, { status: 409 });
    }
    console.error('Erro ao criar cost_category', error);
    return NextResponse.json({ error: 'Erro ao criar categoria' }, { status: 500 });
  }
}
