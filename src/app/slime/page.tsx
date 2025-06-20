// "use client"

// import { useState, useEffect } from 'react'
// import SlimeSimulation from '@/components/SlimeSimulation'

// export default function SlimePage() {
//   const [numSlimes, setNumSlimes] = useState(100000)
//   const [decayRate, setDecayRate] = useState(0.985)
//   const [diffusionRate, setDiffusionRate] = useState(0.2)
//   const [moveSpeed, setMoveSpeed] = useState(0.0015)
//   const [turnSpeed, setTurnSpeed] = useState(0.2)
//   const [sensorDistance, setSensorDistance] = useState(0.005)
//   const [sensorSize, setSensorSize] = useState(1)
//   const [sensorAngle, setSensorAngle] = useState(0.2)
//   const [attractionStrength, setAttractionStrength] = useState(0.3)
//   const [attractorData, setAttractorData] = useState<Float32Array | null>(null);
//   const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
//   const [isDebugMode, setIsDebugMode] = useState(false);

//   // Effect to check for debug mode
//   useEffect(() => {
//     setIsDebugMode(window.location.search.includes('debug=true'));
//   }, []);

//   // Effect to track viewport size
//   useEffect(() => {
//     const handleResize = () => {
//       setViewportSize({ width: window.innerWidth, height: window.innerHeight });
//     };
//     handleResize(); // Initial size
//     window.addEventListener('resize', handleResize);
//     return () => window.removeEventListener('resize', handleResize);
//   }, []);

//   // Effect to create and manage the attractor data from page content
//   useEffect(() => {
//     if (viewportSize.width === 0) return;

//     const canvas = document.createElement('canvas');
//     canvas.width = viewportSize.width;
//     canvas.height = viewportSize.height;
//     const ctx = canvas.getContext('2d');
//     if (!ctx) return;

//     const textElements = Array.from(document.querySelectorAll('.attractive-text'));

//     const updateAttractorData = () => {
//         // Clear with black for the non-attracting background
//         ctx.fillStyle = 'black';
//         ctx.fillRect(0, 0, viewportSize.width, viewportSize.height);
        
//         // Draw the actual text shapes in white to define attracting areas
//         ctx.fillStyle = 'white';
//         ctx.textAlign = 'center';
//         ctx.textBaseline = 'middle';
        
//         textElements.forEach(el => {
//             const rect = el.getBoundingClientRect();
//             if (rect.top < viewportSize.height && rect.bottom > 0) {
//                 // Get the computed styles to match the text rendering
//                 const styles = window.getComputedStyle(el);
//                 ctx.font = `${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
//                 ctx.fillStyle = 'white';
//                 ctx.textAlign = 'center';
//                 ctx.textBaseline = 'middle';
                
//                 // Get the text content
//                 const textContent = el.textContent || '';
                
//                 // Calculate the max width for text wrapping (use the element's width)
//                 const maxWidth = rect.width - 40; // Leave some margin
                
//                 // Function to wrap text
//                 const wrapText = (text: string, maxWidth: number) => {
//                     const words = text.split(' ');
//                     const lines: string[] = [];
//                     let currentLine = '';
                    
//                     for (const word of words) {
//                         const testLine = currentLine ? currentLine + ' ' + word : word;
//                         const metrics = ctx.measureText(testLine);
                        
//                         if (metrics.width > maxWidth && currentLine) {
//                             lines.push(currentLine);
//                             currentLine = word;
//                         } else {
//                             currentLine = testLine;
//                         }
//                     }
                    
//                     if (currentLine) {
//                         lines.push(currentLine);
//                     }
                    
//                     return lines;
//                 };
                
//                 // Wrap the text
//                 const lines = wrapText(textContent, maxWidth);
                
//                 // Calculate line height (approximate based on font size)
//                 const fontSize = parseFloat(styles.fontSize);
//                 const lineHeight = fontSize * 1.2; // 1.2 is a typical line-height ratio
                
