import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const TEST_USER_ID = 'test-user';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month'); // formato: YYYY-MM

  if (!month) {
    return NextResponse.json({ error: 'Parâmetro month é obrigatório (YYYY-MM)' }, { status: 400 });
  }

  const monthDate = `${month}-01`;

  try {
    const variable = await prisma.variableCost.findFirst({
      where: {
        user_id: TEST_USER_ID,
        month: new Date(monthDate),
      },
      select: {
        id: true,
        month: true,
        ad_accounts_purchase: true,
        gateway_percentage: true,
        withdrawal_count: true,
        p2p_transfers: true,
      },
    });

    if (!variable) {
      return NextResponse.json(null);
    }

    return NextResponse.json(variable);
  } catch (error) {
    console.error('Erro ao buscar variable_costs', error);
    return NextResponse.json({ error: 'Erro ao buscar custos variáveis' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { month, ad_accounts_purchase, gateway_percentage, withdrawal_count, p2p_transfers } = body;

    if (!month) {
      return NextResponse.json({ error: 'Campo month é obrigatório (YYYY-MM)' }, { status: 400 });
    }

    const monthDate = `${month}-01`;

    const saved = await prisma.variableCost.upsert({
      where: {
        user_id_month: {
          user_id: TEST_USER_ID,
          month: new Date(monthDate),
        },
      },
      update: {
        ad_accounts_purchase: ad_accounts_purchase ?? 0,
        gateway_percentage: gateway_percentage ?? 0,
        withdrawal_count: withdrawal_count ?? 0,
        p2p_transfers: p2p_transfers ?? 0,
      },
      create: {
        month: new Date(monthDate),
        ad_accounts_purchase: ad_accounts_purchase ?? 0,
        gateway_percentage: gateway_percentage ?? 0,
        withdrawal_count: withdrawal_count ?? 0,
        p2p_transfers: p2p_transfers ?? 0,
        user_id: TEST_USER_ID,
      },
      select: {
        id: true,
        month: true,
        ad_accounts_purchase: true,
        gateway_percentage: true,
        withdrawal_count: true,
        p2p_transfers: true,
      },
    });

    return NextResponse.json(saved);
  } catch (error) {
    console.error('Erro ao salvar variable_costs', error);
    return NextResponse.json({ error: 'Erro ao salvar custos variáveis' }, { status: 500 });
  }
}

