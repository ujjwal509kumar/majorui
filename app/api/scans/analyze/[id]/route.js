import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
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

    // Upload the image to the FastAPI backend
    const formData = new FormData();
    const imageFile = await fs.readFile(imagePath);
    // Create the blob with the correct MIME type
    const blob = new Blob([imageFile], { type: scan.mimeType || 'image/png' });
    formData.append('file', blob, scan.fileName);

    const uploadResponse = await fetch('http://localhost:8000/upload/', {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      throw new Error(errorData.detail || 'Failed to upload image to analysis service');
    }

    const uploadData = await uploadResponse.json();
    const imageId = uploadData.image_id;

    // Send the image for prediction
    const predictionResponse = await fetch(`http://localhost:8000/predict/${imageId}`, {
      method: 'POST',
    });

    if (!predictionResponse.ok) {
      const errorData = await predictionResponse.json();
      throw new Error(errorData.detail || 'Failed to analyze image');
    }

    const predictionData = await predictionResponse.json();

    // Create a report in the database
    const report = await prisma.report.create({
      data: {
        scanId: scan.id,
        reportPath: `/reports/${predictionData.report_id}.json`,
        predictedClass: predictionData.predicted_class,
        confidence: predictionData.confidence,
        userId: session.user.id,
      }
    });

    return NextResponse.json({
      id: report.id,
      predictedClass: report.predictedClass,
      confidence: report.confidence,
      createdAt: report.createdAt,
    });
  } catch (error) {
    console.error('Error analyzing image:', error);
    return NextResponse.json({ error: error.message || 'Failed to analyze image' }, { status: 500 });
  }
}