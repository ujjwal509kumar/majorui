'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, Activity } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ModeToggle } from './dark-mode';

const Navbar = () => {
    const { data: session, status } = useSession();
    
    const navItems = [
        { label: 'Home', href: '/' },
        { label: 'About', href: '/about' },
        { label: 'Services', href: '/services' },
        { label: 'Contact', href: '/contact' }
    ];

    const handleSignOut = () => {
        signOut({ callbackUrl: '/' });
    };

    return (
        <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-blue-100 dark:border-blue-900 fixed w-full top-0 left-0 right-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Enhanced Logo with Medical Icon */}
                    <div className="flex-shrink-0 flex items-center">
                        <div className="h-8 w-8 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 flex items-center justify-center mr-2 shadow-sm">
                            <div className="absolute w-5 h-1.5 bg-white rounded-sm"></div>
                            <div className="absolute w-1.5 h-5 bg-white rounded-sm"></div>
                        </div>
                        <Link href="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-400 dark:to-blue-300">
                            OsteoScan
                        </Link>
                    </div>

                    {/* Desktop Navigation with Enhanced Styling */}
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-center space-x-4">
                            {navItems.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                >
                                    {item.label}
                                </Link>
                            ))}
                            
                            {/* Enhanced Conditional buttons based on session status */}
                            {status === 'authenticated' ? (
                                <>
                                    <Button variant="outline" className="border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-200" asChild>
                                        <Link href="/dashboard">Dashboard</Link>
                                    </Button>
                                    <Button 
                                        className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-600 dark:to-blue-800 text-white hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-700 dark:hover:to-blue-900 transition-all duration-300 shadow-sm hover:shadow-md"
                                        onClick={handleSignOut}
                                    >
                                        Sign Out
                                    </Button>
                                </>
                            ) : (
                                <Button 
                                    className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-600 dark:to-blue-800 text-white hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-700 dark:hover:to-blue-900 transition-all duration-300 shadow-sm hover:shadow-md"
                                    asChild
                                >
                                    <Link href="/login">Sign In</Link>
                                </Button>
                            )}
                            
                            {/* Enhanced Mode Toggle */}
                            <div className="ml-2">
                                <ModeToggle />
                            </div>
                        </div>
                    </div>

                    {/* Enhanced Mobile Navigation */}
                    <div className="md:hidden flex items-center space-x-3">
                        <ModeToggle />
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    aria-label="Open menu"
                                    className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-200"
                                >
                                    <Menu className="h-6 w-6" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="border-l border-blue-100 dark:border-blue-900">
                                <SheetHeader>
                                    <SheetTitle className="text-blue-600 dark:text-blue-400 flex items-center">
                                        <Activity className="mr-2 h-5 w-5" />
                                        Navigation Menu
                                    </SheetTitle>
                                </SheetHeader>
                                <div className="flex flex-col space-y-4 mt-6">
                                    {navItems.map((item) => (
                                        <Link
                                            key={item.label}
                                            href={item.href}
                                            className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                        >
                                            {item.label}
                                        </Link>
                                    ))}
                                    
                                    {/* Enhanced Conditional buttons based on session status */}
                                    {status === 'authenticated' ? (
                                        <div className="pt-4 space-y-3">
                                            <Button variant="outline" className="w-full border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-200" asChild>
                                                <Link href="/dashboard">Dashboard</Link>
                                            </Button>
                                            <Button 
                                                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-600 dark:to-blue-800 text-white hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-700 dark:hover:to-blue-900 transition-all duration-300 shadow-sm hover:shadow-md"
                                                onClick={handleSignOut}
                                            >
                                                Sign Out
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="pt-4">
                                            <Button 
                                                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-600 dark:to-blue-800 text-white hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-700 dark:hover:to-blue-900 transition-all duration-300 shadow-sm hover:shadow-md"
                                                asChild
                                            >
                                                <Link href="/login">Sign In</Link>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;