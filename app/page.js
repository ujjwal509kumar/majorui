'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Navbar from "@/components/navbar";
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Draggable } from "gsap/Draggable";

gsap.registerPlugin(ScrollTrigger, Draggable);

export default function Home() {
  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const clinicalSectionRef = useRef(null);
  const clipRectRef = useRef(null);

  const [tScore, setTScore] = useState(1.0);
  const [bmdStatus, setBmdStatus] = useState("Normal");
  const [sliderValue, setSliderValue] = useState(0);

  useGSAP(() => {
    // --- Hero Intro Animation ---
    gsap.from('[gsap-animate="hero"]', {
      y: 50,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      stagger: 0.2
    });

    gsap.to('[gsap-animate="pulse-logo"]', { scale: 1.05, duration: 2, ease: "sine.inOut", repeat: -1, yoyo: true });

    gsap.to('[gsap-animate="float"]', {
      y: -20,
      duration: 3,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      stagger: 0.5
    });
    
    // --- Hero Scroll Parallax ---
    gsap.to('[gsap-animate="float"]', {
      yPercent: -50,
      ease: "none",
      scrollTrigger: {
        trigger: heroRef.current,
        start: "top top",
        end: "bottom top",
        scrub: true,
      }
    });
    
    // --- Dynamic Card Hover Animation ---
    const cards = gsap.utils.toArray('.feature-card');
    cards.forEach(card => {
      const shine = card.querySelector('.shine');
      gsap.set(shine, { xPercent: -150, skewX: -30 });
      card.addEventListener('mouseenter', () => {
        gsap.to(shine, { xPercent: 150, duration: 0.7, ease: 'power2.out' });
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(shine, { xPercent: -150, duration: 0.7, ease: 'power2.in' });
      });
    });

    // --- Staggered List Item Animation ---
    gsap.from('.feature-list-item', {
      scrollTrigger: {
        trigger: clinicalSectionRef.current,
        start: "top 70%",
        toggleActions: "play none none reverse",
      },
      opacity: 0,
      x: -30,
      stagger: 0.2,
      ease: 'power2.out'
    });

  }, { scope: containerRef });
  
  const handleSliderChange = (e) => {
    const progress = e.target.value / 100;
    setSliderValue(e.target.value);
    
    if (clipRectRef.current) {
        gsap.to(clipRectRef.current, { 
            attr: { width: 200 * progress },
            duration: 0.4,
            ease: "power2.out" 
        });
    }
    
    const newTScore = 1.0 - (progress * 4.0);
    setTScore(parseFloat(newTScore.toFixed(1)));
    
    if (newTScore > -1.0) {
      setBmdStatus("Normal");
    } else if (newTScore >= -2.5) {
      setBmdStatus("Osteopenia");
    } else {
      setBmdStatus("Osteoporosis");
    }
  };


  return (
    <main ref={containerRef} className="flex flex-col min-h-screen bg-background text-foreground overflow-hidden mt-10">
      <style jsx global>{`
        .slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 8px;
          background: hsl(var(--muted));
          border-radius: 9999px;
          outline: none;
          opacity: 0.9;
          -webkit-transition: .2s;
          transition: opacity .2s;
        }

        .slider-thumb:hover {
          opacity: 1;
        }

        .slider-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          background: #3b82f6; /* blue-500 */
          border-radius: 9999px;
          cursor: pointer;
          box-shadow: 0 0 5px rgba(0,0,0,0.2);
        }

        .slider-thumb::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: #3b82f6; /* blue-500 */
          border-radius: 9999px;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 5px rgba(0,0,0,0.2);
        }
      `}</style>
      
      <Navbar />

      <section ref={heroRef} className="relative flex flex-col items-center justify-center py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-[10%] w-64 h-64 rounded-full bg-gradient-to-br from-blue-500/10 to-blue-600/5 blur-3xl"></div>
          <div className="absolute bottom-20 right-[10%] w-72 h-72 rounded-full bg-gradient-to-br from-blue-500/10 to-blue-600/5 blur-3xl"></div>

          <div gsap-animate="float" className="absolute top-[25%] right-[15%] w-16 h-16 text-blue-500 dark:text-blue-400 opacity-20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          </div>
          <div gsap-animate="float" className="absolute bottom-[20%] left-[15%] w-20 h-20 text-blue-500 dark:text-blue-400 opacity-20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
          </div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div gsap-animate="hero" className="mx-auto mb-8 w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-lg shadow-lg relative">
            <div className="absolute inset-0 m-auto w-12 h-3 bg-white dark:bg-gray-900 rounded-sm"></div>
            <div className="absolute inset-0 m-auto w-3 h-12 bg-white dark:bg-gray-900 rounded-sm"></div>
          </div>

          <h1 gsap-animate="hero" className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-400 dark:to-blue-300">
            OsteoScan
          </h1>

          <p gsap-animate="hero" className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Advanced bone health analysis with clinical-grade precision and AI-powered diagnostics.
          </p>

          <div gsap-animate="hero">
            <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-md hover:shadow-xl transition-all" asChild>
              <Link href="/login">Get Started</Link>
            </Button>
          </div>
        </div>
      </section>

      <section ref={featuresRef} className="py-20 px-4 bg-gradient-to-b from-background to-blue-50/50 dark:from-background dark:to-blue-950/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Advanced Bone Health Analysis</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Our cutting-edge technology provides detailed insights into bone density, structure, and potential fracture risks.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Precision Scanning", description: "High-resolution imaging for accurate bone density measurements and structural analysis." },
              { title: "AI-Powered Analysis", description: "Advanced algorithms detect subtle changes in bone structure that might indicate early signs of osteoporosis." },
              { title: "Comprehensive Reports", description: "Detailed reports with visualizations and treatment recommendations for healthcare providers." },
            ].map((feature) => (
              <div key={feature.title} className="feature-card bg-card border border-border/50 rounded-xl p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-blue-500/50 hover:-translate-y-2 group relative overflow-hidden">
                <div className="shine absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent to-white/10 dark:to-white/5"></div>
                <div className="relative">
                  <div className="w-12 h-12 mb-4 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                    <div className="w-6 h-6 relative">
                      <div className="absolute inset-0 m-auto w-4 h-1 bg-white dark:bg-gray-900 rounded-sm"></div>
                      <div className="absolute inset-0 m-auto w-1 h-4 bg-white dark:bg-gray-900 rounded-sm"></div>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={clinicalSectionRef} className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Clinical-Grade Analysis</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Trusted by healthcare professionals for accurate diagnostics and treatment planning.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {[
                "High precision bone density measurements",
                "Supporting tool for healthcare professionals",
                "Detailed visualization of bone structure",
                "Consistent and reliable analysis results"
              ].map((feature) => (
                <div key={feature} className="feature-list-item flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <p className="text-lg">{feature}</p>
                </div>
              ))}
            </div>

            <div className="relative h-96 lg:h-[450px] rounded-2xl flex flex-col items-center justify-center p-6 border border-border bg-card/50">
                <div className="w-64 h-64">
                    <svg className="w-full h-full" viewBox="0 0 200 200">
                        {/* --- FIXED: SVG patterns with higher contrast for better visibility --- */}
                        <defs>
                            <pattern id="dense-pattern" patternUnits="userSpaceOnUse" width="7" height="7" className="text-blue-500 dark:text-blue-400">
                                <path d="M 0 0 L 7 7 M 7 0 L 0 7" stroke="currentColor" strokeWidth="1" opacity="0.8"/>
                            </pattern>
                            <pattern id="sparse-pattern" patternUnits="userSpaceOnUse" width="20" height="20" className="text-slate-400 dark:text-slate-600">
                                <path d="M 0 0 L 20 20 M 20 0 L 0 20" stroke="currentColor" strokeWidth="0.5" opacity="0.5"/>
                            </pattern>
                            <clipPath id="slider-clip">
                                <rect ref={clipRectRef} width="0" height="200" />
                            </clipPath>
                        </defs>
                        <circle cx="100" cy="100" r="90" fill="url(#dense-pattern)" />
                        <g style={{ clipPath: 'url(#slider-clip)' }}>
                            <circle cx="100" cy="100" r="90" className="fill-background/80" />
                            <circle cx="100" cy="100" r="90" fill="url(#sparse-pattern)" />
                        </g>
                        <circle cx="100" cy="100" r="90" strokeWidth="3" fill="none" className="stroke-slate-300 dark:stroke-slate-700"/>
                    </svg>
                </div>

                <div className="w-full max-w-sm mt-8">
                    <input 
                        type="range"
                        min="0"
                        max="100"
                        value={sliderValue}
                        onInput={handleSliderChange}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer slider-thumb"
                    />
                    <div className="data-text flex justify-between mt-4 text-sm font-medium">
                        <div className="text-left">
                            <p className="text-muted-foreground">BMD Status</p>
                            <p className="text-lg font-bold" style={{color: bmdStatus === "Normal" ? '#34d399' : bmdStatus === "Osteopenia" ? '#f59e0b' : '#ef4444' }}>{bmdStatus}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-muted-foreground">T-Score</p>
                            <p className="text-lg font-bold">{tScore > 0 ? `+${tScore.toFixed(1)}` : tScore.toFixed(1)}</p>
                        </div>
                    </div>
                </div>
            </div>

          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to transform your bone health analysis?</h2>
          <p className="text-xl mb-8 text-blue-100">Join thousands of healthcare providers who trust OsteoScan for accurate diagnostics.</p>
          <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-white text-blue-600 hover:bg-blue-50 border-white" asChild>
            <Link href="/login">Get Started Today</Link>
          </Button>
        </div>
      </section>

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