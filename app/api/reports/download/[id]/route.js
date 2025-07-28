import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import puppeteer from 'puppeteer';

export async function GET(request, { params }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reportId = params.id;

    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    // Get the report from the database
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        scan: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Check if the report belongs to the current user
    if (report.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate PDF report
    const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const pdfBuffer = await generatePDFReport(report, session.user, baseUrl);

    // Create the response with PDF for direct download
    const response = new NextResponse(pdfBuffer);
    response.headers.set('Content-Type', 'application/pdf');
    response.headers.set('Content-Disposition', `attachment; filename="bone-health-report-${reportId}.pdf"`);
    response.headers.set('Cache-Control', 'no-cache');

    return response;
  } catch (error) {
    console.error('Error downloading report:', error);
    return NextResponse.json({
      error: 'Failed to download report',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

async function generatePDFReport(report, user, baseUrl) {
  // Get the image data directly from file system
  let imageDataUrl = '';
  try {
    const path = await import('path');
    const fs = await import('fs/promises');

    // Get the scan data to find the file path
    const scan = await prisma.scan.findUnique({
      where: { id: report.scanId }
    });

    if (scan && scan.filePath) {
      const imagePath = path.join(process.cwd(), 'public', scan.filePath);
      const imageBuffer = await fs.readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');

      // Determine content type from file extension
      const ext = path.extname(scan.fileName).toLowerCase();
      let contentType = 'image/jpeg';
      if (ext === '.png') contentType = 'image/png';
      if (ext === '.gif') contentType = 'image/gif';
      if (ext === '.webp') contentType = 'image/webp';

      imageDataUrl = `data:${contentType};base64,${base64Image}`;
    }
  } catch (error) {
    console.error('Error reading image file:', error);
  }

  const htmlContent = generateHTMLReport(report, user, baseUrl, imageDataUrl);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    return pdfBuffer;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function generateHTMLReport(report, user, baseUrl = '', imageDataUrl = '') {
  const reportDate = report.createdAt ? new Date(report.createdAt) : new Date();
  const diagnosis = report.predictedClass || 'Unknown';
  const confidence = report.confidence || 0;

  // Get diagnosis color
  const getDiagnosisColor = (diagnosis) => {
    if (!diagnosis) return '#64748b';
    switch (diagnosis.toLowerCase()) {
      case 'normal': return '#10b981';
      case 'osteopenia': return '#f59e0b';
      case 'osteoporosis': return '#ef4444';
      default: return '#64748b';
    }
  };

  const diagnosisColor = getDiagnosisColor(diagnosis);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bone Health Analysis Report</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.4;
            margin: 0;
            padding: 15px;
            background-color: white;
            font-size: 12px;
        }
        .container {
            max-width: 100%;
            margin: 0 auto;
            background: white;
        }
        .header {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            padding: 20px;
            margin-bottom: 18px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 22px;
            font-weight: bold;
            letter-spacing: 0.5px;
        }
        .header p {
            margin: 5px 0 0 0;
            opacity: 0.9;
            font-size: 13px;
        }
        .main-content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 18px;
            margin-bottom: 15px;
        }
        .left-column, .right-column {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .recommendations-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 18px;
            margin-bottom: 12px;
        }
        .section {
            margin: 0;
        }
        .section h2 {
            color: #1f2937;
            font-size: 15px;
            margin: 0 0 10px 0;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 4px;
            font-weight: 600;
        }
        .patient-info {
            background: #f8fafc;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 8px;
        }
        .info-item {
            margin: 0;
            font-size: 11px;
        }
        .info-label {
            font-weight: 600;
            color: #374151;
            display: inline-block;
            width: 70px;
        }
        .image-container {
            text-align: center;
            background: #f8fafc;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
        }
        .xray-image {
            max-width: 100%;
            max-height: 180px;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            background: white;
            padding: 6px;
        }
        .image-caption {
            margin-top: 4px;
            color: #6b7280;
            font-size: 9px;
            font-style: italic;
        }
        .image-placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 200px;
            background: #f3f4f6;
            border: 2px dashed #d1d5db;
            border-radius: 4px;
            color: #6b7280;
        }
        .image-placeholder p {
            margin: 5px 0;
        }
        .summary-box {
            background: #f8fafc;
            padding: 15px;
            border-radius: 6px;
            border-left: 3px solid #10b981;
        }
        .summary-content {
            font-size: 11px;
            line-height: 1.5;
            margin: 0;
        }
        .diagnosis-box {
            border: 2px solid ${diagnosisColor};
            border-radius: 4px;
            overflow: hidden;
        }
        .diagnosis-header {
            background: ${diagnosisColor};
            color: white;
            padding: 6px;
            font-weight: bold;
            font-size: 10px;
            text-align: center;
        }
        .diagnosis-content {
            padding: 15px;
            background: white;
            text-align: center;
        }
        .diagnosis-result {
            font-size: 18px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 8px;
        }
        .confidence-info {
            font-size: 11px;
            margin-bottom: 8px;
        }
        .confidence-bar {
            background: #f3f4f6;
            height: 6px;
            border-radius: 3px;
            overflow: hidden;
            margin: 0 auto;
            width: 100px;
        }
        .confidence-fill {
            background: ${diagnosisColor};
            height: 100%;
            width: ${confidence}%;
        }
        .recommendations-box {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #2563eb;
        }
        .recommendations-left, .recommendations-right {
            background: #f8fafc;
            padding: 15px;
            border-radius: 6px;
            border-left: 3px solid #2563eb;
        }
        .recommendations-list {
            white-space: pre-line;
            font-size: 11px;
            line-height: 1.6;
            margin: 0;
        }
        .summary-box {
            background: #f8fafc;
            padding: 15px;
            border-radius: 6px;
            border-left: 3px solid #10b981;
        }
        .summary-content {
            font-size: 11px;
            line-height: 1.5;
            margin: 0;
        }
        .disclaimer {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            padding: 12px;
            border-radius: 6px;
            margin: 12px 0 0 0;
            grid-column: 1 / -1;
        }
        .disclaimer h3 {
            color: #92400e;
            margin: 0 0 6px 0;
            font-size: 11px;
            font-weight: 600;
        }
        .disclaimer p {
            color: #92400e;
            font-size: 10px;
            margin: 0;
            line-height: 1.4;
        }
        .footer {
            text-align: center;
            color: #6b7280;
            font-size: 10px;
            margin-top: 12px;
            padding-top: 8px;
            border-top: 1px solid #e5e7eb;
        }
        @media print {
            body { 
                background: white;
                font-size: 11px;
            }
            .container { 
                box-shadow: none;
            }
            .xray-image { 
                max-height: 180px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>BONE HEALTH ANALYSIS REPORT</h1>
            <p>AI-Powered Bone Density Assessment</p>
        </div>

        <div class="main-content">
            <div class="left-column">
                <div class="section">
                    <h2>PATIENT INFORMATION</h2>
                    <div class="patient-info">
                        <div class="info-grid">
                            <div class="info-item">
                                <span class="info-label">Patient:</span> ${user.name || 'N/A'}
                            </div>
                            <div class="info-item">
                                <span class="info-label">Email:</span> ${user.email || 'N/A'}
                            </div>
                            <div class="info-item">
                                <span class="info-label">Report ID:</span> ${report.id}
                            </div>
                            <div class="info-item">
                                <span class="info-label">Date:</span> ${reportDate.toLocaleDateString('en-US')}
                            </div>
                            <div class="info-item">
                                <span class="info-label">Time:</span> ${reportDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h2>X-RAY IMAGE</h2>
                    <div class="image-container">
                        ${imageDataUrl ?
      `<img src="${imageDataUrl}" alt="X-ray Image" class="xray-image" />` :
      `<div class="image-placeholder">
                                <p>X-ray image not available</p>
                                <p style="font-size: 8px; color: #6b7280;">Scan ID: ${report.scanId}</p>
                            </div>`
    }
                        <p class="image-caption">Analyzed X-ray image</p>
                    </div>
                </div>
            </div>

            <div class="right-column">
                <div class="section">
                    <h2>DIAGNOSIS RESULTS</h2>
                    <div class="diagnosis-box">
                        <div class="diagnosis-header">
                            PRIMARY DIAGNOSIS
                        </div>
                        <div class="diagnosis-content">
                            <div class="diagnosis-result">${diagnosis.toUpperCase()}</div>
                            <div class="confidence-info">
                                <strong>Confidence:</strong> ${confidence.toFixed(1)}%
                            </div>
                            <div class="confidence-bar">
                                <div class="confidence-fill"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h2>ANALYSIS SUMMARY</h2>
                    <div class="summary-box">
                        <div class="summary-content">
                            ${getSummaryContent(diagnosis, confidence)}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="recommendations-section">
            <div class="section">
                <h2>KEY RECOMMENDATIONS</h2>
                <div class="recommendations-left">
                    <div class="recommendations-list">${getRecommendationsLeft(diagnosis)}</div>
                </div>
            </div>
            <div class="section">
                <h2>ADDITIONAL GUIDANCE</h2>
                <div class="recommendations-right">
                    <div class="recommendations-list">${getRecommendationsRight(diagnosis)}</div>
                </div>
            </div>
        </div>

        <div class="disclaimer">
            <h3>IMPORTANT MEDICAL DISCLAIMER</h3>
            <p>This report is generated by an AI system and is for informational purposes only. It should not replace professional medical advice, diagnosis, or treatment. Please consult with a qualified healthcare provider for proper medical evaluation and treatment recommendations.</p>
        </div>

        <div class="footer">
            <p>Generated on ${new Date().toLocaleString()} | Bone Health Analysis System</p>
        </div>
    </div>

    <script>
        // Auto-print functionality (optional)
        // window.onload = function() { window.print(); }
    </script>
</body>
</html>
  `;
}



function getSummaryContent(diagnosis, confidence) {
  const confidenceLevel = confidence >= 90 ? 'High' : confidence >= 70 ? 'Moderate' : 'Low';

  switch (diagnosis.toLowerCase()) {
    case 'normal':
      return `Your bone density analysis shows <strong>normal</strong> results with ${confidenceLevel.toLowerCase()} confidence (${confidence.toFixed(1)}%). This indicates healthy bone structure and density for your age group. Continue maintaining your current lifestyle and follow routine screening recommendations.`;

    case 'osteopenia':
      return `The analysis indicates <strong>osteopenia</strong> with ${confidenceLevel.toLowerCase()} confidence (${confidence.toFixed(1)}%). This represents lower than normal bone density but not yet osteoporosis. Early intervention can help prevent progression and improve bone health.`;

    case 'osteoporosis':
      return `The analysis shows <strong>osteoporosis</strong> with ${confidenceLevel.toLowerCase()} confidence (${confidence.toFixed(1)}%). This indicates significantly reduced bone density requiring immediate medical attention. Proper treatment can help manage the condition and reduce fracture risk.`;

    default:
      return `Bone density analysis completed with ${confidenceLevel.toLowerCase()} confidence (${confidence.toFixed(1)}%). Please consult with your healthcare provider to discuss these results and determine appropriate next steps.`;
  }
}

function getRecommendationsLeft(diagnosis) {
  if (!diagnosis) diagnosis = 'Unknown';
  switch (diagnosis.toLowerCase()) {
    case 'normal':
      return '• Continue current healthy lifestyle practices\n• Maintain regular weight-bearing exercises\n• Ensure adequate calcium (1000-1200mg daily)\n• Ensure adequate vitamin D (800-1000 IU daily)\n• Avoid smoking and limit alcohol consumption\n• Schedule routine bone density screenings';

    case 'osteopenia':
      return '• Consult with your healthcare provider immediately\n• Increase weight-bearing and resistance exercises\n• Optimize calcium and vitamin D intake\n• Consider bone-building medications if recommended\n• Implement fall prevention strategies at home\n• Avoid smoking and limit alcohol consumption';

    case 'osteoporosis':
      return '• URGENT: Schedule immediate medical consultation\n• Discuss prescription medications for treatment\n• Implement comprehensive fall prevention strategies\n• Begin supervised exercise program\n• Ensure optimal calcium and vitamin D supplementation\n• Consider specialist referral (endocrinologist)';

    default:
      return '• Schedule follow-up consultation with healthcare provider\n• Discuss these results in context of overall health\n• Consider additional diagnostic testing if recommended\n• Maintain healthy lifestyle practices for bone health';
  }
}

function getRecommendationsRight(diagnosis) {
  if (!diagnosis) diagnosis = 'Unknown';
  switch (diagnosis.toLowerCase()) {
    case 'normal':
      return '• Discuss with healthcare provider about screening intervals\n• Consider fall prevention strategies\n• Maintain balanced diet rich in bone-supporting nutrients\n• Stay physically active with resistance training\n• Monitor bone health regularly\n• Follow up as recommended by your doctor';

    case 'osteopenia':
      return '• Schedule more frequent bone density monitoring\n• Consider consultation with endocrinologist or rheumatologist\n• Evaluate and address other risk factors for bone loss\n• Review medications that may affect bone health\n• Consider physical therapy for balance and strength\n• Discuss lifestyle modifications with healthcare team';

    case 'osteoporosis':
      return '• Evaluate home safety and remove fall hazards\n• Discuss fracture risk assessment and prevention\n• Schedule regular monitoring and follow-up appointments\n• Consider bone-building medications as prescribed\n• Review all medications with healthcare provider\n• Join support groups or educational programs';

    default:
      return '• Follow healthcare provider\'s specific recommendations\n• Schedule appropriate follow-up screenings\n• Address any questions or concerns with medical team\n• Maintain regular communication with healthcare providers\n• Keep records of all bone health assessments\n• Stay informed about bone health best practices';
  }
}