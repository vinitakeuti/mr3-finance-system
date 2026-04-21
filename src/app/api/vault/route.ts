import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

async function checkVaultAccess(userId: string, role: string): Promise<boolean> {
  if (role === 'MASTER') return true;
  const perm = await prisma.featurePermission.findUnique({
    where: { userId_feature: { userId, feature: 'vault' } },
  });
  return !!perm?.canRead;
}

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  if (!(await checkVaultAccess(auth.userId, auth.role))) {
    return NextResponse.json({ error: 'Acesso negado ao cofre' }, { status: 403 });
  }

  try {
    const items = await prisma.vaultItem.findMany({
      where: { user_id: auth.userId },
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
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  if (!(await checkVaultAccess(auth.userId, auth.role))) {
    return NextResponse.json({ error: 'Acesso negado ao cofre' }, { status: 403 });
  }

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
        user_id: auth.userId,
      },
      include: { categoryRef: { select: { id: true, name: true, color: true } } },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar vault item', error);
    return NextResponse.json({ error: 'Erro ao criar item' }, { status: 500 });
  }
}
