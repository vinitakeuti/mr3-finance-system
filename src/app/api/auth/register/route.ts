import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: nome, email, senha' },
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

    const passwordHash = await bcrypt.hash(password, 10);

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

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Erro em /api/auth/register', error);
    return NextResponse.json(
      { error: 'Erro ao registrar usuário' },
      { status: 500 },
    );
  }
}

