import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.date !== undefined) data.date = new Date(`${body.date}T00:00:00`);
    if (body.type !== undefined) data.type = body.type;
    if (body.amount !== undefined) data.amount = parseFloat(body.amount) || 0;
    if (body.description !== undefined) data.description = body.description || null;
    if (body.category_id !== undefined) data.category_id = body.category_id || null;

    const updated = await prisma.dailyEntry.updateMany({
      where: { id, user_id: auth.userId },
      data,
    });

    if (!updated.count) {
      return NextResponse.json({ error: 'Lançamento não encontrado' }, { status: 404 });
    }

    const entry = await prisma.dailyEntry.findUnique({
      where: { id },
      include: { categoryRef: { select: { id: true, name: true, color: true } } },
    });
    return NextResponse.json(entry);
  } catch (error) {
    console.error('Erro ao atualizar daily_entry', error);
    return NextResponse.json({ error: 'Erro ao atualizar lançamento' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  try {
    const deleted = await prisma.dailyEntry.deleteMany({
      where: { id, user_id: auth.userId },
    });

    if (!deleted.count) {
      return NextResponse.json({ error: 'Lançamento não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir daily_entry', error);
    return NextResponse.json({ error: 'Erro ao excluir lançamento' }, { status: 500 });
  }
}
