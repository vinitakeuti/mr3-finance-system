import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const TEST_USER_ID = 'test-user';

function computeTotal(calc_type: string, amount: number, quantity?: number | null, reference_value?: number | null): number {
  switch (calc_type) {
    case 'PER_UNIT':
      return amount * (quantity ?? 0);
    case 'PERCENTAGE':
      return (reference_value ?? 0) * (amount / 100);
    case 'FIXED':
    default:
      return amount;
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;

  try {
    const body = await req.json();
    const { name, description, category, category_id, recurrence, month, due_day, calc_type, amount, quantity, reference_value, is_active } = body;

    // Build update data
    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description || null;
    if (category !== undefined) data.category = category;
    if (category_id !== undefined) {
      data.category_id = category_id || null;
      // Resolve category name from id
      if (category_id) {
        const cat = await prisma.costCategory.findUnique({ where: { id: category_id } });
        if (cat) data.category = cat.name;
      }
    }
    if (recurrence !== undefined) data.recurrence = recurrence;
    if (month !== undefined) data.month = month ? new Date(`${month}-01`) : null;
    if (due_day !== undefined) data.due_day = due_day ? parseInt(due_day) : null;
    if (calc_type !== undefined) data.calc_type = calc_type;
    if (amount !== undefined) data.amount = parseFloat(amount) || 0;
    if (quantity !== undefined) data.quantity = quantity ? parseInt(quantity) : null;
    if (reference_value !== undefined) data.reference_value = reference_value ? parseFloat(reference_value) : null;
    if (is_active !== undefined) data.is_active = is_active;

    // Recompute total if any calculation field changed
    if (amount !== undefined || quantity !== undefined || reference_value !== undefined || calc_type !== undefined) {
      const existing = await prisma.cost.findFirst({ where: { id, user_id: TEST_USER_ID } });
      if (!existing) {
        return NextResponse.json({ error: 'Custo não encontrado' }, { status: 404 });
      }
      const finalCalcType = (data.calc_type as string) ?? existing.calc_type;
      const finalAmount = data.amount !== undefined ? Number(data.amount) : Number(existing.amount);
      const finalQuantity = data.quantity !== undefined ? (data.quantity as number | null) : existing.quantity;
      const finalRef = data.reference_value !== undefined ? (data.reference_value as number | null) : existing.reference_value ? Number(existing.reference_value) : null;
      data.total = computeTotal(finalCalcType, finalAmount, finalQuantity, finalRef);
    }

    const updated = await prisma.cost.updateMany({
      where: { id, user_id: TEST_USER_ID },
      data,
    });

    if (!updated.count) {
      return NextResponse.json({ error: 'Custo não encontrado' }, { status: 404 });
    }

    const cost = await prisma.cost.findUnique({
      where: { id },
      include: { categoryRef: { select: { id: true, name: true, color: true } } },
    });
    return NextResponse.json(cost);
  } catch (error) {
    console.error('Erro ao atualizar cost', error);
    return NextResponse.json({ error: 'Erro ao atualizar custo' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;

  try {
    const deleted = await prisma.cost.deleteMany({
      where: { id, user_id: TEST_USER_ID },
    });

    if (!deleted.count) {
      return NextResponse.json({ error: 'Custo não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir cost', error);
    return NextResponse.json({ error: 'Erro ao excluir custo' }, { status: 500 });
  }
}
