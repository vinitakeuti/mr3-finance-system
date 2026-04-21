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
    if (body.name !== undefined) data.name = body.name.trim();
    if (body.color !== undefined) data.color = body.color;
    if (body.description !== undefined) data.description = body.description || null;
    if (body.sort_order !== undefined) data.sort_order = body.sort_order;

    const updated = await prisma.costCategory.updateMany({
      where: { id, user_id: auth.userId },
      data,
    });

    if (!updated.count) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });
    }

    if (data.name) {
      const cat = await prisma.costCategory.findUnique({ where: { id } });
      if (cat) {
        await prisma.cost.updateMany({
          where: { category_id: id, user_id: auth.userId },
          data: { category: String(data.name) },
        });
      }
    }

    const category = await prisma.costCategory.findUnique({
      where: { id },
      include: { _count: { select: { costs: true } } },
    });
    return NextResponse.json(category);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Já existe uma categoria com esse nome' }, { status: 409 });
    }
    console.error('Erro ao atualizar cost_category', error);
    return NextResponse.json({ error: 'Erro ao atualizar categoria' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  try {
    const costsCount = await prisma.cost.count({
      where: { category_id: id, user_id: auth.userId, is_active: true },
    });

    if (costsCount > 0) {
      await prisma.cost.updateMany({
        where: { category_id: id, user_id: auth.userId },
        data: { category_id: null },
      });
    }

    const deleted = await prisma.costCategory.deleteMany({
      where: { id, user_id: auth.userId },
    });

    if (!deleted.count) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, unlinked_costs: costsCount });
  } catch (error) {
    console.error('Erro ao excluir cost_category', error);
    return NextResponse.json({ error: 'Erro ao excluir categoria' }, { status: 500 });
  }
}
