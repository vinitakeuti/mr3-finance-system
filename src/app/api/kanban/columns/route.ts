import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const TEST_USER_ID = 'test-user';

export async function GET() {
  try {
    const columns = await prisma.kanbanColumn.findMany({
      where: { user_id: TEST_USER_ID },
      orderBy: { sort_order: 'asc' },
      include: { cards: { orderBy: { sort_order: 'asc' } } },
    });
    return NextResponse.json(columns);
  } catch (error) {
    console.error('Erro ao buscar colunas', error);
    return NextResponse.json({ error: 'Erro ao buscar colunas' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, color } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });

    const maxOrder = await prisma.kanbanColumn.aggregate({ where: { user_id: TEST_USER_ID }, _max: { sort_order: true } });
    const nextOrder = (maxOrder._max.sort_order ?? -1) + 1;

    const col = await prisma.kanbanColumn.create({
      data: { name: name.trim(), color: color || '#737373', sort_order: nextOrder, user_id: TEST_USER_ID },
      include: { cards: true },
    });
    return NextResponse.json(col, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') return NextResponse.json({ error: 'Já existe uma etapa com esse nome' }, { status: 409 });
    console.error('Erro ao criar coluna', error);
    return NextResponse.json({ error: 'Erro ao criar coluna' }, { status: 500 });
  }
}
