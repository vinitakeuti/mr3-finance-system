import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const TEST_USER_ID = 'test-user';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month'); // YYYY-MM
  const date = searchParams.get('date');   // YYYY-MM-DD

  try {
    let where: any = { user_id: TEST_USER_ID };

    if (date) {
      // Single day
      const dayStart = new Date(`${date}T00:00:00`);
      const dayEnd = new Date(`${date}T23:59:59.999`);
      where.date = { gte: dayStart, lte: dayEnd };
    } else if (month) {
      // Full month
      const [y, m] = month.split('-').map(Number);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0, 23, 59, 59, 999);
      where.date = { gte: start, lte: end };
    }

    const entries = await prisma.dailyEntry.findMany({
      where,
      orderBy: [{ date: 'desc' }, { created_at: 'desc' }],
      include: { categoryRef: { select: { id: true, name: true, color: true } } },
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error('Erro ao buscar daily_entries', error);
    return NextResponse.json({ error: 'Erro ao buscar lançamentos' }, { status: 500 });
  }
}

// Summary endpoint via query param
// GET /api/daily-entries?month=2025-04&summary=true
// Returns: { totalIncome, totalExpense, balance, byDay: [...] }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, type, amount, description, category_id } = body;

    if (!date || !type || amount === undefined) {
      return NextResponse.json({ error: 'Campos obrigatórios: date, type, amount' }, { status: 400 });
    }

    if (type !== 'INCOME' && type !== 'EXPENSE') {
      return NextResponse.json({ error: 'type deve ser INCOME ou EXPENSE' }, { status: 400 });
    }

    const created = await prisma.dailyEntry.create({
      data: {
        date: new Date(`${date}T00:00:00`),
        type,
        amount: parseFloat(amount) || 0,
        description: description || null,
        category_id: category_id || null,
        user_id: TEST_USER_ID,
      },
      include: { categoryRef: { select: { id: true, name: true, color: true } } },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar daily_entry', error);
    return NextResponse.json({ error: 'Erro ao criar lançamento' }, { status: 500 });
  }
}
