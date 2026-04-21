import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  try {
    const body = await req.json();
    const { name, description, amount, due_day, category } = body;

    const updated = await prisma.fixedCost.updateMany({
      where: { id, user_id: auth.userId },
      data: { name: name ?? undefined, description: description ?? undefined, amount: amount ?? undefined, due_day: due_day ?? undefined, category: category ?? undefined },
    });

    if (!updated.count) {
      return NextResponse.json({ error: 'Custo fixo não encontrado' }, { status: 404 });
    }

    const fixedCost = await prisma.fixedCost.findUnique({
      where: { id },
      select: { id: true, name: true, description: true, amount: true, due_day: true, category: true },
    });
    return NextResponse.json(fixedCost);
  } catch (error) {
    console.error('Erro ao atualizar fixed_cost', error);
    return NextResponse.json({ error: 'Erro ao atualizar custo fixo' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  try {
    const deleted = await prisma.fixedCost.updateMany({
      where: { id, user_id: auth.userId },
      data: { is_active: false },
    });

    if (!deleted.count) {
      return NextResponse.json({ error: 'Custo fixo não encontrado' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir fixed_cost', error);
    return NextResponse.json({ error: 'Erro ao excluir custo fixo' }, { status: 500 });
  }
}
