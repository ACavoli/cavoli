"use client"

import { useEffect, useState } from 'react'

interface BouncingArrowProps {
  className?: string;
  color?: string;
  size?: number;
  bounceHeight?: number;
  bounceDuration?: number;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export default function BouncingArrow({ 
  className = "", 
  color = "white", 
  size = 24, 
  bounceHeight = 8, 
  bounceDuration = 1.5,
  onClick,
  style
}: BouncingArrowProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Delay the animation start slightly
    const timer = setTimeout(() => setIsVisible(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'} ${className}`}
      style={{
        animation: isVisible ? `bounce ${bounceDuration}s ease-in-out infinite` : 'none',
        ...style
      }}
      onClick={onClick}
    >
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ color }}
      >
        <path 
          d="M7 10L12 15L17 10" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
      
      <style jsx>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-${bounceHeight}px);
          }
          60% {
            transform: translateY(-${bounceHeight / 2}px);
          }
        }
      `}</style>
    </div>
  )
} 