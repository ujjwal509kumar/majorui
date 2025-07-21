import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageId } = await request.json();
    
    if (!imageId) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    const uploadResponse = await fetch('http://localhost:8000/upload/', {
      method: 'POST',
      body: formData, 
      headers: {
        'user_id': session.user.id
      }
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload to Python backend');
    }

    const uploadResult = await uploadResponse.json();

    const predictionResponse = await fetch(`http://localhost:8000/predict/${uploadResult.image_id}?user_id=${session.user.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!predictionResponse.ok) {
      throw new Error('Failed to get prediction from Python backend');
    }

    const prediction = await predictionResponse.json();

    const report = await prisma.report.create({
      data: {
        scanId: imageId, 
        reportPath: `/reports/${prediction.report_id}.json`,
        predictedClass: prediction.predicted_class,
        confidence: prediction.confidence,
        userId: session.user.id
      }
    });

    return NextResponse.json({
      success: true,
      prediction,
      report
    });

  } catch (error) {
    console.error('Error making prediction:', error);
    return NextResponse.json(
      { error: 'Failed to make prediction' },
      { status: 500 }
    );
  }
}