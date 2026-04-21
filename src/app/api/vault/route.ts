import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const TEST_USER_ID = 'test-user';

export async function GET() {
  try {
    const items = await prisma.vaultItem.findMany({
      where: { user_id: TEST_USER_ID },
      orderBy: [{ updated_at: 'desc' }],
      include: { categoryRef: { select: { id: true, name: true, color: true } } },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error('Erro ao buscar vault items', error);
    return NextResponse.json({ error: 'Erro ao buscar itens' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, content, link, category_id } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    const item = await prisma.vaultItem.create({
      data: {
        name: name.trim(),
        content: content || '',
        link: link || null,
        category_id: category_id || null,
        user_id: TEST_USER_ID,
      },
      include: { categoryRef: { select: { id: true, name: true, color: true } } },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar vault item', error);
    return NextResponse.json({ error: 'Erro ao criar item' }, { status: 500 });
  }
}
