import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        permissions: {
          where: { feature: 'vault' },
          select: { canRead: true },
        },
      },
    });

    const result = users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      isActive: u.isActive,
      canAccessVault: u.role === 'MASTER' || !!u.permissions[0]?.canRead,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro em GET /api/admin/users', error);
    return NextResponse.json(
      { error: 'Erro ao buscar usuários' },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, role, isActive, canAccessVault } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 },
      );
    }

    const data: Record<string, unknown> = {};
    if (role) data.role = role;
    if (typeof isActive === 'boolean') data.isActive = isActive;

    let updated;
    if (Object.keys(data).length > 0) {
      updated = await prisma.user.update({
        where: { id },
        data,
        select: { id: true, email: true, name: true, role: true, isActive: true },
      });
    } else {
      updated = await prisma.user.findUnique({
        where: { id },
        select: { id: true, email: true, name: true, role: true, isActive: true },
      });
    }

    // Handle vault permission toggle
    if (typeof canAccessVault === 'boolean') {
      if (canAccessVault) {
        await prisma.featurePermission.upsert({
          where: { userId_feature: { userId: id, feature: 'vault' } },
          update: { canRead: true },
          create: { userId: id, feature: 'vault', canRead: true },
        });
      } else {
        await prisma.featurePermission.deleteMany({
          where: { userId: id, feature: 'vault' },
        });
      }
    }

    // Re-fetch vault permission
    const vaultPerm = await prisma.featurePermission.findUnique({
      where: { userId_feature: { userId: id, feature: 'vault' } },
    });

    return NextResponse.json({
      ...updated,
      canAccessVault: updated!.role === 'MASTER' || !!vaultPerm?.canRead,
    });
  } catch (error) {
    console.error('Erro em PATCH /api/admin/users', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar usuário' },
      { status: 500 },
    );
  }
}
