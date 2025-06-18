'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import SidebarLayout from '@/components/sidebar-layout';
import { User, Mail, Calendar, Shield, Heart } from 'lucide-react';

// Create a Card component in shadcn style
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
      className={`text-2xl font-semibold leading-none tracking-tight ${className}`}
      {...props}
    />
  );
};

const CardContent = ({ className, ...props }) => {
  return <div className={`p-6 pt-0 ${className}`} {...props} />;
};

export default function Profile() {
  const { data: session, status } = useSession();
  const cardRef = useRef(null);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login');
    }
  }, [status]);

  // Add subtle hover animation effect
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // Reduced rotation for subtlety
      const rotateX = (y - centerY) / 30;
      const rotateY = (centerX - x) / 30;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };
    
    const handleMouseLeave = () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
    };
    
    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

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

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <SidebarLayout>
      <div className="p-6 pt-16 md:pt-6"> {/* Added top padding on mobile to fix menu overlap */}
        <h1 className="text-3xl font-bold mb-6">Profile</h1>
        
        <div className="max-w-3xl mx-auto">
          <Card 
            ref={cardRef}
            className="overflow-hidden transition-all duration-300 ease-out border-primary/10 hover:border-primary/30 hover:shadow-md relative bg-gradient-to-b from-background to-background/80"
          >
            {/* Subtle top accent */}
            <div className="h-1 w-full bg-gradient-to-r from-blue-400 to-cyan-400 opacity-80" />
            
            <CardHeader className="relative overflow-hidden pb-2">
              {/* Subtle medical cross pattern */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <div 
                    key={i} 
                    className="absolute text-primary font-thin"
                    style={{
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      fontSize: `${Math.random() * 1.5 + 1}rem`,
                      opacity: 0.7,
                      transform: `rotate(${Math.random() * 45}deg)`
                    }}
                  >
                    +
                  </div>
                ))}
              </div>
              
              <div className="flex flex-col md:flex-row items-center gap-6 z-10">
                {/* Profile image with subtle glow */}
                <div className="relative h-24 w-24 rounded-full overflow-hidden shadow-sm border-2 border-primary/5 transition-all duration-300 hover:border-primary/20 group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-cyan-50/30 dark:from-blue-900/10 dark:to-cyan-900/10 z-0 group-hover:opacity-70 transition-opacity duration-300" />
                  
                  {session?.user?.image ? (
                    <Image 
                      src={session.user.image} 
                      alt="Profile" 
                      fill
                      sizes="96px"
                      priority
                      className="object-cover z-10"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center z-10">
                      <User className="h-12 w-12 text-primary/40" />
                    </div>
                  )}
                </div>
                
                <div className="text-center md:text-left">
                  <CardTitle className="mb-1 text-primary/90">{session?.user?.name || 'User'}</CardTitle>
                  <p className="text-muted-foreground">{session?.user?.email}</p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800/50">
                      <Shield className="w-3 h-3 mr-1" /> Patient
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg border border-primary/5 bg-card shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow">
                    <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      <p className="font-medium">{session?.user?.name || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 rounded-lg border border-primary/5 bg-card shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow">
                    <div className="h-10 w-10 rounded-full bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email Address</p>
                      <p className="font-medium">{session?.user?.email || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 rounded-lg border border-primary/5 bg-card shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow">
                  <div className="h-10 w-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Account Created</p>
                    <p className="font-medium">{formatDate(session?.user?.createdAt)}</p>
                  </div>
                </div>
                
                {/* Subtle heartbeat line at bottom */}
                <div className="w-full h-6 flex items-center justify-center opacity-30 mt-2">
                  <svg height="20" width="100%" className="text-primary/40">
                    <path 
                      d="M0,10 L5,10 L10,2 L15,18 L20,0 L25,10 L30,10 L35,4 L40,16 L45,10 L100,10" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarLayout>
  );
}