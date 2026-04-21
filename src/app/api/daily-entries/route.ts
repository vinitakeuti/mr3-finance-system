import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month');
  const date = searchParams.get('date');

  try {
    let where: any = { user_id: auth.userId };

    if (date) {
      const dayStart = new Date(`${date}T00:00:00`);
      const dayEnd = new Date(`${date}T23:59:59.999`);
      where.date = { gte: dayStart, lte: dayEnd };
    } else if (month) {
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

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

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
        user_id: auth.userId,
      },
      include: { categoryRef: { select: { id: true, name: true, color: true } } },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar daily_entry', error);
    return NextResponse.json({ error: 'Erro ao criar lançamento' }, { status: 500 });
  }
}
