'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import SidebarLayout from '@/components/sidebar-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ArrowUpDown, TrendingDown, TrendingUp, Minus } from 'lucide-react';

export default function CompareReportsPage() {
  const { data: session, status } = useSession();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [firstReport, setFirstReport] = useState(null);
  const [secondReport, setSecondReport] = useState(null);
  const [comparison, setComparison] = useState(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login');
    }
  }, [status]);

  // Fetch user's reports when component mounts
  useEffect(() => {
    if (status === 'authenticated') {
      fetchReports();
    }
  }, [status]);

  // Calculate comparison when both reports are selected
  useEffect(() => {
    if (firstReport && secondReport) {
      calculateComparison();
    } else {
      setComparison(null);
    }
  }, [firstReport, secondReport]);

  // Fetch reports from API
  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/reports');
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }
      const data = await response.json();
      setReports(data.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate comparison between two reports
  const calculateComparison = () => {
    if (!firstReport || !secondReport) return;

    // Get bone health status based on predicted class
    const getBoneHealthScore = (report) => {
      switch (report.predictedClass) {
        case 'Normal': return 100;
        case 'Osteopenia': return 50;
        case 'Osteoporosis': return 20;
        default: return 0;
      }
    };

    const firstScore = getBoneHealthScore(firstReport);
    const secondScore = getBoneHealthScore(secondReport);
    const scoreDifference = secondScore - firstScore;

    // Determine if there's improvement or decline
    let status = 'unchanged';
    if (scoreDifference > 0) status = 'improved';
    if (scoreDifference < 0) status = 'declined';

    // Calculate time difference between reports
    const firstDate = new Date(firstReport.createdAt);
    const secondDate = new Date(secondReport.createdAt);
    const daysDifference = Math.abs(Math.round((secondDate - firstDate) / (1000 * 60 * 60 * 24)));

    // Generate recommendations based on comparison
    let recommendations = [];
    if (status === 'declined') {
      recommendations = [
        'Consider increasing calcium and vitamin D intake',
        'Consult with your healthcare provider about bone density medications',
        'Incorporate weight-bearing exercises into your routine',
        'Reduce alcohol consumption and quit smoking if applicable'
      ];
    } else if (status === 'improved') {
      recommendations = [
        'Continue your current treatment plan',
        'Maintain regular exercise and healthy diet',
        'Schedule follow-up appointments as recommended by your healthcare provider',
        'Monitor for any new symptoms or concerns'
      ];
    } else {
      recommendations = [
        'Maintain your current bone health regimen',
        'Continue regular check-ups with your healthcare provider',
        'Ensure adequate calcium and vitamin D intake',
        'Stay physically active with weight-bearing exercises'
      ];
    }

    setComparison({
      firstScore,
      secondScore,
      scoreDifference,
      status,
      daysDifference,
      recommendations
    });
  };

  // Show loading state while checking session
  if (status === 'loading') {
    return (
      <main className="flex min-h-screen bg-background text-foreground items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <SidebarLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Compare Reports</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* First Report Selection */}
          <Card>
            <CardHeader>
              <CardTitle>First Report</CardTitle>
              <CardDescription>Select an earlier report for comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={firstReport?.id || ''}
                onValueChange={(value) => {
                  const selected = reports.find(r => r.id === value);
                  setFirstReport(selected);
                }}
                disabled={loading || reports.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a report" />
                </SelectTrigger>
                <SelectContent>
                  {reports.map((report) => (
                    <SelectItem key={report.id} value={report.id}>
                      {report.predictedClass} - {new Date(report.createdAt).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {firstReport && (
                <div className="mt-4">
                  <div className="bg-muted p-3 rounded">
                    <p><strong>Diagnosis:</strong> {firstReport.predictedClass}</p>
                    <p><strong>Confidence:</strong> {firstReport.confidence.toFixed(2)}%</p>
                    <p><strong>Date:</strong> {new Date(firstReport.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Second Report Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Second Report</CardTitle>
              <CardDescription>Select a more recent report for comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={secondReport?.id || ''}
                onValueChange={(value) => {
                  const selected = reports.find(r => r.id === value);
                  setSecondReport(selected);
                }}
                disabled={loading || reports.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a report" />
                </SelectTrigger>
                <SelectContent>
                  {reports.map((report) => (
                    <SelectItem key={report.id} value={report.id}>
                      {report.predictedClass} - {new Date(report.createdAt).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {secondReport && (
                <div className="mt-4">
                  <div className="bg-muted p-3 rounded">
                    <p><strong>Diagnosis:</strong> {secondReport.predictedClass}</p>
                    <p><strong>Confidence:</strong> {secondReport.confidence.toFixed(2)}%</p>
                    <p><strong>Date:</strong> {new Date(secondReport.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Comparison Results */}
        {comparison && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Comparison Results
                {comparison.status === 'improved' && <TrendingUp className="text-green-500" />}
                {comparison.status === 'declined' && <TrendingDown className="text-red-500" />}
                {comparison.status === 'unchanged' && <Minus className="text-yellow-500" />}
              </CardTitle>
              <CardDescription>
                Comparing reports from {new Date(firstReport.createdAt).toLocaleDateString()} and {new Date(secondReport.createdAt).toLocaleDateString()}
                ({comparison.daysDifference} days difference)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Bone Health Score</span>
                    <span className="flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4" />
                      {Math.abs(comparison.scoreDifference)}% 
                      {comparison.status === 'improved' ? 'improvement' : comparison.status === 'declined' ? 'decline' : 'no change'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">First Report</div>
                    <Progress value={comparison.firstScore} className="h-2" />
                    <div className="text-sm text-muted-foreground">Second Report</div>
                    <Progress value={comparison.secondScore} className="h-2" />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Status Change</h3>
                  <div className={`p-3 rounded-md ${comparison.status === 'improved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : comparison.status === 'declined' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'}`}>
                    {comparison.status === 'improved' && 'Your bone health has improved since the previous report.'}
                    {comparison.status === 'declined' && 'Your bone health has declined since the previous report.'}
                    {comparison.status === 'unchanged' && 'Your bone health status remains unchanged since the previous report.'}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Recommendations</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {comparison.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => window.print()}>Print Comparison</Button>
            </CardFooter>
          </Card>
        )}

        {/* No Reports Selected Message */}
        {!comparison && firstReport && secondReport && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Select two different reports to compare</p>
            </CardContent>
          </Card>
        )}

        {/* Back Button */}
        <Button variant="outline" onClick={() => window.location.href = '/dashboard/reports'}>
          Back to Reports
        </Button>
      </div>
    </SidebarLayout>
  );
}