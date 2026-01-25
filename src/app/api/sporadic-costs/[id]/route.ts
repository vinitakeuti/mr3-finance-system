import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const TEST_USER_ID = 'test-user';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;

  try {
    const body = await req.json();
    const { name, description, amount, date, category } = body;

    const updated = await prisma.sporadicCost.updateMany({
      where: {
        id,
        user_id: TEST_USER_ID,
      },
      data: {
        name: name ?? undefined,
        description: description ?? undefined,
        amount: amount ?? undefined,
        date: date ? new Date(date) : undefined,
        category: category ?? undefined,
      },
    });

    if (!updated.count) {
      return NextResponse.json({ error: 'Custo esporádico não encontrado' }, { status: 404 });
    }

    const cost = await prisma.sporadicCost.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        amount: true,
        date: true,
        category: true,
      },
    });

    return NextResponse.json(cost);
  } catch (error) {
    console.error('Erro ao atualizar sporadic_cost', error);
    return NextResponse.json({ error: 'Erro ao atualizar custo esporádico' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;

  try {
    const deleted = await prisma.sporadicCost.deleteMany({
      where: {
        id,
        user_id: TEST_USER_ID,
      },
    });

    if (!deleted.count) {
      return NextResponse.json({ error: 'Custo esporádico não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir sporadic_cost', error);
    return NextResponse.json({ error: 'Erro ao excluir custo esporádico' }, { status: 500 });
  }
}

