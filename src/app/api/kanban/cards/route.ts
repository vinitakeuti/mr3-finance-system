import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const { title, description, column_id } = await req.json();
    if (!title?.trim()) return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 });
    if (!column_id) return NextResponse.json({ error: 'Coluna é obrigatória' }, { status: 400 });

    const maxOrder = await prisma.kanbanCard.aggregate({ where: { column_id }, _max: { sort_order: true } });
    const nextOrder = (maxOrder._max.sort_order ?? -1) + 1;

    const card = await prisma.kanbanCard.create({
      data: { title: title.trim(), description: description || null, column_id, sort_order: nextOrder, user_id: auth.userId },
    });
    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar card', error);
    return NextResponse.json({ error: 'Erro ao criar card' }, { status: 500 });
  }
}
