import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized or invalid session' }, { status: 401 });
    }

    // Get the form data
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Comprehensive validation of file object properties
    if (!file.name) {
      return NextResponse.json({ error: 'File name is missing' }, { status: 400 });
    }
    
    // Ensure file type exists or provide a default
    const fileType = file.type || 'application/octet-stream';
    
    // Ensure file size exists or calculate it
    let fileSize;
    if (file.size) {
      fileSize = file.size;
    } else {
      // If size is not available, get it from the array buffer
      const bytes = await file.arrayBuffer();
      fileSize = bytes.byteLength;
    }

    // Ensure we have a valid user ID
    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json({ error: 'Invalid user session' }, { status: 401 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', userId);
    await mkdir(uploadsDir, { recursive: true });

    // Generate a unique filename with safe extension handling
    const fileExt = path.extname(file.name) || '.bin'; // Provide default extension if missing
    const uniqueFilename = `${uuidv4()}${fileExt}`;
    const filePath = path.join(uploadsDir, uniqueFilename);
    
    // Convert file to buffer and save it
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Save file metadata to database with validated values
    const scan = await prisma.scan.create({
      data: {
        fileName: uniqueFilename,
        filePath: `/uploads/${userId}/${uniqueFilename}`,
        originalName: file.name,
        mimeType: fileType,
        size: fileSize,
        userId: userId
      }
    });

    return NextResponse.json({ success: true, scan });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}