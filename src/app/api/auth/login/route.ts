import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { signToken, setAuthCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 },
      );
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 },
      );
    }

    // Check vault permission
    const vaultPerm = await prisma.featurePermission.findUnique({
      where: { userId_feature: { userId: user.id, feature: 'vault' } },
    });

    // Sign JWT
    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      canAccessVault: user.role === 'MASTER' || !!vaultPerm?.canRead,
    };

    const response = NextResponse.json(payload);
    setAuthCookie(response, token);

    return response;
  } catch (error) {
    console.error('Erro em /api/auth/login', error);
    return NextResponse.json(
      { error: 'Erro ao autenticar' },
      { status: 500 },
    );
  }
}
