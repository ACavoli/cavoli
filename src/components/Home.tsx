// "use client"

// import { useEffect, useRef, useState } from 'react'
// import SlimeSimulation from './SlimeSimulation'

// export default function Home() {
//   const [scrollY, setScrollY] = useState(0)
//   const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 })
//   const containerRef = useRef<HTMLDivElement>(null)

//   // Handle window resize
//   useEffect(() => {
//     const updateDimensions = () => {
//       if (containerRef.current) {
//         const rect = containerRef.current.getBoundingClientRect()
//         setDimensions({
//           width: rect.width,
//           height: rect.height
//         })
//       }
//     }

//     // Initial size
//     updateDimensions()

//     // Add resize listener
//     window.addEventListener('resize', updateDimensions)
//     return () => window.removeEventListener('resize', updateDimensions)
//   }, [])

//   // Scroll listener for parallax effect
//   useEffect(() => {
//     const handleScroll = () => {
//       setScrollY(window.scrollY)
//     }
//     window.addEventListener('scroll', handleScroll)
//     // Set initial value in case not zero
//     setScrollY(window.scrollY)
//     return () => {
//       window.removeEventListener('scroll', handleScroll)
//     }
//   }, [])

//   return (
//     <div 
//       ref={containerRef}
//       className="relative w-screen h-screen overflow-hidden bg-black"
//     >
//       {/* <SlimeSimulation
//         width={dimensions.width}
//         height={dimensions.height}
//         trailWeight={0.8}
//         decayRate={0.05}
//         diffusionRate={0.2}
//       /> */}
//       {/* <div className="relative z-10 flex items-center justify-center w-full h-full">
//         <h1
//           className="text-9xl font-bold text-white tracking-wider animate-fade-in z-10"
//           style={{
//             transform: `translateY(${scrollY * 0.1}px)`,
//             willChange: 'transform',
//           }}
//         >
//           ALESSANDRO CAVOLI
//         </h1>
//       </div> */}
//       {/* <div className="absolute top-0 w-full h-1/6 mask-to-t backdrop-blur-md"></div>
//       <div className="absolute bottom-0 w-full h-1/6 mask-to-b backdrop-blur-md"></div> */}
//     </div>
//   )
// }
