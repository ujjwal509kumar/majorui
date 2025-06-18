'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import SidebarLayout from '@/components/sidebar-layout';
import { Button } from '@/components/ui/button';
import { Upload, ImagePlus, X, FileText, Loader2 } from 'lucide-react';

// Card components in shadcn style
const Card = ({ className, ...props }) => {
  return (
    <div
      className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}
      {...props}
    />
  );
};

const CardHeader = ({ className, ...props }) => {
  return (
    <div
      className={`flex flex-col space-y-1.5 p-6 ${className}`}
      {...props}
    />
  );
};

const CardTitle = ({ className, ...props }) => {
  return (
    <h3
      className={`text-xl font-semibold leading-none tracking-tight ${className}`}
      {...props}
    />
  );
};

const CardContent = ({ className, ...props }) => {
  return <div className={`p-6 pt-0 ${className}`} {...props} />;
};

export default function ScanPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login');
    }
  }, [status]);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
      setUploadError(null);
      setAnalysisResult(null);
    }
  };

  // Clear selected image
  const clearImage = () => {
    setSelectedImage(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setAnalysisResult(null);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedImage) return;

    setIsUploading(true);
    setUploadError(null);
    setAnalysisResult(null);

    try {
      // Step 1: Upload the image to our Next.js API
      const formData = new FormData();
      formData.append('file', selectedImage);

      const uploadResponse = await fetch('/api/scans/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const uploadData = await uploadResponse.json();
      setIsUploading(false);
      setIsAnalyzing(true);

      // Step 2: Send the image to the FastAPI backend for analysis
      const analysisResponse = await fetch(`/api/scans/analyze/${uploadData.scan.id}`);
            
      if (!analysisResponse.ok) {
        const errorData = await analysisResponse.json();
        throw new Error(errorData.error || 'Failed to analyze image');
      }
      
      // Parse the response only once
      const analysisData = await analysisResponse.json();
      
      // Check if the response includes the report ID
      console.log('Analysis data:', analysisData);
      
      // Make sure we have a reportId
      if (!analysisData.reportId && analysisData.id) {
        // If the API returns id instead of reportId, use that
        analysisData.reportId = analysisData.id;
      }
      
      setAnalysisResult(analysisData);
      
      // Remove the automatic redirection
      // setTimeout(() => {
      //   router.push('/dashboard/reports');
      // }, 3000);
      
    } catch (error) {
      console.error('Error processing image:', error);
      setUploadError(error.message);
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
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
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Bone Analysis Scan</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Upload X-ray Image</CardTitle>
            <p className="text-muted-foreground mt-2">
              Upload an X-ray image to analyze for bone health issues. The AI model will detect if there are signs of osteoporosis or osteopenia.
            </p>
          </CardHeader>
          
          <CardContent>
            {analysisResult ? (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                  <FileText className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-medium mb-2">Analysis Complete!</h3>
                <p className="mb-6">Diagnosis: <span className="font-medium">{analysisResult.predictedClass}</span> (Confidence: {analysisResult.confidence.toFixed(2)}%)</p>
                
                <div className="flex space-x-3 justify-center">
                  <Button onClick={() => router.push('/dashboard/reports')}>Go to Reports</Button>
                  <Button variant="outline" onClick={() => window.open(`/api/reports/view/${analysisResult.reportId}`, '_blank')}>View Full Report</Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid w-full gap-4">
                  {previewUrl ? (
                    <div className="relative border rounded-xl p-4 bg-muted/20 flex justify-center">
                      <div className="relative max-w-md">
                        <div className="absolute top-2 right-2 z-10">
                          <Button 
                            type="button" 
                            variant="destructive" 
                            size="icon" 
                            onClick={clearImage}
                            className="h-8 w-8 rounded-full shadow-sm"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="overflow-hidden rounded-lg shadow-sm border bg-background">
                          <div className="relative aspect-square max-w-md overflow-hidden">
                            <Image 
                              src={previewUrl} 
                              alt="Preview" 
                              fill
                              sizes="(max-width: 768px) 100vw, 400px"
                              className="object-contain"
                              priority
                            />
                          </div>
                          <div className="p-2 text-center border-t bg-muted/10">
                            <p className="text-sm text-muted-foreground truncate">
                              {selectedImage?.name}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="relative flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 transition-all hover:bg-muted/5 border-muted-foreground/50 hover:border-primary"
                    >
                      <ImagePlus className="h-16 w-16 text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground mb-2">Drag and drop your image here</p>
                      <p className="text-xs text-muted-foreground mb-4">Supported formats: JPG, PNG, JPEG</p>
                      <Button type="button" variant="outline" onClick={() => document.getElementById('file-upload').click()}>
                        <Upload className="mr-2 h-4 w-4" /> Select File
                      </Button>
                      <input 
                        id="file-upload" 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileChange}
                      />
                    </div>
                  )}
                </div>
                
                {uploadError && (
                  <div className="text-destructive text-sm text-center p-2 bg-destructive/10 rounded-md">
                    {uploadError}
                  </div>
                )}
                
                {previewUrl && (
                  <div className="flex justify-center pt-2">
                    <Button 
                      type="submit" 
                      className="px-8"
                      disabled={isUploading || isAnalyzing}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                        </>
                      ) : isAnalyzing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
                        </>
                      ) : (
                        'Analyze X-ray'
                      )}
                    </Button>
                  </div>
                )}
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}