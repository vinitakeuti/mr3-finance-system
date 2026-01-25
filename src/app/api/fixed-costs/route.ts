import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const TEST_USER_ID = 'test-user';

export async function GET() {
  try {
    const fixedCosts = await prisma.fixedCost.findMany({
      where: {
        user_id: TEST_USER_ID,
        is_active: true,
      },
      orderBy: { due_day: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        amount: true,
        due_day: true,
        category: true,
      },
    });

    return NextResponse.json(fixedCosts);
  } catch (error) {
    console.error('Erro ao buscar fixed_costs', error);
    return NextResponse.json({ error: 'Erro ao buscar custos fixos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, amount, due_day, category } = body;

    if (!name || !amount || !due_day || !category) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, amount, due_day, category' },
        { status: 400 },
      );
    }

    const created = await prisma.fixedCost.create({
      data: {
        name,
        description: description ?? null,
        amount,
        due_day,
        category,
        user_id: TEST_USER_ID,
        is_active: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        amount: true,
        due_day: true,
        category: true,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar fixed_cost', error);
    return NextResponse.json({ error: 'Erro ao criar custo fixo' }, { status: 500 });
  }
}