//                 // Render each line
//                 lines.forEach((line, index) => {
//                     const y = rect.top + rect.height / 2 + (index - (lines.length - 1) / 2) * lineHeight;
//                     ctx.fillText(line, rect.left + rect.width / 2, y);
//                 });
                
//                 // Debug: Draw a red border around the text area
//                 // ctx.strokeStyle = 'red';
//                 // ctx.lineWidth = 2;
//                 // ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);
//             }
//         });

//         // Convert canvas to a data buffer
//         const imageData = ctx.getImageData(0, 0, viewportSize.width, viewportSize.height);
//         const data = new Float32Array(viewportSize.width * viewportSize.height);
//         for (let i = 0; i < imageData.data.length; i += 4) {
//             data[i / 4] = imageData.data[i] / 255.0;
//         }
//         setAttractorData(data);
//     };
    
//     let animationFrameId: number;
//     const onScroll = () => {
//       cancelAnimationFrame(animationFrameId);
//       animationFrameId = requestAnimationFrame(updateAttractorData);
//     };
    
//     const onResize = () => {
//         canvas.width = window.innerWidth;
//         canvas.height = window.innerHeight;
//         requestAnimationFrame(updateAttractorData);
//     };
    
//     window.addEventListener('scroll', onScroll, { passive: true });
//     window.addEventListener('resize', onResize, { passive: true });
//     updateAttractorData(); // Initial draw

//     return () => {
//       window.removeEventListener('scroll', onScroll);
//       window.removeEventListener('resize', onResize);
//       cancelAnimationFrame(animationFrameId);
//     };
//   }, [viewportSize, isDebugMode]);

//   // Effect to download debug image once when debug mode is enabled
//   useEffect(() => {
//     if (isDebugMode && attractorData) {
//       const canvas = document.createElement('canvas');
//       canvas.width = viewportSize.width;
//       canvas.height = viewportSize.height;
//       const ctx = canvas.getContext('2d');
//       if (ctx) {
//         // Recreate the attractor map for download
//         ctx.fillStyle = 'black';
//         ctx.fillRect(0, 0, viewportSize.width, viewportSize.height);
        
//         ctx.fillStyle = 'white';
//         ctx.textAlign = 'center';
//         ctx.textBaseline = 'middle';
        
//         const textElements = Array.from(document.querySelectorAll('.attractive-text'));
//         textElements.forEach(el => {
//             const rect = el.getBoundingClientRect();
//             if (rect.top < viewportSize.height && rect.bottom > 0) {
//                 const styles = window.getComputedStyle(el);
//                 ctx.font = `${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
//                 ctx.fillStyle = 'white';
                
//                 const textContent = el.textContent || '';
//                 const maxWidth = rect.width - 40;
                
//                 // Function to wrap text (same as above)
//                 const wrapText = (text: string, maxWidth: number) => {
//                     const words = text.split(' ');
//                     const lines: string[] = [];
//                     let currentLine = '';
                    
//                     for (const word of words) {
//                         const testLine = currentLine ? currentLine + ' ' + word : word;
//                         const metrics = ctx.measureText(testLine);
                        
//                         if (metrics.width > maxWidth && currentLine) {
//                             lines.push(currentLine);
//                             currentLine = word;
//                         } else {
//                             currentLine = testLine;
//                         }
//                     }
                    
//                     if (currentLine) {
//                         lines.push(currentLine);
//                     }
                    
//                     return lines;
//                 };
                
//                 const lines = wrapText(textContent, maxWidth);
//                 const fontSize = parseFloat(styles.fontSize);
//                 const lineHeight = fontSize * 1.2;
                
//                 lines.forEach((line, index) => {
//                     const y = rect.top + rect.height / 2 + (index - (lines.length - 1) / 2) * lineHeight;
//                     ctx.fillText(line, rect.left + rect.width / 2, y);
//                 });
                
//                 // Debug border
//                 ctx.strokeStyle = 'red';
//                 ctx.lineWidth = 2;
//                 ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);
//             }
//         });
        
//         // Download once
//         const link = document.createElement('a');
//         link.download = 'attractor-debug.png';
//         link.href = canvas.toDataURL();
//         link.click();
//       }
//     }
//   }, [isDebugMode]); // Only run when debug mode changes

