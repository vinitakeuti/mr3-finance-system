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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month'); // YYYY-MM

  try {
    if (month) {
      const monthDate = new Date(`${month}-01`);
      // Get MONTHLY costs (active) + ONE_TIME costs for this specific month
      const costs = await prisma.cost.findMany({
        where: {
          user_id: TEST_USER_ID,
          is_active: true,
          OR: [
            { recurrence: 'MONTHLY' },
            { recurrence: 'ONE_TIME', month: monthDate },
          ],
        },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
        include: { categoryRef: { select: { id: true, name: true, color: true } } },
      });
      return NextResponse.json(costs);
    }

    // No month filter: return all active costs
    const costs = await prisma.cost.findMany({
      where: { user_id: TEST_USER_ID, is_active: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      include: { categoryRef: { select: { id: true, name: true, color: true } } },
    });
    return NextResponse.json(costs);
  } catch (error) {
    console.error('Erro ao buscar costs', error);
    return NextResponse.json({ error: 'Erro ao buscar custos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, category_id, recurrence, month, due_day, calc_type, amount, quantity, reference_value } = body;
    // Support legacy 'category' string field too
    const categoryName = body.category as string | undefined;

    if (!name || (!category_id && !categoryName)) {
      return NextResponse.json({ error: 'Campos obrigatórios: name, category_id ou category' }, { status: 400 });
    }

    // Resolve category name from category_id if provided
    let resolvedCategoryName = categoryName || '';
    if (category_id) {
      const cat = await prisma.costCategory.findUnique({ where: { id: category_id } });
      if (cat) resolvedCategoryName = cat.name;
    }

    const amountNum = parseFloat(amount) || 0;
    const quantityNum = quantity ? parseInt(quantity) : null;
    const refNum = reference_value ? parseFloat(reference_value) : null;
    const total = computeTotal(calc_type || 'FIXED', amountNum, quantityNum, refNum);

    const created = await prisma.cost.create({
      data: {
        name,
        description: description || null,
        category: resolvedCategoryName,
        category_id: category_id || null,
        recurrence: recurrence || 'MONTHLY',
        month: month ? new Date(`${month}-01`) : null,
        due_day: due_day ? parseInt(due_day) : null,
        calc_type: calc_type || 'FIXED',
        amount: amountNum,
        quantity: quantityNum,
        reference_value: refNum,
        total,
        user_id: TEST_USER_ID,
      },
      include: { categoryRef: { select: { id: true, name: true, color: true } } },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar cost', error);
    return NextResponse.json({ error: 'Erro ao criar custo' }, { status: 500 });
  }
}
