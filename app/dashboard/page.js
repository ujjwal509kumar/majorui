'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import SidebarLayout from '@/components/sidebar-layout';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { data: session, status } = useSession();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login');
    }
  }, [status]);

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
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        
        <div className="bg-card rounded-lg shadow-md p-6 border border-border">
          <div className="flex items-center gap-4 mb-6">
            {session?.user?.image && (
              <div className="relative h-16 w-16 rounded-full border-2 border-primary overflow-hidden">
                <Image 
                  src={session.user.image} 
                  alt="Profile" 
                  fill
                  sizes="64px"
                  priority
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-semibold">{session?.user?.name || 'User'}</h2>
              <p className="text-muted-foreground">{session?.user?.email}</p>
            </div>
          </div>
          
          <div className="mt-8 text-center p-8">
            <h3 className="text-xl font-medium mb-4">Welcome to your dashboard</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Get started with bone health analysis by scanning an image or viewing your previous reports.
            </p>
            <div className="flex justify-center gap-4 mt-4">
              <Button asChild className="px-6">
                <Link href="/dashboard/scan">Scan New X-Ray</Link>
              </Button>
              <Button asChild variant="outline" className="px-6">
                <Link href="/dashboard/reports">View Reports</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}