//   // Effect to update scroll indicators
//   useEffect(() => {
//     const updateIndicators = () => {
//       const textElements = Array.from(document.querySelectorAll('.attractive-text'));
//       const viewportHeight = window.innerHeight;
      
//       textElements.forEach((el, index) => {
//         const indicator = document.getElementById(`indicator-${index + 1}`);
//         if (!indicator) return;
        
//         const rect = el.getBoundingClientRect();
//         const isInViewport = rect.top < viewportHeight && rect.bottom > 0;
        
//         if (isInViewport) {
//           indicator.classList.add('active');
//         } else {
//           indicator.classList.remove('active');
//         }
//       });
//     };
    
//     window.addEventListener('scroll', updateIndicators, { passive: true });
//     updateIndicators(); // Initial update
    
//     return () => {
//       window.removeEventListener('scroll', updateIndicators);
//     };
//   }, []);

//   return (
//     <>
//       <style>{`
//         .attractive-text {
//           color: rgba(255, 255, 255, 0);
//         }
//         .scroll-indicator {
//           position: fixed;
//           left: 20px;
//           top: 50%;
//           transform: translateY(-50%);
//           z-index: 20;
//           background: rgba(0, 0, 0, 0.8);
//           padding: 10px;
//           border-radius: 8px;
//           font-size: 12px;
//           color: white;
//           max-width: 200px;
//         }
//         .indicator-dot {
//           position: fixed;
//           left: 10px;
//           width: 8px;
//           height: 8px;
//           background: #00ff00;
//           border-radius: 50%;
//           z-index: 20;
//           transition: all 0.3s ease;
//         }
//         .indicator-dot.active {
//           background: #ff0000;
//           box-shadow: 0 0 10px #ff0000;
//         }
//       `}</style>
      
//       {viewportSize.width > 0 && (
//         <SlimeSimulation
//           width={viewportSize.width}
//           height={viewportSize.height}
//           numSlimes={numSlimes}
//           decayRate={decayRate}
//           diffusionRate={diffusionRate}
//           moveSpeed={moveSpeed}
//           turnSpeed={turnSpeed}
//           sensorDistance={sensorDistance}
//           sensorSize={sensorSize}
//           sensorAngle={sensorAngle}
//           attractionStrength={attractionStrength}
//           attractorData={attractorData}
//         />
//       )}
      
//       {/* Scroll Indicators */}
//       {/* <div className="scroll-indicator">
//         <div className="font-bold mb-2">Scroll Indicators</div>
//         <div className="space-y-1 text-xs">
//           <div className="flex items-center">
//             <div className="indicator-dot" id="indicator-1"></div>
//             <span className="ml-3">Interactive Background</span>
//           </div>
//           <div className="flex items-center">
//             <div className="indicator-dot" id="indicator-2"></div>
//             <span className="ml-3">Slime Agents</span>
//           </div>
//           <div className="flex items-center">
//             <div className="indicator-dot" id="indicator-3"></div>
//             <span className="ml-3">Visual Experience</span>
//           </div>
//           <div className="flex items-center">
//             <div className="indicator-dot" id="indicator-4"></div>
//             <span className="ml-3">Technical Details</span>
//           </div>
//           <div className="flex items-center">
//             <div className="indicator-dot" id="indicator-5"></div>
//             <span className="ml-3">GPU Shaders</span>
//           </div>
//           <div className="flex items-center">
//             <div className="indicator-dot" id="indicator-6"></div>
//             <span className="ml-3">Enjoy!</span>
//           </div>
//         </div>
//         <div className="mt-3 text-xs text-gray-400">
//           Green = Text visible<br/>
//           Red = Text in viewport
//         </div>
//       </div> */}
      
