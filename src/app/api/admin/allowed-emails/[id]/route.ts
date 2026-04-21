import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    await prisma.allowedEmail.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro em DELETE /api/admin/allowed-emails/[id]', error);
    return NextResponse.json(
      { error: 'Erro ao excluir email autorizado' },
      { status: 500 },
    );
  }
}
