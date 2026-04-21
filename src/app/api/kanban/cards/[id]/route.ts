import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const TEST_USER_ID = 'test-user';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const existing = await prisma.kanbanCard.findFirst({ where: { id, user_id: TEST_USER_ID } });
    if (!existing) return NextResponse.json({ error: 'Card não encontrado' }, { status: 404 });

    const updated = await prisma.kanbanCard.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title.trim() }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.column_id !== undefined && { column_id: body.column_id }),
        ...(body.sort_order !== undefined && { sort_order: body.sort_order }),
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar card', error);
    return NextResponse.json({ error: 'Erro ao atualizar card' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const deleted = await prisma.kanbanCard.deleteMany({ where: { id, user_id: TEST_USER_ID } });
    if (!deleted.count) return NextResponse.json({ error: 'Card não encontrado' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir card', error);
    return NextResponse.json({ error: 'Erro ao excluir card' }, { status: 500 });
  }
}
