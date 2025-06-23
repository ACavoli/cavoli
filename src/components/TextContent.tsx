"use client"

import { useEffect, useState } from 'react'
import BouncingArrow from './BouncingArrow'

interface TextContentProps {
  webGPUAvailable: boolean;
}

export default function TextContent({ webGPUAvailable }: TextContentProps) {
  const [arrowOpacity, setArrowOpacity] = useState(1);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const opacity = Math.max(0, 1 - (scrollY / (windowHeight * 0.5)));
      setArrowOpacity(opacity);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
          <div className="absolute top-1/3 left-1/3 transform -translate-x-1/4 -translate-y-1/2">
            <h2 className="attractive-text text-6xl md:text-9xl font-bold">WELCOME</h2>
          </div>
          <div className="absolute bottom-1/3 right-1/3 transform translate-x-1/4 translate-y-1/2">
            <div className="flex items-center gap-4">
              <h3 className="attractive-text text-4xl md:text-6xl font-bold">EXPLORE</h3>
              <BouncingArrow 
                size={24} 
                bounceHeight={8} 
                bounceDuration={1.5}
                className="text-white/80 hover:text-white transition-colors cursor-pointer"
                onClick={() => {
                  window.scrollTo({
                    top: window.innerHeight,
                    behavior: 'smooth'
                  });
                }}
                style={{ opacity: arrowOpacity }}
              />
            </div>
          </div>
        </div>

        {/* Main Content Section */}
        <div className="h-[900vh] relative">
        </div>

        {/* Final Section */}
        <div className="h-screen relative">
          <div className="absolute top-1/4 left-1/4 transform -translate-x-1/4 -translate-y-1/2">
            <h2 className="attractive-text text-6xl md:text-9xl font-bold">CONNECT</h2>
          </div>
          <div className="absolute bottom-1/4 right-1/4 transform translate-x-1/4 translate-y-1/2">
            <h3 className="attractive-text text-4xl md:text-6xl font-bold">SHARE</h3>
          </div>
        </div>
      </div>
    </div>
  )
} 