//       {/* Debug Attractor Map Overlay */}
//       {isDebugMode && attractorData && (
//        <>
//        <div className="bg-black bg-opacity-50 backdrop-blur-sm p-4 rounded-lg mb-8">
//             <h1 className="text-3xl font-bold mb-4">Slime Mold Simulation</h1>
//             <p className="text-gray-300 mb-6">
//               Scroll down to see the slimes interact with the text.
//             </p>
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
//               <div className="bg-gray-800 bg-opacity-70 p-4 rounded-lg">
//                 <label className="block text-sm font-medium mb-2">Number of Slimes</label>
//                 <input
//                   type="range"
//                   min="1000"
//                   max="100000"
//                   step="1000"
//                   value={numSlimes}
//                   onChange={(e) => setNumSlimes(Number(e.target.value))}
//                   className="w-full"
//                 />
//                 <span className="text-sm text-gray-400">{numSlimes}</span>
//               </div>
//               <div className="bg-gray-800 bg-opacity-70 p-4 rounded-lg">
//                 <label className="block text-sm font-medium mb-2">Decay Rate</label>
//                 <input
//                   type="range"
//                   min="0.95"
//                   max="0.999"
//                   step="0.001"
//                   value={decayRate}
//                   onChange={(e) => setDecayRate(Number(e.target.value))}
//                   className="w-full"
//                 />
//                 <span className="text-sm text-gray-400">{decayRate}</span>
//               </div>
//               <div className="bg-gray-800 bg-opacity-70 p-4 rounded-lg">
//                 <label className="block text-sm font-medium mb-2">Diffusion Rate</label>
//                 <input
//                   type="range"
//                   min="0.1"
//                   max="1.0"
//                   step="0.1"
//                   value={diffusionRate}
//                   onChange={(e) => setDiffusionRate(Number(e.target.value))}
//                   className="w-full"
//                 />
//                 <span className="text-sm text-gray-400">{diffusionRate}</span>
//               </div>
//               <div className="bg-gray-800 bg-opacity-70 p-4 rounded-lg">
//                 <label className="block text-sm font-medium mb-2">Move Speed</label>
//                 <input
//                   type="range"
//                   min="0.0001"
//                   max="0.01"
//                   step="0.0001"
//                   value={moveSpeed}
//                   onChange={(e) => setMoveSpeed(Number(e.target.value))}
//                   className="w-full"
//                 />
//                 <span className="text-sm text-gray-400">{moveSpeed.toFixed(4)}</span>
//               </div>
//               <div className="bg-gray-800 bg-opacity-70 p-4 rounded-lg">
//                 <label className="block text-sm font-medium mb-2">Rotation Speed</label>
//                 <input
//                   type="range"
//                   min="0.01"
//                   max="0.5"
//                   step="0.01"
//                   value={turnSpeed}
//                   onChange={(e) => setTurnSpeed(Number(e.target.value))}
//                   className="w-full"
//                 />
//                 <span className="text-sm text-gray-400">{turnSpeed.toFixed(2)}</span>
//               </div>
//               <div className="bg-gray-800 bg-opacity-70 p-4 rounded-lg">
//                 <label className="block text-sm font-medium mb-2">Sensor Distance</label>
//                 <input
//                   type="range"
//                   min="0.005"
//                   max="0.5"
//                   step="0.005"
//                   value={sensorDistance}
//                   onChange={(e) => setSensorDistance(Number(e.target.value))}
//                   className="w-full"
//                 />
//                 <span className="text-sm text-gray-400">{sensorDistance.toFixed(3)}</span>
//               </div>
//               <div className="bg-gray-800 bg-opacity-70 p-4 rounded-lg">
//                 <label className="block text-sm font-medium mb-2">Sensor Size</label>
//                 <input
//                   type="range"
//                   min="1"
//                   max="10"
//                   step="1"
//                   value={sensorSize}
//                   onChange={(e) => setSensorSize(Number(e.target.value))}
//                   className="w-full"
//                 />
//                 <span className="text-sm text-gray-400">{sensorSize}px</span>
//               </div>
//               <div className="bg-gray-800 bg-opacity-70 p-4 rounded-lg">
//                 <label className="block text-sm font-medium mb-2">Sensor Angle</label>
//                 <input
//                   type="range"
//                   min="0.1"
//                   max="1.0"
//                   step="0.05"
//                   value={sensorAngle}
//                   onChange={(e) => setSensorAngle(Number(e.target.value))}
//                   className="w-full"
//                 />
//                 <span className="text-sm text-gray-400">{sensorAngle.toFixed(2)} rad</span>
//               </div>
//               <div className="bg-gray-800 bg-opacity-70 p-4 rounded-lg">
//                 <label className="block text-sm font-medium mb-2">Attraction Strength</label>
//                 <input
//                   type="range"
//                   min="0"
//                   max="1"
//                   step="0.005"
//                   value={attractionStrength}
//                   onChange={(e) => setAttractionStrength(Number(e.target.value))}
//                   className="w-full"
//                 />
//                 <span className="text-sm text-gray-400">{attractionStrength.toFixed(3)}</span>
//               </div>
//             </div>
//           </div>
       
