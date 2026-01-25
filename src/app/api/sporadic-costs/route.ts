import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const TEST_USER_ID = 'test-user';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month'); // YYYY-MM

  if (!month) {
    return NextResponse.json({ error: 'Parâmetro month é obrigatório (YYYY-MM)' }, { status: 400 });
  }

  const startDate = `${month}-01`;
  const endDate = `${month}-31`;

  try {
    const costs = await prisma.sporadicCost.findMany({
      where: {
        user_id: TEST_USER_ID,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: { date: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        amount: true,
        date: true,
        category: true,
      },
    });

    return NextResponse.json(costs);
  } catch (error) {
    console.error('Erro ao buscar sporadic_costs', error);
    return NextResponse.json({ error: 'Erro ao buscar custos esporádicos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, amount, date, category } = body;

    if (!name || !amount || !date) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, amount, date' },
        { status: 400 },
      );
    }

    const created = await prisma.sporadicCost.create({
      data: {
        name,
        description: description ?? null,
        amount,
        date: new Date(date),
        category: category ?? 'geral',
        user_id: TEST_USER_ID,
      },
      select: {
        id: true,
        name: true,
        description: true,
        amount: true,
        date: true,
        category: true,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar sporadic_cost', error);
    return NextResponse.json({ error: 'Erro ao criar custo esporádico' }, { status: 500 });
  }
}

