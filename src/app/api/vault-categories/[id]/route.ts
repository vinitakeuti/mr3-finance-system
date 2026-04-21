import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  try {
    const { name, color } = await req.json();
    const updated = await prisma.vaultCategory.updateMany({
      where: { id, user_id: auth.userId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(color !== undefined && { color }),
      },
    });
    if (!updated.count) return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });

    const result = await prisma.vaultCategory.findUnique({
      where: { id },
      include: { _count: { select: { items: true } } },
    });
    return NextResponse.json(result);
  } catch (error: any) {
    if (error?.code === 'P2002') return NextResponse.json({ error: 'Já existe uma categoria com esse nome' }, { status: 409 });
    console.error('Erro ao atualizar vault category', error);
    return NextResponse.json({ error: 'Erro ao atualizar categoria' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  try {
    await prisma.vaultItem.updateMany({ where: { category_id: id, user_id: auth.userId }, data: { category_id: null } });
    const deleted = await prisma.vaultCategory.deleteMany({ where: { id, user_id: auth.userId } });
    if (!deleted.count) return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir vault category', error);
    return NextResponse.json({ error: 'Erro ao excluir categoria' }, { status: 500 });
  }
}
