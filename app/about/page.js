'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Navbar from "@/components/navbar"; // Assuming you have a Navbar component
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { Lightbulb, Heart, Rocket } from 'lucide-react';

// Register ScrollTrigger plugin if it's not already registered
if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

const TimelineItem = ({ icon, title, children, isLast = false }) => (
    <div className="relative pl-10">
        <div className="absolute left-0 top-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white">
            {icon}
        </div>
        {!isLast && (
            <div className="absolute left-4 top-8 w-px h-full bg-blue-500/30"></div>
        )}
        <h4 className="font-semibold text-lg text-white mb-1">{title}</h4>
        <p className="text-muted-foreground">{children}</p>
    </div>
);


export default function AboutPage() {
    const mainRef = useRef(null);

    useGSAP(() => {
        // Animate header text on load
        gsap.fromTo('[gsap-animate="header"]', 
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, stagger: 0.2, duration: 1, ease: "power3.out" }
        );

        // General fade-in-up animation for sections
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
                        start: "top 85%",
                        toggleActions: "play none none none"
                    }
                }
            );
        });

        // Staggered animation for timeline items
        gsap.fromTo('[gsap-animate="timeline-item"]',
            { x: -30, opacity: 0 },
            {
                x: 0,
                opacity: 1,
                stagger: 0.3,
                duration: 0.8,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: '[gsap-animate="timeline-container"]',
                    start: "top 80%",
                }
            }
        );

    }, { scope: mainRef });

    return (
        <main ref={mainRef} className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden mt-10">
            <Navbar />

            {/* Page Header */}
            <header className="py-24 md:py-32 px-4 text-center relative bg-gradient-to-b from-background to-blue-500/5 dark:to-blue-950/10 overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-20 dark:opacity-5">
                     <div className="absolute top-1/4 left-[10%] w-48 h-48 rounded-full bg-blue-500 blur-3xl animate-pulse"></div>
                     <div className="absolute bottom-1/4 right-[10%] w-56 h-56 rounded-full bg-blue-600 blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
                </div>
                <div className="relative z-10 max-w-4xl mx-auto">
                    <h1 gsap-animate="header" className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-400 dark:to-blue-300">
                        About OsteoScan
                    </h1>
                    <p gsap-animate="header" className="text-lg md:text-xl text-muted-foreground">
                        The story, the mission, and the student behind the technology.
                    </p>
                </div>
            </header>

            {/* Main Content Section */}
            <section className="py-20 md:py-24 px-4">
                <div className="max-w-5xl mx-auto space-y-20 md:space-y-24">

                    {/* Meet the Creator Section */}
                    <div gsap-animate="section" className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 items-center">
                        <div className="md:col-span-1 flex justify-center">
                            <motion.div 
                                className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 p-1 shadow-lg"
                                whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
                            >
                                 <div className="w-full h-full bg-card rounded-full flex items-center justify-center">
                                    <span className="text-5xl font-bold text-blue-500">UK</span>
                                 </div>
                            </motion.div>
                        </div>
                        <div className="md:col-span-2 text-center md:text-left">
                            <h2 className="text-3xl font-bold mb-2 text-white">Meet the Creator</h2>
                            <p className="text-2xl font-semibold text-blue-400 mb-4">UJJWAL KUMAR</p>
                            <p className="text-lg text-muted-foreground">
                                I am a passionate and driven Master of Computer Applications (MCA) student with a deep interest in leveraging technology to solve complex, real-world challenges.
                            </p>
                        </div>
                    </div>

                    {/* The OsteoScan Journey */}
                    <div gsap-animate="section" className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center">
                        <div gsap-animate="timeline-container" className="space-y-10">
                            <div gsap-animate="timeline-item">
                                <TimelineItem icon={<Lightbulb size={16} />} title="The Inception">
                                    OsteoScan began as a challenging academic project for my MCA program.
                                </TimelineItem>
                            </div>
                            <div gsap-animate="timeline-item">
                                <TimelineItem icon={<Heart size={16} />} title="A Project with a Pulse">
                                    It quickly evolved into a passion, driven by the potential of AI to revolutionize healthcare diagnostics.
                                </TimelineItem>
                            </div>
                            <div gsap-animate="timeline-item">
                                <TimelineItem icon={<Rocket size={16} />} title="Vision for Tomorrow" isLast>
                                    The goal is to refine OsteoScan into a trusted tool for clinics worldwide, aiding in early disease detection.
                                </TimelineItem>
                            </div>
                        </div>
                        
                        <div className="bg-card/50 border border-border rounded-2xl p-8 shadow-sm">
                            <h3 className="text-2xl font-bold mb-4 text-white">From Concept to Creation</h3>
                            <div className="space-y-4 text-muted-foreground text-base md:text-lg leading-relaxed">
                                <p>
                                    The idea of creating a tool that could provide precise, accessible, and early-stage analysis of bone health was incredibly compelling.
                                </p>
                                <p>
                                    This project represents countless hours of research, coding, and a commitment to creating technology that can make a tangible difference in people&apos;s lives. It&apos;s a testament to the belief that one dedicated student can contribute to the future of medical diagnostics.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Back to Home Button */}
                    <div gsap-animate="section" className="text-center pt-8">
                        <Button
                            size="lg"
                            className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-md hover:shadow-xl transition-all"
                            asChild
                        >
                            <Link href="/">Explore the Technology</Link>
                        </Button>
                    </div>

                </div>
            </section>
        </main>
    );
}