import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import path from 'path';
import fs from 'fs/promises';

export async function GET(request, { params }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scanId = params.id;

    // Get the scan from the database
    const scan = await prisma.scan.findUnique({
      where: { id: scanId }
    });

    if (!scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    // Check if the scan belongs to the current user
    if (scan.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the absolute path to the image file
    const imagePath = path.join(process.cwd(), 'public', scan.filePath);

    // Check if the file exists
    try {
      await fs.access(imagePath);
    } catch (error) {
      return NextResponse.json({ error: 'Image file not found' }, { status: 404 });
    }

    // Read the file and return it
    const imageBuffer = await fs.readFile(imagePath);
    const response = new NextResponse(imageBuffer);
    
    // Set appropriate content type based on file extension
    const ext = path.extname(scan.fileName).toLowerCase();
    let contentType = 'image/jpeg';  // Default
    if (ext === '.png') contentType = 'image/png';
    if (ext === '.gif') contentType = 'image/gif';
    if (ext === '.webp') contentType = 'image/webp';
    
    response.headers.set('Content-Type', contentType);
    return response;
  } catch (error) {
    console.error('Error fetching image:', error);
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
  }
}