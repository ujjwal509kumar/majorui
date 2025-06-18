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

    const reportId = params.id;

    // Get the report from the database
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: { scan: true }
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Check if the report belongs to the current user
    if (report.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate a text report
    const reportText = `
    BONE HEALTH ANALYSIS REPORT
    ===========================
    
    Date: ${report.createdAt.toLocaleDateString()}
    Time: ${report.createdAt.toLocaleTimeString()}
    
    DIAGNOSIS: ${report.predictedClass}
    CONFIDENCE: ${report.confidence.toFixed(2)}%
    
    SUMMARY:
    ${getReportSummary(report.predictedClass)}
    
    This report was generated automatically by the Bone Health Analysis System.
    Please consult with a healthcare professional for proper medical advice.
    `;

    // Create the response with the report text
    const response = new NextResponse(reportText);
    response.headers.set('Content-Type', 'text/plain');
    response.headers.set('Content-Disposition', `attachment; filename="report-${reportId}.txt"`);
    
    return response;
  } catch (error) {
    console.error('Error downloading report:', error);
    return NextResponse.json({ error: 'Failed to download report' }, { status: 500 });
  }
}

function getReportSummary(diagnosis) {
  switch (diagnosis) {
    case 'Normal':
      return 'Your bone density appears to be within normal range. Continue with regular check-ups as recommended by your healthcare provider.';
    case 'Osteopenia':
      return 'Your bone density is lower than normal. This condition may lead to osteoporosis if not addressed. Please consult with your healthcare provider for appropriate interventions.';
    case 'Osteoporosis':
      return 'Your bone density is significantly reduced, indicating osteoporosis. This condition increases your risk of fractures. Please consult with your healthcare provider immediately for treatment options.';
    default:
      return 'Analysis complete. Please consult with your healthcare provider to discuss these results.';
  }
}