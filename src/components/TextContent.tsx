"use client"

import { useEffect, useState } from 'react'
import BouncingArrow from './BouncingArrow'
import { Button } from './ui/button'

interface TextContentProps {
  webGPUAvailable: boolean;
}

export default function TextContent({ webGPUAvailable }: TextContentProps) {
  const [welcomeOpacity, setWelcomeOpacity] = useState(1);
  const [finalOpacity, setFinalOpacity] = useState(0);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Cavoli',
          text: 'Interactive Experience',
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      } catch (error) {
        console.log('Error copying to clipboard:', error);
      }
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Calculate opacity for welcome section (fade out as we scroll)
      const welcomeOpacity = Math.max(0, 1 - (scrollY / windowHeight));
      setWelcomeOpacity(welcomeOpacity);
      
      // Calculate opacity for final section (fade in as we approach the end)
      const finalSectionStart = documentHeight - windowHeight * 2;
      const finalOpacity = Math.max(0, Math.min(1, (scrollY - finalSectionStart) / windowHeight));
      setFinalOpacity(finalOpacity);
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
            <div className="flex items-center gap-4">
              <h3 className="attractive-text text-4xl md:text-6xl font-bold" style={{ opacity: finalOpacity }}>SHARE</h3>
              <ShareButton handleShare={handleShare} finalOpacity={finalOpacity} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 

function ShareButton({ handleShare, finalOpacity }: { handleShare: () => Promise<void>, finalOpacity: number }) {
  return <Button
    variant="outline"
    size="icon"
    onClick={handleShare}
    className="border-white border text-white bg-transparent hover:bg-white hover:border-neutral-600 hover:text-black transition-colors duration-300 cursor-pointer share-button-animation"
    style={{ opacity: finalOpacity }}
    title="Share this page"
  >
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16,6 12,2 8,6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  </Button>;
}