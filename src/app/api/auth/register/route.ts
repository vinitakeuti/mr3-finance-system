import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { signToken, setAuthCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: nome, email, senha' },
        { status: 400 },
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 8 caracteres' },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 },
      );
    }

    const allowed = await prisma.allowedEmail.findUnique({
      where: { email },
    });

    if (!allowed) {
      return NextResponse.json(
        { error: 'Email não autorizado para cadastro. Fale com o administrador.' },
        { status: 403 },
      );
    }

    if (allowed.used) {
      return NextResponse.json(
        { error: 'Este email já foi utilizado para criar uma conta.' },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Já existe um usuário com este email.' },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12); // increased from 10

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: allowed.role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    await prisma.allowedEmail.update({
      where: { id: allowed.id },
      data: { used: true, usedAt: new Date() },
    });

    // Sign JWT
    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const payload = {
      ...user,
      canAccessVault: user.role === 'MASTER',
    };

    const response = NextResponse.json(payload, { status: 201 });
    setAuthCookie(response, token);

    return response;
  } catch (error) {
    console.error('Erro em /api/auth/register', error);
    return NextResponse.json(
      { error: 'Erro ao registrar usuário' },
      { status: 500 },
    );
  }
}
