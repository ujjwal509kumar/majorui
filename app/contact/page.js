'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Navbar from "@/components/navbar"; // Assuming you have a Navbar component
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';
import { Mail, Linkedin, MapPin } from 'lucide-react';

// Register ScrollTrigger plugin if it's not already registered
if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

const ContactCard = ({ icon, title, content, href }) => (
    <motion.a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-card/50 border border-border rounded-2xl p-6 text-center h-full flex flex-col items-center transition-all duration-300"
        whileHover={{ y: -5, boxShadow: "0px 10px 20px rgba(6, 182, 212, 0.1)" }}
    >
        <div className="w-14 h-14 mb-4 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
            {icon}
        </div>
        <h3 className="text-xl font-semibold mb-1 text-foreground">{title}</h3>
        <p className="text-muted-foreground flex-grow">{content}</p>
    </motion.a>
);

export default function ContactPage() {
    const mainRef = useRef(null);

    useGSAP(() => {
        // Animate header text on load
        gsap.fromTo('[gsap-animate="header"]', 
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, stagger: 0.2, duration: 1, ease: "power3.out" }
        );

        // Staggered animation for contact cards
        gsap.fromTo('[gsap-animate="contact-card"]',
            { y: 40, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                stagger: 0.2,
                duration: 0.8,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: '[gsap-animate="contact-grid"]',
                    start: "top 85%",
                }
            }
        );

        // Animation for the location section details
        const locationTl = gsap.timeline({
            scrollTrigger: {
                trigger: '[gsap-animate="location-section"]',
                start: "top 80%",
            }
        });

        locationTl.fromTo('[gsap-animate="location-text"]',
            { x: -50, opacity: 0 },
            { x: 0, opacity: 1, duration: 1, ease: 'power3.out' }
        );

        locationTl.fromTo('[gsap-animate="location-map"]',
            { x: 50, opacity: 0 },
            { x: 0, opacity: 1, duration: 1, ease: 'power3.out' },
            "-=0.8" // Overlap the animations slightly
        );
        
        // Animate final CTA section
        gsap.fromTo('[gsap-animate="cta"]', 
            { y: 60, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 1,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: '[gsap-animate="cta"]',
                    start: "top 90%",
                }
            }
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
                        Get In Touch
                    </h1>
                    <p gsap-animate="header" className="text-lg md:text-xl text-muted-foreground">
                        I&apos;m here to help and answer any questions you might have about this project.
                    </p>
                </div>
            </header>

            <section className="py-20 md:py-24 px-4">
                <div className="max-w-7xl mx-auto space-y-20 md:space-y-24">

                    <div gsap-animate="contact-grid" className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        <div gsap-animate="contact-card">
                            <ContactCard 
                                icon={<Mail size={28} />}
                                title="Project Inquiries"
                                content="ujjwal509kumar@gmail.com"
                                href="mailto:ujjwal509kumar@gmail.com"
                            />
                        </div>
                        <div gsap-animate="contact-card">
                            <ContactCard 
                                icon={<Linkedin size={28} />}
                                title="Connect with Me"
                                content="View my LinkedIn profile"
                                href="https://www.linkedin.com/in/ujjwal-kumar-62ba63212/"
                            />
                        </div>
                    </div>

                    <div gsap-animate="location-section" className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        <div gsap-animate="location-text" className="space-y-6">
                            <h2 className="text-3xl md:text-4xl font-bold text-foreground">My Location</h2>
                            <p className="text-lg text-muted-foreground">
                                This project is developed and maintained from my base in Bengaluru, India. I&apos;m dedicated to providing global solutions from a local foundation of passion and expertise.
                            </p>
                            <div className="flex items-center gap-3 pt-4">
                                <MapPin className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                                <span className="text-lg font-semibold text-foreground">Based in Bengaluru, India</span>
                            </div>
                        </div>
                        <div gsap-animate="location-map" className="lg:mt-0">
                           <motion.div 
                                className="aspect-video bg-card/80 dark:bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-2 shadow-lg overflow-hidden"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                            >
                                <iframe 
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7779.628500427209!2d77.61084349057771!3d12.855270859754484!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae6b2278a04ec1%3A0xa62634002da478f8!2sMylasandra%2C%2BBengaluru%2C%2BKarnataka!5e0!3m2!1sen!2sin!4v1753273917461!5m2!1sen!2sin" 
                                    width="100%" 
                                    height="100%" 
                                    style={{ border:0 }} 
                                    allowFullScreen="" 
                                    loading="lazy" 
                                    referrerPolicy="no-referrer-when-downgrade"
                                    className="rounded-xl"
                                ></iframe>
                            </motion.div>
                        </div>
                    </div>

                    <div gsap-animate="cta" className="text-center pt-8">
                        <h2 className="text-3xl font-bold text-foreground mb-4">Have a Question?</h2>
                        <p className="text-lg text-muted-foreground mb-8">Reach out to me via email and I&apos;ll get back to you as soon as possible.</p>
                        <Button
                            size="lg"
                            className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-md hover:shadow-xl transition-all"
                            asChild
                        >
                            <a href="mailto:ujjwal509kumar@gmail.com">Email Me</a>
                        </Button>
                    </div>

                </div>
            </section>
        </main>
    );
}