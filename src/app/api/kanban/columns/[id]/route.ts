import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  try {
    const body = await req.json();
    const updated = await prisma.kanbanColumn.updateMany({
      where: { id, user_id: auth.userId },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.color !== undefined && { color: body.color }),
        ...(body.sort_order !== undefined && { sort_order: body.sort_order }),
      },
    });
    if (!updated.count) return NextResponse.json({ error: 'Coluna não encontrada' }, { status: 404 });
    const result = await prisma.kanbanColumn.findUnique({ where: { id }, include: { cards: { orderBy: { sort_order: 'asc' } } } });
    return NextResponse.json(result);
  } catch (error: any) {
    if (error?.code === 'P2002') return NextResponse.json({ error: 'Já existe uma etapa com esse nome' }, { status: 409 });
    console.error('Erro ao atualizar coluna', error);
    return NextResponse.json({ error: 'Erro ao atualizar coluna' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  try {
    await prisma.kanbanCard.deleteMany({ where: { column_id: id } });
    const deleted = await prisma.kanbanColumn.deleteMany({ where: { id, user_id: auth.userId } });
    if (!deleted.count) return NextResponse.json({ error: 'Coluna não encontrada' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir coluna', error);
    return NextResponse.json({ error: 'Erro ao excluir coluna' }, { status: 500 });
  }
}
