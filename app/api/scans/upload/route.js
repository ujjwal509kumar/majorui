import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid'; // You'll need to install this: npm install uuid

export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the form data
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', session.user.id);
    await mkdir(uploadsDir, { recursive: true });

    // Generate a unique filename
    const uniqueFilename = `${uuidv4()}${path.extname(file.name)}`;
    const filePath = path.join(uploadsDir, uniqueFilename);
    
    // Convert file to buffer and save it
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Save file metadata to database
    const scan = await prisma.scan.create({
      data: {
        fileName: uniqueFilename,
        filePath: `/uploads/${session.user.id}/${uniqueFilename}`,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        userId: session.user.id
      }
    });

    return NextResponse.json({ success: true, scan });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}