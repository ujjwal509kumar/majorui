'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Navbar from "@/components/navbar";
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function Home() {
  const heroRef = useRef(null);
  const decorRef = useRef(null);
  const featuresRef = useRef(null);
  
  // GSAP animations
  useGSAP(() => {
    // Hero elements animation
    const heroElements = gsap.utils.toArray('[gsap-animate="hero"]');
    gsap.fromTo(heroElements, 
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.2, duration: 1, ease: "power3.out" }
    );
    
    // Decorative elements animation
    const decorElements = gsap.utils.toArray('[gsap-animate="decor"]');
    gsap.fromTo(decorElements,
      { scale: 0.8, opacity: 0 },
      { scale: 1, opacity: 1, stagger: 0.15, duration: 0.8, ease: "back.out(1.7)" }
    );

    // Features animation on scroll
    gsap.fromTo(
      '[gsap-animate="feature"]',
      { y: 30, opacity: 0 },
      { 
        y: 0, 
        opacity: 1, 
        stagger: 0.1, 
        duration: 0.7, 
        ease: "power2.out",
        scrollTrigger: {
          trigger: featuresRef.current,
          start: "top 80%",
        }
      }
    );
  }, { scope: heroRef });

  return (
    <main className="flex flex-col min-h-screen bg-background text-foreground overflow-hidden mt-10">
      <Navbar />
      
      {/* Hero Section with GSAP animations */}
      <section ref={heroRef} className="relative flex flex-col items-center justify-center py-24 px-4 overflow-hidden">
        {/* Decorative elements */}
        <div ref={decorRef} className="absolute inset-0 overflow-hidden pointer-events-none">
          <div gsap-animate="decor" className="absolute top-20 left-[10%] w-64 h-64 rounded-full bg-gradient-to-br from-blue-500/10 to-blue-600/5 blur-3xl"></div>
          <div gsap-animate="decor" className="absolute bottom-20 right-[10%] w-72 h-72 rounded-full bg-gradient-to-br from-blue-500/10 to-blue-600/5 blur-3xl"></div>
          
          {/* Medical-themed decorative elements */}
          <div gsap-animate="decor" className="absolute top-[30%] right-[15%] w-16 h-16 animate-float opacity-20 dark:opacity-30">
            <div className="w-full h-full border-4 border-blue-500 dark:border-blue-400 rounded-full"></div>
            <div className="absolute inset-0 border-t-4 border-transparent animate-spin-slow"></div>
          </div>
          
          <div gsap-animate="decor" className="absolute bottom-[25%] left-[20%] w-20 h-20 animate-float opacity-20 dark:opacity-30" style={{ animationDelay: "-2s" }}>
            <div className="w-full h-full border-4 border-dashed border-blue-500 dark:border-blue-400 rounded-full"></div>
          </div>

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

          {/* Added heartbeat line */}
          <svg viewBox="0 0 1200 60" xmlns="http://www.w3.org/2000/svg" className="absolute top-10 w-full h-24 text-blue-500 dark:text-blue-600 opacity-10">
            <path d="M0,30 L300,30 L320,10 L340,50 L360,10 L380,50 L400,10 L420,50 L440,30 L1200,30" fill="none" stroke="currentColor" strokeWidth="2"></path>
          </svg>
        </div>
        
        {/* Hero content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Medical cross logo with glow effect */}
          <div gsap-animate="hero" className="mx-auto mb-8 w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-lg shadow-lg relative animate-pulse-glow">
            <div className="absolute inset-0 m-auto w-12 h-3 bg-white dark:bg-gray-900 rounded-sm"></div>
            <div className="absolute inset-0 m-auto w-3 h-12 bg-white dark:bg-gray-900 rounded-sm"></div>
          </div>
          
          <h1 gsap-animate="hero" className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-400 dark:to-blue-300 animate-gradient">
            OsteoScan
          </h1>
          
          <p gsap-animate="hero" className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Advanced bone health analysis with clinical-grade precision and AI-powered diagnostics.
          </p>
          
          <div gsap-animate="hero">
            <Button
              size="lg"
              className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-md hover:shadow-xl transition-all"
              asChild
            >
              <Link href="/login">Get Started</Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Advanced Bone Health Analysis Section */}
      <section ref={featuresRef} className="py-20 px-4 bg-gradient-to-b from-background to-blue-50/50 dark:from-background dark:to-blue-950/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Advanced Bone Health Analysis</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Our cutting-edge technology provides detailed insights into bone density, structure, and potential fracture risks.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            {[
              {
                title: "Precision Scanning",
                description: "High-resolution imaging for accurate bone density measurements and structural analysis."
              },
              {
                title: "AI-Powered Analysis",
                description: "Advanced algorithms detect subtle changes in bone structure that might indicate early signs of osteoporosis."
              },
              {
                title: "Comprehensive Reports",
                description: "Detailed reports with visualizations and treatment recommendations for healthcare providers."
              },
            ].map((feature, index) => (
              <div key={index} className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 mb-4 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 flex items-center justify-center">
                  <div className="w-6 h-6 relative">
                    <div className="absolute inset-0 m-auto w-4 h-1 bg-white dark:bg-gray-900 rounded-sm"></div>
                    <div className="absolute inset-0 m-auto w-1 h-4 bg-white dark:bg-gray-900 rounded-sm"></div>
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Clinical-Grade Analysis Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Clinical-Grade Analysis</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Trusted by healthcare professionals for accurate diagnostics and treatment planning.</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {/* Clinical Features */}
              {[
                "High precision bone density measurements",
                "Supporting tool for healthcare professionals",
                "Detailed visualization of bone structure",
                "Consistent and reliable analysis results"
              ].map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-lg">{feature}</p>
                </div>
              ))}
            </div>
            
            {/* Medical Illustration */}
            <div className="relative h-80 lg:h-96 rounded-2xl overflow-hidden border border-border bg-card p-6 shadow-sm">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 relative animate-pulse-glow">
                  {/* Stylized bone illustration */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/30 to-blue-600/30 blur-sm"></div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/30 to-blue-600/30 blur-sm"></div>
                  <div className="absolute inset-0 m-auto w-4 h-40 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg"></div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg"></div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute top-4 right-4 w-20 h-20 opacity-20">
                <div className="w-full h-full border-2 border-dashed border-blue-500 dark:border-blue-400 rounded-full animate-spin-slow"></div>
              </div>
              <div className="absolute bottom-4 left-4 w-16 h-16 opacity-20">
                <div className="w-full h-full border-2 border-blue-500 dark:border-blue-400 rounded-full"></div>
                <div className="absolute inset-0 border-t-2 border-transparent animate-spin-slow" style={{ animationDirection: "reverse" }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to transform your bone health analysis?</h2>
          <p className="text-xl mb-8 text-blue-100">Join thousands of healthcare providers who trust OsteoScan for accurate diagnostics.</p>
          <Button
            size="lg"
            variant="outline"
            className="text-lg px-8 py-6 bg-white text-blue-600 hover:bg-blue-50 border-white"
            asChild
          >
            <Link href="/login">Get Started Today</Link>
          </Button>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-lg relative mr-3">
                <div className="absolute inset-0 m-auto w-6 h-1.5 bg-white dark:bg-gray-900 rounded-sm"></div>
                <div className="absolute inset-0 m-auto w-1.5 h-6 bg-white dark:bg-gray-900 rounded-sm"></div>
              </div>
              <span className="text-xl font-bold">OsteoScan</span>
            </div>
            
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} OsteoScan. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
