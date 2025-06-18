'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { signIn, useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/navbar';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function Login() {
  const { data: session, status } = useSession();
  const loginRef = useRef(null);
  const decorRef = useRef(null);

  // GSAP animations
  useGSAP(() => {
    // Login card animation
    gsap.fromTo(
      '[gsap-animate="login-card"]',
      { y: 30, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: "back.out(1.7)" }
    );

    // Login elements animation
    const loginElements = gsap.utils.toArray('[gsap-animate="login-element"]');
    gsap.fromTo(loginElements, 
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.15, duration: 0.6, ease: "power2.out", delay: 0.3 }
    );
    
    // Decorative elements animation
    const decorElements = gsap.utils.toArray('[gsap-animate="decor"]');
    gsap.fromTo(decorElements,
      { scale: 0.8, opacity: 0 },
      { scale: 1, opacity: 0.15, stagger: 0.1, duration: 0.8, ease: "back.out(1.7)" }
    );
  }, { scope: loginRef });

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (status === 'authenticated') {
      redirect('/dashboard');
    }
  }, [status]);

  // Handle Google sign in
  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/dashboard' });
  };

  // Show loading state while checking session
  if (status === 'loading') {
    return (
      <main className="flex min-h-screen bg-gradient-to-b from-white to-blue-50 dark:from-gray-950 dark:to-blue-950/30 text-foreground items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em] shadow-md"></div>
          <p className="mt-4 text-blue-600 dark:text-blue-400 font-medium">Loading your secure session...</p>
        </div>
      </main>
    );
  }

  return (
    <main ref={loginRef} className="flex min-h-screen bg-gradient-to-b from-white to-blue-50 dark:from-gray-950 dark:to-blue-950/30 text-foreground items-center justify-center p-4 overflow-hidden">
      <Navbar />
      
      {/* Enhanced medical themed background */}
      <div ref={decorRef} className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Decorative elements similar to homepage */}
        <div gsap-animate="decor" className="absolute top-20 left-[10%] w-64 h-64 rounded-full bg-gradient-to-br from-blue-500/10 to-blue-600/5 blur-3xl"></div>
        <div gsap-animate="decor" className="absolute bottom-20 right-[10%] w-72 h-72 rounded-full bg-gradient-to-br from-blue-500/10 to-blue-600/5 blur-3xl"></div>
        
        {/* Medical cross pattern with improved visibility */}
        <div className="absolute inset-0 opacity-5">
          {[...Array(10)].map((_, i) => (
            <div key={i}
              gsap-animate="decor"
              className="absolute text-blue-500 text-5xl font-bold"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.3 + 0.1,
                transform: `rotate(${Math.random() * 90}deg)`
              }}>+</div>
          ))}
        </div>

        {/* Enhanced top medical heartbeat line */}
        <svg viewBox="0 0 1200 60" xmlns="http://www.w3.org/2000/svg" className="absolute top-20 w-full h-24 text-blue-500 dark:text-blue-600 opacity-15">
          <path d="M0,30 L300,30 L320,10 L340,50 L360,10 L380,50 L400,10 L420,50 L440,30 L1200,30" fill="none" stroke="currentColor" strokeWidth="2"></path>
        </svg>

        {/* Enhanced bottom medical heartbeat line */}
        <svg viewBox="0 0 1200 60" xmlns="http://www.w3.org/2000/svg" className="absolute bottom-20 w-full h-24 text-blue-500 dark:text-blue-600 opacity-15">
          <path d="M0,30 L300,30 L320,10 L340,50 L360,10 L380,50 L400,10 L420,50 L440,30 L1200,30" fill="none" stroke="currentColor" strokeWidth="2"></path>
        </svg>

        {/* Improved right side decoration - replaced DNA helix with subtle medical icons */}
        <div className="absolute right-[8%] top-1/3 opacity-10 dark:opacity-15 flex flex-col gap-12">
          {/* Stethoscope icon */}
          <div gsap-animate="decor" className="w-12 h-12 border-2 border-blue-500 dark:border-blue-400 rounded-full relative animate-float" style={{ animationDelay: "-1s" }}>
            <div className="absolute w-8 h-4 border-2 border-blue-500 dark:border-blue-400 rounded-full bottom-0 left-1/2 transform -translate-x-1/2"></div>
            <div className="absolute w-1 h-6 bg-blue-500 dark:bg-blue-400 left-1/2 transform -translate-x-1/2 top-full"></div>
          </div>
          
          {/* Pulse icon */}
          <div gsap-animate="decor" className="w-16 h-8 relative animate-float" style={{ animationDelay: "-3s" }}>
            <svg viewBox="0 0 100 30" className="w-full h-full text-blue-500 dark:text-blue-400">
              <path d="M0,15 L20,15 L30,5 L40,25 L50,5 L60,25 L70,15 L100,15" fill="none" stroke="currentColor" strokeWidth="2"></path>
            </svg>
          </div>
          
          {/* Medical cross */}
          <div gsap-animate="decor" className="w-10 h-10 relative animate-float" style={{ animationDelay: "-2s" }}>
            <div className="absolute inset-0 m-auto w-10 h-2 bg-blue-500 dark:bg-blue-400 rounded-sm"></div>
            <div className="absolute inset-0 m-auto w-2 h-10 bg-blue-500 dark:bg-blue-400 rounded-sm"></div>
          </div>
        </div>
      </div>

      {/* Enhanced Login Card with Medical Design */}
      <div gsap-animate="login-card" className="w-full max-w-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl p-10 shadow-2xl border-t-4 border-blue-500 relative z-10 flex flex-col items-center transform transition-all duration-500 hover:shadow-blue-200/20 dark:hover:shadow-blue-900/20 hover:shadow-2xl">
        {/* Enhanced Medical Logo */}
        <div gsap-animate="login-element" className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center mb-8 relative shadow-inner animate-pulse-glow">
          <div className="absolute w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-lg shadow-lg">
            <div className="absolute inset-0 m-auto w-7 h-2 bg-white rounded-sm"></div>
            <div className="absolute inset-0 m-auto w-2 h-7 bg-white rounded-sm"></div>
          </div>
        </div>

        <div className="text-center mb-10 w-full">
          <h1 gsap-animate="login-element" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-400 dark:to-blue-300 pb-2 animate-gradient">
            Login to your account
          </h1>
          <p gsap-animate="login-element" className="text-muted-foreground">
            Access your OsteoScan dashboard and bone health analysis
          </p>
        </div>

        {/* Login buttons with animation */}
        <Button 
          gsap-animate="login-element"
          onClick={handleGoogleSignIn}
          className="w-full py-6 mb-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-md hover:shadow-xl transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </Button>

        <div gsap-animate="login-element" className="text-center mt-6 text-sm text-muted-foreground">
          <p>Don&apos;t have an account? <Link href="#" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium">Contact your administrator</Link></p>
        </div>
      </div>
    </main>
  );
}