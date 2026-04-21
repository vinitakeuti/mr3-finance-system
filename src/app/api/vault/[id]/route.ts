import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const TEST_USER_ID = 'test-user';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { name, content, link, category_id } = await req.json();

    const existing = await prisma.vaultItem.findFirst({ where: { id, user_id: TEST_USER_ID } });
    if (!existing) return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 });

    const updated = await prisma.vaultItem.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(content !== undefined && { content }),
        ...(link !== undefined && { link: link || null }),
        ...(category_id !== undefined && { category_id: category_id || null }),
      },
      include: { categoryRef: { select: { id: true, name: true, color: true } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Erro ao atualizar vault item', error);
    return NextResponse.json({ error: 'Erro ao atualizar item' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const deleted = await prisma.vaultItem.deleteMany({ where: { id, user_id: TEST_USER_ID } });
    if (!deleted.count) return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir vault item', error);
    return NextResponse.json({ error: 'Erro ao excluir item' }, { status: 500 });
  }
}
