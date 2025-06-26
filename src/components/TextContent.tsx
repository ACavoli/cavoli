"use client"

import { useEffect, useState } from 'react'
import BouncingArrow from './BouncingArrow'

interface TextContentProps {
  webGPUAvailable: boolean;
}

export default function TextContent({ webGPUAvailable }: TextContentProps) {
  const [welcomeOpacity, setWelcomeOpacity] = useState(1);
  const [finalOpacity, setFinalOpacity] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      
      // Calculate total page height
      const docHeight = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );
      const totalHeight = docHeight - windowHeight;
      
      // Welcome/Explore opacity - fade out after 30vh
      const welcomeVh = windowHeight * 0.15;
      const welcomeOpacity = Math.max(0, 1 - (scrollY / welcomeVh));
      setWelcomeOpacity(welcomeOpacity);
      
      // Final section opacity - fade in during last 30vh
      const finalVh = totalHeight - (windowHeight * 0.15);
      const finalOpacity = Math.max(0, Math.min(1, (scrollY - finalVh) / (windowHeight * 0.15)));
      setFinalOpacity(finalOpacity);
    };

    // Initial calculation
    handleScroll();
    
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  return (
    <div className="relative z-10 text-white">
      {!webGPUAvailable && (
        <div className="absolute top-0 left-0 w-full h-full bg-black/50 z-50">
          <h1 className="text-white text-4xl font-bold">WebGPU is not available - Please turn on WebGPU in your browser settings</h1>
        </div>
      )}
      <div className="container mx-auto p-4">
        
        {/* Welcome Section */}
        <div className="h-screen relative">
          <div className="absolute top-1/3 left-1/3 transform -translate-x-1/4 -translate-y-1/2 transition-opacity duration-300">
            <h2 className="attractive-text text-6xl md:text-9xl font-bold" style={{ opacity: welcomeOpacity }}>WELCOME</h2>
          </div>
          <div className="absolute bottom-1/3 right-1/3 transform translate-x-1/4 translate-y-1/2 transition-opacity duration-300">
            <div className="flex items-center gap-4">
              <h3 className="attractive-text text-4xl md:text-6xl font-bold" style={{ opacity: welcomeOpacity }}>EXPLORE</h3>
              <BouncingArrow 
                size={24} 
                bounceHeight={8} 
                bounceDuration={1.5}
                className="text-white/80 hover:text-white cursor-pointer transition-opacity duration-300"
                onClick={() => {
                  window.scrollTo({
                    top: window.innerHeight,
                    behavior: 'smooth'
                  });
                }}
                style={{ opacity: welcomeOpacity }}
              />
            </div>
          </div>
        </div>

        {/* Main Content Section */}
        <div className="h-[500vh] relative">
        </div>

        {/* Final Section */}
        <div className="h-screen relative">
          <div className="absolute bottom-1/3 right-1/3 transform translate-x-1/4 translate-y-1/2 transition-opacity duration-300">
            <h3 className="attractive-text text-4xl md:text-6xl font-bold" style={{ opacity: finalOpacity }}>SHARE</h3>
          </div>
        </div>
      </div>
    </div>
  )
} 