//        <div style={{
//           position: 'fixed',
//           top: '20px',
//           right: '20px',
//           width: '200px',
//           height: '200px',
//           border: '2px solid red',
//           zIndex: 1000,
//           background: 'black'
//         }}>
//           <canvas
//             ref={(canvas) => {
//               if (canvas && attractorData) {
//                 const ctx = canvas.getContext('2d');
//                 if (ctx) {
//                   canvas.width = 200;
//                   canvas.height = 200;
//                   const imageData = ctx.createImageData(200, 200);
                  
//                   // Scale down the attractor data to fit the debug canvas
//                   for (let y = 0; y < 200; y++) {
//                     for (let x = 0; x < 200; x++) {
//                       const srcX = Math.floor(x * viewportSize.width / 200);
//                       const srcY = Math.floor(y * viewportSize.height / 200);
//                       const srcIndex = srcY * viewportSize.width + srcX;
                      
//                       if (srcIndex < attractorData.length) {
//                         const value = attractorData[srcIndex];
//                         const pixelIndex = (y * 200 + x) * 4;
//                         imageData.data[pixelIndex] = value * 255;     // R
//                         imageData.data[pixelIndex + 1] = value * 255; // G
//                         imageData.data[pixelIndex + 2] = value * 255; // B
//                         imageData.data[pixelIndex + 3] = 255;         // A
//                       }
//                     }
//                   }
                  
//                   ctx.putImageData(imageData, 0, 0);
//                 }
//               }
//             }}
//             style={{ width: '100%', height: '100%' }}
//           />
//           <div style={{ position: 'absolute', top: '-25px', left: '0', color: 'red', fontSize: '12px' }}>
//             Attractor Map (Debug)
//           </div>
//         </div>
//         </>
//       )}
      
//       <div className="relative z-10 text-white">
//         <div className="container mx-auto p-4">
          
  
//           <div className="space-y-12 text-left text-9xl">
//             <div className="h-screen flex items-center justify-center">
//               <p className="attractive-text">Hello</p>
//             </div>
//             <div className="h-screen flex items-center justify-center">
//               <p className="attractive-text">The slime agents are programmed to seek out and illuminate areas of text as you scroll.</p>
//             </div>
//             <div className="h-screen flex items-center justify-center">
//               <p className="attractive-text">This creates a unique, generative visual experience where the content and the background are deeply intertwined.</p>
//             </div>
//             <div className="h-screen flex items-center justify-center">
//               <h3 className="attractive-text font-bold text-4xl">Technical Details</h3>
//             </div>
//              <div className="h-screen flex items-center justify-center">
//               <ul className="attractive-text text-left list-disc list-inside space-y-4">
//                   <li>The simulation runs entirely on the GPU using compute shaders for massive parallelism.</li>
//                   <li>An "attractor map" is generated on the fly by rendering text positions to a hidden 2D canvas.</li>
//                   <li>This map is passed to the GPU, guiding the slimes' behavior in real-time.</li>
//               </ul>
//             </div>
//             <div className="h-screen flex items-center justify-center">
//               <p className="attractive-text">Enjoy the simulation!</p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   )
// } 