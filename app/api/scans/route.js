import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all scans for the current user
    const scans = await prisma.scan.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        uploadedAt: 'desc'
      }
    });

    return NextResponse.json({ scans });
  } catch (error) {
    console.error('Error fetching scans:', error);
    return NextResponse.json({ error: 'Failed to fetch scans' }, { status: 500 });
  }
}