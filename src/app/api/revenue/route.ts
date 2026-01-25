import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const TEST_USER_ID = 'test-user';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month'); // YYYY-MM

  try {
    if (month) {
      const monthDate = `${month}-01`;

      const revenue = await prisma.revenue.findFirst({
        where: {
          user_id: TEST_USER_ID,
          month: new Date(monthDate),
        },
        select: {
          id: true,
          month: true,
          total_revenue: true,
          sales_count: true,
          traffic_investment: true,
        },
      });

      if (!revenue) {
        return NextResponse.json(null);
      }

      return NextResponse.json(revenue);
    }

    // Sem month: retornar histórico (últimos 6 meses)
    const history = await prisma.revenue.findMany({
      where: {
        user_id: TEST_USER_ID,
      },
      orderBy: { month: 'desc' },
      take: 6,
      select: {
        month: true,
        total_revenue: true,
        sales_count: true,
        traffic_investment: true,
      },
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error('Erro ao buscar revenue', error);
    return NextResponse.json({ error: 'Erro ao buscar faturamento' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { month, total_revenue, sales_count, traffic_investment } = body;

    if (!month) {
      return NextResponse.json({ error: 'Campo month é obrigatório (YYYY-MM)' }, { status: 400 });
    }

    const monthDate = `${month}-01`;

    const saved = await prisma.revenue.upsert({
      where: {
        user_id_month: {
          user_id: TEST_USER_ID,
          month: new Date(monthDate),
        },
      },
      update: {
        total_revenue: total_revenue ?? 0,
        sales_count: sales_count ?? 0,
        traffic_investment: traffic_investment ?? 0,
      },
      create: {
        month: new Date(monthDate),
        total_revenue: total_revenue ?? 0,
        sales_count: sales_count ?? 0,
        traffic_investment: traffic_investment ?? 0,
        user_id: TEST_USER_ID,
      },
      select: {
        id: true,
        month: true,
        total_revenue: true,
        sales_count: true,
        traffic_investment: true,
      },
    });

    return NextResponse.json(saved);
  } catch (error) {
    console.error('Erro ao salvar revenue', error);
    return NextResponse.json({ error: 'Erro ao salvar faturamento' }, { status: 500 });
  }
}

