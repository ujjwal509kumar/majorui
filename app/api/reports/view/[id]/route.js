import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

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

    // Generate HTML for the report
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title> OsteoScan Bone Health Analysis Report</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        :root {
          --primary: #0070f3;
          --primary-light: #e1f0ff;
          --success: #10b981;
          --success-light: #d1fae5;
          --warning: #f59e0b;
          --warning-light: #fef3c7;
          --danger: #ef4444;
          --danger-light: #fee2e2;
          --gray-50: #f9fafb;
          --gray-100: #f3f4f6;
          --gray-200: #e5e7eb;
          --gray-300: #d1d5db;
          --gray-400: #9ca3af;
          --gray-500: #6b7280;
          --gray-600: #4b5563;
          --gray-700: #374151;
          --gray-800: #1f2937;
          --gray-900: #111827;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: var(--gray-800);
          background-color: var(--gray-50);
        }
        
        .container {
          max-width: 900px;
          margin: 0 auto;
          padding: 2rem;
          background-color: white;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border-radius: 8px;
          margin-top: 2rem;
          margin-bottom: 2rem;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--gray-200);
        }
        
        .logo {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--primary);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .logo-icon {
          width: 32px;
          height: 32px;
          background-color: var(--primary);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
        }
        
        h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--gray-900);
          margin-bottom: 1.5rem;
        }
        
        .report-meta {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
          padding: 1.5rem;
          background-color: var(--gray-50);
          border-radius: 8px;
        }
        
        .meta-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .meta-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--gray-500);
        }
        
        .meta-value {
          font-size: 1rem;
          font-weight: 600;
          color: var(--gray-800);
        }
        
        .diagnosis-card {
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .diagnosis-card.normal {
          background-color: var(--success-light);
          border-left: 4px solid var(--success);
        }
        
        .diagnosis-card.osteopenia {
          background-color: var(--warning-light);
          border-left: 4px solid var(--warning);
        }
        
        .diagnosis-card.osteoporosis {
          background-color: var(--danger-light);
          border-left: 4px solid var(--danger);
        }
        
        .diagnosis-title {
          font-size: 1.25rem;
          font-weight: 600;
        }
        
        .diagnosis-card.normal .diagnosis-title {
          color: var(--success);
        }
        
        .diagnosis-card.osteopenia .diagnosis-title {
          color: var(--warning);
        }
        
        .diagnosis-card.osteoporosis .diagnosis-title {
          color: var(--danger);
        }
        
        .diagnosis-confidence {
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .probabilities {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }
        
        .probability-card {
          padding: 1rem;
          background-color: white;
          border: 1px solid var(--gray-200);
          border-radius: 8px;
          text-align: center;
        }
        
        .probability-value {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        
        .probability-label {
          font-size: 0.875rem;
          color: var(--gray-600);
        }
        
        .normal-prob .probability-value {
          color: var(--success);
        }
        
        .osteopenia-prob .probability-value {
          color: var(--warning);
        }
        
        .osteoporosis-prob .probability-value {
          color: var(--danger);
        }
        
        .summary-section {
          margin-bottom: 2rem;
        }
        
        .section-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: var(--gray-800);
        }
        
        .summary-content {
          padding: 1.5rem;
          background-color: var(--gray-50);
          border-radius: 8px;
          line-height: 1.7;
        }
        
        .recommendations {
          margin-bottom: 2rem;
        }
        
        .recommendation-list {
          list-style-type: none;
        }
        
        .recommendation-item {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1rem;
          padding: 1rem;
          background-color: white;
          border: 1px solid var(--gray-200);
          border-radius: 8px;
        }
        
        .recommendation-icon {
          width: 24px;
          height: 24px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--primary-light);
          color: var(--primary);
          border-radius: 50%;
          font-weight: bold;
        }
        
        .footer {
          margin-top: 3rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--gray-200);
          font-size: 0.875rem;
          color: var(--gray-500);
        }
        
        .disclaimer {
          margin-top: 1rem;
          font-style: italic;
        }
        
        @media print {
          body {
            background-color: white;
          }
          
          .container {
            box-shadow: none;
            margin: 0;
            padding: 1rem;
            max-width: 100%;
          }
          
          .print-button {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">
            <div class="logo-icon">+</div>
            OsteoScan
          </div>
          <button class="print-button" onclick="window.print()" style="padding: 0.5rem 1rem; background-color: var(--primary); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">
            Print Report
          </button>
        </div>
        
        <h1>Bone Health Analysis Report</h1>
        
        <div class="report-meta">
          <div class="meta-group">
            <span class="meta-label">Patient ID</span>
            <span class="meta-value">${report.userId}</span>
          </div>
          <div class="meta-group">
            <span class="meta-label">Report ID</span>
            <span class="meta-value">${report.id}</span>
          </div>
          <div class="meta-group">
            <span class="meta-label">Date</span>
            <span class="meta-value">${report.createdAt.toLocaleDateString()}</span>
          </div>
          <div class="meta-group">
            <span class="meta-label">Time</span>
            <span class="meta-value">${report.createdAt.toLocaleTimeString()}</span>
          </div>
        </div>
        
        <div class="diagnosis-card ${report.predictedClass.toLowerCase()}">
          <div class="diagnosis-title">Diagnosis: ${report.predictedClass}</div>
          <div class="diagnosis-confidence">Confidence: ${report.confidence.toFixed(2)}%</div>
        </div>
        
        <div class="probabilities">
          <div class="probability-card normal-prob">
            <div class="probability-value">${report.classProbabilities?.Normal?.toFixed(2) || 0}%</div>
            <div class="probability-label">Normal</div>
          </div>
          <div class="probability-card osteopenia-prob">
            <div class="probability-value">${report.classProbabilities?.Osteopenia?.toFixed(2) || 0}%</div>
            <div class="probability-label">Osteopenia</div>
          </div>
          <div class="probability-card osteoporosis-prob">
            <div class="probability-value">${report.classProbabilities?.Osteoporosis?.toFixed(2) || 0}%</div>
            <div class="probability-label">Osteoporosis</div>
          </div>
        </div>
        
        <div class="summary-section">
          <h2 class="section-title">Summary</h2>
          <div class="summary-content">
            <p>${getReportSummary(report.predictedClass)}</p>
          </div>
        </div>
        
        <div class="recommendations">
          <h2 class="section-title">Recommendations</h2>
          <ul class="recommendation-list">
            ${getRecommendations(report.predictedClass).map(rec => `
              <li class="recommendation-item">
                <div class="recommendation-icon">✓</div>
                <div>${rec}</div>
              </li>
            `).join('')}
          </ul>
        </div>
        
        <div class="footer">
          <p>This report was generated on ${new Date().toLocaleString()} by the OsteoScan Bone Health Analysis System.</p>
          <p class="disclaimer">Disclaimer: This report was generated automatically by the OsteoScan Bone Health Analysis System. The results should be interpreted by a qualified healthcare professional. This tool is not intended to replace professional medical advice, diagnosis, or treatment.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    // Return the HTML response
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error viewing report:', error);
    return NextResponse.json({ error: 'Failed to view report' }, { status: 500 });
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

function getRecommendations(diagnosis) {
  const commonRecs = [
    'Schedule a follow-up appointment with your healthcare provider to discuss these results.',
    'Maintain a balanced diet rich in calcium and vitamin D.',
    'Engage in regular weight-bearing exercises as appropriate for your condition.'
  ];
  
  switch (diagnosis) {
    case 'Normal':
      return [
        ...commonRecs,
        'Continue with regular bone density screenings as recommended by your healthcare provider.',
        'Maintain a healthy lifestyle to preserve bone health.'
      ];
    case 'Osteopenia':
      return [
        ...commonRecs,
        'Discuss calcium and vitamin D supplementation with your healthcare provider.',
        'Consider lifestyle modifications to reduce risk of progression to osteoporosis.',
        'Schedule more frequent bone density screenings to monitor your condition.'
      ];
    case 'Osteoporosis':
      return [
        ...commonRecs,
        'Discuss medication options with your healthcare provider.',
        'Implement fall prevention strategies in your home and daily activities.',
        'Consider physical therapy for safe exercise recommendations.',
        'Schedule regular bone density screenings to monitor treatment effectiveness.'
      ];
    default:
      return commonRecs;
  }
}