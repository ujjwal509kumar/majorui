'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Navbar from "@/components/navbar"; // Assuming you have a Navbar component
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { UploadCloud, BrainCircuit, FileText, LayoutDashboard, LineChart, Copy, Printer } from 'lucide-react';

// Register ScrollTrigger plugin if it's not already registered
if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

const DashboardFeature = ({ icon, title, description }) => (
    <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 mt-1 rounded-lg bg-blue-600/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            {icon}
        </div>
        <div>
            <h4 className="font-semibold text-lg text-foreground">{title}</h4>
            <p className="text-muted-foreground">{description}</p>
        </div>
    </div>
);

const DashboardIllustration = () => (
    <motion.div 
        className="aspect-video bg-card/80 dark:bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-4 shadow-lg"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
    >
        <div className="w-full h-full border border-dashed border-border/50 rounded-lg p-2 sm:p-4 flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <div className="ml-auto h-6 w-24 bg-muted rounded-md"></div>
            </div>
            {/* Chart */}
            <div className="flex-grow w-full bg-muted/50 rounded-lg p-2 sm:p-4">
                <svg className="w-full h-full" preserveAspectRatio="none">
                    <motion.path 
                        d="M0 80 C 20 80, 40 20, 60 40 S 100 100, 120 70 S 160 0, 180 30 S 220 90, 240 50" 
                        fill="none" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth="2"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
                    />
                </svg>
            </div>
             {/* Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div className="h-12 bg-muted rounded-md"></div>
                <div className="h-12 bg-muted rounded-md"></div>
                <div className="h-12 bg-muted rounded-md"></div>
            </div>
        </div>
    </motion.div>
);


export default function ServicesPage() {
    const mainRef = useRef(null);
    const connectingLineRef = useRef(null);

    useGSAP(() => {
        // Animate header text on load
        gsap.fromTo('[gsap-animate="header"]', 
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, stagger: 0.2, duration: 1, ease: "power3.out" }
        );

        // Animate sections on scroll
        gsap.utils.toArray('[gsap-animate="section"]').forEach((section) => {
            gsap.fromTo(section, 
                { y: 60, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 1,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: section,
                        start: "top 80%", // Adjusted start position
                        toggleActions: "play none none none"
                    }
                }
            );
        });
        
        // Animate the "How it works" steps and connecting line
        const stepsTl = gsap.timeline({
            scrollTrigger: {
                trigger: '[gsap-animate="steps-container"]',
                start: "top 80%", // Adjusted start position
            }
        });

        if (connectingLineRef.current) {
            stepsTl.fromTo(connectingLineRef.current,
                { strokeDashoffset: 1000 },
                { strokeDashoffset: 0, duration: 1, ease: "power2.inOut" }
            );
        }
        
        stepsTl.fromTo('[gsap-animate="step"]',
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, stagger: 0.2, duration: 0.7 },
            "-=0.5" // Start this animation slightly before the line finishes drawing
        );

    }, { scope: mainRef });

    return (
        <main ref={mainRef} className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden mt-10">
            <Navbar />

            <header className="py-24 md:py-32 px-4 text-center relative bg-gradient-to-b from-background to-blue-500/5 dark:to-blue-950/10 overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-20 dark:opacity-5">
                     <div className="absolute top-1/4 left-[10%] w-48 h-48 rounded-full bg-blue-500 blur-3xl animate-pulse"></div>
                     <div className="absolute bottom-1/4 right-[10%] w-56 h-56 rounded-full bg-blue-600 blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
                </div>
                <div className="relative z-10 max-w-4xl mx-auto">
                    <h1 gsap-animate="header" className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-400 dark:to-blue-300">
                        Our Services
                    </h1>
                    <p gsap-animate="header" className="text-lg md:text-xl text-muted-foreground">
                        Leveraging AI for precise, fast, and comprehensive bone health analysis.
                    </p>
                </div>
            </header>

            <section className="py-20 md:py-24 px-4">
                <div className="max-w-7xl mx-auto space-y-20 md:space-y-28">

                    <div gsap-animate="section" className="text-center">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">A Simple, Powerful Process</h2>
                        <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-16">
                            Our platform streamlines bone health analysis into three straightforward steps.
                        </p>
                        <div gsap-animate="steps-container" className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 max-w-5xl mx-auto">
                            <div className="absolute top-10 left-0 w-full h-px hidden md:block">
                                <svg className="w-full h-full" preserveAspectRatio="none">
                                    <path ref={connectingLineRef} d="M0 1 L 1000 1" stroke="hsl(var(--border))" strokeWidth="2" strokeDasharray="1000" />
                                </svg>
                            </div>
                            <div gsap-animate="step" className="relative flex flex-col items-center p-4">
                                <div className="w-20 h-20 mb-4 rounded-full bg-card border-2 border-primary/10 flex items-center justify-center text-primary">
                                    <UploadCloud size={32} />
                                </div>
                                <h3 className="text-xl font-semibold text-foreground">1. Upload X-Ray</h3>
                                <p className="text-muted-foreground mt-2">Securely upload your knee X-ray image to our platform.</p>
                            </div>
                            <div gsap-animate="step" className="relative flex flex-col items-center p-4">
                                <div className="w-20 h-20 mb-4 rounded-full bg-card border-2 border-primary/10 flex items-center justify-center text-primary">
                                    <BrainCircuit size={32} />
                                </div>
                                <h3 className="text-xl font-semibold text-foreground">2. AI Analysis</h3>
                                <p className="text-muted-foreground mt-2">Our advanced AI model analyzes the image for signs of Osteoporosis or Osteopenia.</p>
                            </div>
                            <div gsap-animate="step" className="relative flex flex-col items-center p-4">
                                <div className="w-20 h-20 mb-4 rounded-full bg-card border-2 border-primary/10 flex items-center justify-center text-primary">
                                    <FileText size={32} />
                                </div>
                                <h3 className="text-xl font-semibold text-foreground">3. Get Diagnosis</h3>
                                <p className="text-muted-foreground mt-2">Receive a detailed report and diagnosis directly on your dashboard.</p>
                            </div>
                        </div>
                    </div>

                    <div gsap-animate="section" className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Your Comprehensive Health Dashboard</h2>
                            <p className="text-lg text-muted-foreground mb-8">
                                All the tools you need to monitor, understand, and manage your bone health effectively.
                            </p>
                            <div className="space-y-6">
                                <DashboardFeature icon={<LayoutDashboard size={24} />} title="Intuitive Interface" description="A clean, user-friendly interface to view all your results and progress in one place." />
                                <DashboardFeature icon={<LineChart size={24} />} title="Track Your Progress" description="Visualize your bone health journey over time with easy-to-understand graphs and charts." />
                                <DashboardFeature icon={<Copy size={24} />} title="Compare Reports" description="Place historical and current reports side-by-side to easily track changes and improvements." />
                                <DashboardFeature icon={<Printer size={24} />} title="Printable Reports" description="Generate and print professional, detailed reports to share with your healthcare provider." />
                            </div>
                        </div>
                        <div className="lg:mt-0">
                           <DashboardIllustration />
                        </div>
                    </div>

                    <div gsap-animate="section" className="text-center pt-8">
                        <h2 className="text-3xl font-bold text-foreground mb-4">Ready to Take Control of Your Bone Health?</h2>
                        <p className="text-lg text-muted-foreground mb-8">Create an account to get started with your first analysis.</p>
                        <Button
                            size="lg"
                            className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-md hover:shadow-xl transition-all"
                            asChild
                        >
                            <Link href="/login">Get Started Now</Link>
                        </Button>
                    </div>

                </div>
            </section>
        </main>
    );
}