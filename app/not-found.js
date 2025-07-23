'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Stethoscope } from 'lucide-react';

const Button = React.forwardRef(({ className, children, ...props }, ref) => {
    const { asChild = false, ...restProps } = props;

    if (asChild && React.Children.count(children) > 0) {
        const child = React.Children.only(children);
        return React.cloneElement(child, {
            ref,
            ...restProps,
            className: `${className || ''} ${child.props.className || ''}`.trim(),
        });
    }
    
    return (
        <button ref={ref} className={className} {...restProps}>
            {children}
        </button>
    );
});
Button.displayName = "Button";

const BackgroundGrid = () => (
    <div className="absolute inset-0 z-0 h-full w-full bg-slate-950 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
);

export default function NotFound() {
    const ekgPathRef = useRef(null);
    const blipRef = useRef(null);
    const [isGsapReady, setIsGsapReady] = useState(false);
    const [isFlatlined, setIsFlatlined] = useState(false);
    const animationTimeline = useRef(null);

    useEffect(() => {
        const gsapUrl = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js";
        const motionPathUrl = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/MotionPathPlugin.min.js";

        const loadScript = (url, callback) => {
            if (document.querySelector(`script[src="${url}"]`)) {
                if (callback) callback(); return;
            }
            const script = document.createElement("script");
            script.src = url;
            script.onload = callback;
            script.onerror = () => console.error(`Failed to load script: ${url}`);
            document.body.appendChild(script);
        };

        loadScript(gsapUrl, () => {
            loadScript(motionPathUrl, () => {
                if (window.gsap && window.MotionPathPlugin) {
                    window.gsap.registerPlugin(window.MotionPathPlugin);
                    setIsGsapReady(true);
                }
            });
        });

        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes text-flicker {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.3; }
            }
            .flicker {
                animation: text-flicker 1.5s infinite;
            }
        `;
        document.head.appendChild(style);
        return () => { document.head.removeChild(style); };
    }, []);

    const runAnimation = () => {
        if (!isGsapReady || !ekgPathRef.current || !blipRef.current) return;

        if (animationTimeline.current) {
            animationTimeline.current.kill();
        }
        
        const gsap = window.gsap;
        setIsFlatlined(false);
        gsap.set(blipRef.current, { attr: { r: 4 }, opacity: 1 });

        const normalBeat = "M0 50 H 80 Q 85 50 90 55 T 100 50 Q 105 50 110 40 L 115 65 L 120 25 L 125 55 L 130 50 H 220 Q 225 50 230 45 T 240 50 H 400";
        const flatline = "M0 50 H 400";
        
        gsap.set(ekgPathRef.current, { attr: { d: normalBeat } });
        
        const masterTl = gsap.timeline();
        animationTimeline.current = masterTl;

        const pulseTl = gsap.timeline({ repeat: 4, repeatDelay: 0.5 });
        pulseTl.fromTo(ekgPathRef.current, 
            { strokeDasharray: 600, strokeDashoffset: 600 },
            { strokeDashoffset: 0, duration: 2, ease: "power1.inOut" }
        );
        pulseTl.to(blipRef.current, {
            motionPath: { path: ekgPathRef.current, align: ekgPathRef.current, alignOrigin: [0.5, 0.5] },
            duration: 2, ease: "power1.inOut"
        }, 0);
        pulseTl.to(ekgPathRef.current, { opacity: 0, duration: 0.3 }, ">-0.3");
        pulseTl.set(blipRef.current, { opacity: 0 }, ">");
        pulseTl.set(ekgPathRef.current, { opacity: 1 });
        pulseTl.set(blipRef.current, { opacity: 1 });

        masterTl.add(pulseTl);

        const flatlineTl = gsap.timeline({
            onStart: () => setIsFlatlined(true)
        });
        flatlineTl.set(ekgPathRef.current, { attr: { d: flatline }, opacity: 1 });
        flatlineTl.fromTo(ekgPathRef.current,
            { strokeDasharray: 400, strokeDashoffset: 400 },
            { strokeDashoffset: 0, duration: 2, ease: "none" }
        );
        flatlineTl.to(blipRef.current, {
            motionPath: { path: ekgPathRef.current, align: ekgPathRef.current, alignOrigin: [0.5, 0.5] },
            duration: 2, ease: "none"
        }, 0);
        flatlineTl.to(blipRef.current, { attr: { r: 0 }, duration: 0.2 }, ">-0.2");
        
        masterTl.add(flatlineTl);
    };

    useEffect(() => {
        runAnimation();
        return () => {
            if (animationTimeline.current) {
                animationTimeline.current.kill();
            }
        };
    }, [isGsapReady]);

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.2, delayChildren: 0.3 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0, transition: { ease: 'easeOut', duration: 0.5 } }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-950 text-gray-300 font-sans p-4 overflow-hidden relative">
            <BackgroundGrid />
            
            <motion.div 
                className="relative z-10 text-center p-6 sm:p-10 bg-slate-900/70 backdrop-blur-md rounded-2xl shadow-2xl shadow-cyan-500/10 border border-cyan-400/20 max-w-2xl w-full"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={itemVariants} className="relative w-full h-32 sm:h-40 bg-black/30 rounded-lg p-2 border border-slate-700/50 overflow-hidden mb-6">
                    <svg viewBox="0 0 400 100" className="w-full h-full" preserveAspectRatio="none">
                        <path d="M0 25 H 400 M0 75 H 400 M50 0 V 100 M100 0 V 100 M150 0 V 100 M200 0 V 100 M250 0 V 100 M300 0 V 100 M350 0 V 100" fill="none" stroke="#1e3a4b" strokeWidth="0.5" />
                        <path d="M0 50 H 400" fill="none" stroke="#1e3a4b" strokeWidth="1" />
                        <path ref={ekgPathRef} fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" />
                        <circle ref={blipRef} r="4" fill="#67e8f9" className="shadow-lg shadow-cyan-300" />
                    </svg>
                </motion.div>

                <motion.h1 
                    variants={itemVariants} 
                    className={`text-4xl md:text-5xl font-bold mt-6 mb-2 pb-2 bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent ${isFlatlined ? 'flicker' : ''}`}
                >
                    Page Not Found
                </motion.h1>
                <motion.p variants={itemVariants} className="text-slate-400 mb-8 text-base sm:text-lg">
                    Looks like this page needs medical attention!
                </motion.p>

                <motion.div 
                    variants={itemVariants} 
                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 sm:p-6 text-left mb-8 transition-all"
                    whileHover={{ scale: 1.02, boxShadow: "0px 0px 20px rgba(6, 182, 212, 0.3)" }}
                >
                    <div className="flex items-center gap-3 mb-3">
                        <Stethoscope className="h-6 w-6 text-cyan-400" />
                        <h2 className="text-lg font-semibold text-white">Diagnosis</h2>
                    </div>
                    <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                        The page you&#39;re looking for seems to have gone for a check-up. 
                        Don&#39;t worry, our medical team (developers) are on it! 
                        Let&#39;s get you back to a healthy page.
                    </p>
                </motion.div>
                
                <motion.div variants={itemVariants}>
                    <Button asChild size="lg" className="bg-cyan-500 text-slate-900 font-bold hover:bg-cyan-400 transition-all duration-300 ease-in-out shadow-lg shadow-cyan-500/20 group transform hover:scale-105 px-8 py-3 w-full sm:w-auto">
                        <a href="/" className="flex items-center justify-center gap-2">
                            <Home className="h-5 w-5 transition-transform group-hover:rotate-[-12deg]" />
                            Back to Home
                        </a>
                    </Button>
                </motion.div>
            </motion.div>
        </div>
    );
}
