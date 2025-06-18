'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import SidebarLayout from '@/components/sidebar-layout';
import { Button } from '@/components/ui/button';
import { FileText, AlertCircle, ChevronRight } from 'lucide-react';

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

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
        <h1 className="text-3xl font-bold mb-6">Bone Analysis Reports</h1>
        
        <div className="bg-card rounded-lg shadow-md p-6 border border-border">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading reports...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <p className="text-destructive">Error: {error}</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={fetchReports}
              >
                Try Again
              </Button>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">You don&apos;t have any reports yet.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => redirect('/dashboard/scan')}
              >
                Upload an X-ray Image
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 border-r border-border pr-4">
                <h2 className="text-xl font-semibold mb-4">Your Reports</h2>
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                  {reports.map((report) => (
                    <div 
                      key={report.id} 
                      className={`p-3 rounded-lg cursor-pointer flex items-center justify-between ${selectedReport?.id === report.id ? 'bg-primary/10 border-primary' : 'bg-card hover:bg-accent'} border`}
                      onClick={() => setSelectedReport(report)}
                    >
                      <div>
                        <p className="font-medium">{report.predictedClass}</p>
                        
                        <p className="text-sm text-muted-foreground">
                          {new Date(report.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric',
                            hour12: true
                          })}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="lg:col-span-2">
                {selectedReport ? (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Report Details</h2>
                    <div className="bg-card border border-border rounded-lg overflow-hidden">
                      <div className="relative aspect-square w-full max-w-md mx-auto">
                        <Image 
                          src={`/api/images/${selectedReport.scanId}`}
                          alt="X-ray Image"
                          fill
                          sizes="(max-width: 768px) 100vw, 400px"
                          className="object-contain"
                          priority
                        />
                      </div>
                      
                      <div className="p-4">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Diagnosis</p>
                            <p className="font-medium">{selectedReport.predictedClass}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Confidence</p>
                            <p className="font-medium">{selectedReport.confidence.toFixed(2)}%</p>
                          </div>
                          <div>
                           
                            <div>
                              <p className="text-sm text-muted-foreground">Date & Time</p>
                              <p className="font-medium">
                                {new Date(selectedReport.createdAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: 'numeric',
                                  minute: 'numeric',
                                  hour12: true
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <h3 className="font-medium mb-2">Report Summary</h3>
                          <div className="bg-muted p-3 rounded text-sm">
                            <p>The analysis of your X-ray image indicates <strong>{selectedReport.predictedClass}</strong> with a confidence of <strong>{selectedReport.confidence.toFixed(2)}%</strong>.</p>
                            {selectedReport.predictedClass === 'Normal' ? (
                              <p className="mt-2">Your bone density appears to be within normal range. Continue with regular check-ups as recommended by your healthcare provider.</p>
                            ) : selectedReport.predictedClass === 'Osteopenia' ? (
                              <p className="mt-2">Your bone density is lower than normal. This condition may lead to osteoporosis if not addressed. Please consult with your healthcare provider for appropriate interventions.</p>
                            ) : (
                              <p className="mt-2">Your bone density is significantly reduced, indicating osteoporosis. This condition increases your risk of fractures. Please consult with your healthcare provider immediately for treatment options.</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-4 flex space-x-3">
                          <Button className="mt-4" onClick={() => window.open(`/api/reports/download/${selectedReport.id}`, '_blank')}>Download Report</Button>
                          <Button className="mt-4" variant="outline" onClick={() => window.open(`/api/reports/view/${selectedReport.id}`, '_blank')}>View Full Report</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Select a report to view details</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}