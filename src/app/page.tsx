"use client"

import { useState, useEffect } from 'react'
import SlimeSimulation from '@/components/SlimeSimulation'

export default function Home() {
  const [numSlimes, setNumSlimes] = useState(50000)
  const [decayRate, setDecayRate] = useState(0.965)
  const [diffusionRate, setDiffusionRate] = useState(0.350)
  const [moveSpeed, setMoveSpeed] = useState(0.0035)
  const [turnSpeed, setTurnSpeed] = useState(0.20)
  const [sensorDistance, setSensorDistance] = useState(0.0035)
  const [sensorSize, setSensorSize] = useState(1)
  const [sensorAngle, setSensorAngle] = useState(0.43)
  const [attractionStrength, setAttractionStrength] = useState(1.0)
  const [attractorData, setAttractorData] = useState<Float32Array | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [webGPUAvailable, setWebGPUAvailable] = useState(true);
  const [textCenters, setTextCenters] = useState<Float32Array | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    boundingBoxes: [] as [number, number, number, number][],
    attractorDataSize: 0,
    lastUpdate: 0,
    scrollY: 0
  });
  const [initialDataReady, setInitialDataReady] = useState(false);

  // Effect to check WebGPU availability
  useEffect(() => {
    const checkWebGPU = async () => {
      try {
        const adapter = await navigator.gpu?.requestAdapter();
        const device = await adapter?.requestDevice();
        setWebGPUAvailable(!!device);
      } catch (error) {
        setWebGPUAvailable(false);
        console.error(error);
      }
    };
    checkWebGPU();
  }, []);

  // Effect to track viewport size
  useEffect(() => {
    const handleResize = () => {
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    };
    handleResize(); // Initial size
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Effect to create and manage the attractor data from page content
  useEffect(() => {
    if (viewportSize.width === 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = viewportSize.width;
    canvas.height = viewportSize.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const textElements = Array.from(document.querySelectorAll('.attractive-text'));

    if (debugMode) {
      console.log('[Page] Found attractive text elements:', textElements.length);
      textElements.forEach((el, index) => {
        console.log(`[Page] Element ${index}:`, {
          tagName: el.tagName,
          textContent: el.textContent?.substring(0, 50),
          className: el.className,
          rect: el.getBoundingClientRect()
        });
      });
    }

    const updateAttractorData = () => {
        // Check if text elements are properly rendered
        const textElements = Array.from(document.querySelectorAll('.attractive-text'));
        const validElements = textElements.filter(el => {
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && rect.top < viewportSize.height && rect.bottom > 0;
        });
        
        if (validElements.length === 0) {
            if (debugMode) {
                console.log('[Page] No valid text elements found, clearing attractor data and bounding boxes');
            }
            // Clear attractor data and bounding boxes when no valid elements
            const clearedAttractorData = new Float32Array(viewportSize.width * viewportSize.height);
            setAttractorData(clearedAttractorData);
            
            // Create dummy array with fixed size
            const dummyBoxesArray = new Float32Array(40).fill(-999.0);
            setTextCenters(dummyBoxesArray);
            
            setDebugInfo({
                boundingBoxes: [],
                attractorDataSize: viewportSize.width * viewportSize.height,
                lastUpdate: Date.now(),
                scrollY: window.scrollY
            });
            
            if (debugMode) {
                console.log('[Page] Cleared attractor data:', {
                    size: clearedAttractorData.length,
                    maxValue: Math.max(...clearedAttractorData),
                    nonZeroCount: clearedAttractorData.filter(v => v > 0).length
                });
            }
            return;
        }
        
        if (debugMode) {
            console.log('[Page] Processing', validElements.length, 'valid text elements');
        }
        
        // Clear with black for the non-attracting background
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, viewportSize.width, viewportSize.height);
        
        // Calculate bounding boxes for individual words
        const boundingBoxes: [number, number, number, number][] = []; // [x1, y1, x2, y2] in world coordinates
        
        validElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < viewportSize.height && rect.bottom > 0) {
                // Get the computed styles to match the text rendering
                const styles = window.getComputedStyle(el);
                ctx.font = `${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Get the text content
                const textContent = el.textContent || '';
                
                // Calculate the max width for text wrapping (use the element's width)
                const maxWidth = rect.width - 40; // Leave some margin
                
                // Function to wrap text
                const wrapText = (text: string, maxWidth: number) => {
                    const words = text.split(' ');
                    const lines: string[] = [];
                    let currentLine = '';
                    
                    for (const word of words) {
                        const testLine = currentLine ? currentLine + ' ' + word : word;
                        const metrics = ctx.measureText(testLine);
                        
                        if (metrics.width > maxWidth && currentLine) {
                            lines.push(currentLine);
                            currentLine = word;
                        } else {
                            currentLine = testLine;
                        }
                    }
                    
                    if (currentLine) {
                        lines.push(currentLine);
                    }
                    
                    return lines;
                };
                
                // Wrap the text
                const lines = wrapText(textContent, maxWidth);
                
                // Calculate line height (approximate based on font size)
                const fontSize = parseFloat(styles.fontSize);
                const lineHeight = fontSize * 1.2; // 1.2 is a typical line-height ratio
                
                // Create bounding boxes for each word
                const words = textContent.split(' ');
                let wordIndex = 0;
                
                lines.forEach((line, lineIndex) => {
                    const lineY = rect.top + rect.height / 2 + (lineIndex - (lines.length - 1) / 2) * lineHeight;
                    const lineWords = line.split(' ');
                    
                    // Calculate the starting x position for this line (centered)
                    const lineWidth = ctx.measureText(line).width;
                    const lineStartX = rect.left + rect.width / 2 - lineWidth / 2;
                    
                    let currentX = lineStartX;
                    
                    lineWords.forEach((word) => {
                        const wordWidth = ctx.measureText(word).width;
                        const wordX = currentX + wordWidth / 2; // Center of the word
                        
                        // Create bounding box for this word
                        const wordRect = {
                            left: wordX - wordWidth / 2 - 5, // Add some padding
                            top: lineY - fontSize / 2 - 5,
                            right: wordX + wordWidth / 2 + 5,
                            bottom: lineY + fontSize / 2 + 5
                        };
                        
                        // Convert to world coordinates (-1 to 1)
                        const x1 = (wordRect.left / viewportSize.width) * 2 - 1;
                        const y1 = (wordRect.top / viewportSize.height) * 2 - 1;
                        const x2 = (wordRect.right / viewportSize.width) * 2 - 1;
                        const y2 = (wordRect.bottom / viewportSize.height) * 2 - 1;
                        
                        // Check if the word is actually visible on screen (not just clamped)
                        const isVisible = wordRect.left < viewportSize.width && 
                                        wordRect.right > 0 && 
                                        wordRect.top < viewportSize.height && 
                                        wordRect.bottom > 0;
                        
                        // Only add the bounding box if it's visible and has a valid size
                        if (isVisible && x2 > x1 && y2 > y1) {
                            // Clamp coordinates to ensure they stay within viewport bounds
                            const clampedX1 = Math.max(-1, Math.min(1, x1));
                            const clampedY1 = Math.max(-1, Math.min(1, y1));
                            const clampedX2 = Math.max(-1, Math.min(1, x2));
                            const clampedY2 = Math.max(-1, Math.min(1, y2));
                            
                            // Only add if the clamped box still has a valid size
                            if (clampedX2 > clampedX1 && clampedY2 > clampedY1) {
                                boundingBoxes.push([clampedX1, clampedY1, clampedX2, clampedY2]);
                                
                                if (debugMode) {
                                    console.log(`Word "${word}" bounding box:`, {
                                        screen: { left: wordRect.left, top: wordRect.top, right: wordRect.right, bottom: wordRect.bottom },
                                        world: { x1: clampedX1, y1: clampedY1, x2: clampedX2, y2: clampedY2 },
                                        wasClamped: x1 !== clampedX1 || y1 !== clampedY1 || x2 !== clampedX2 || y2 !== clampedY2
                                    });
                                }
                            } else if (debugMode) {
                                console.log(`Word "${word}" skipped - invalid size after clamping`);
                            }
                        } else if (debugMode) {
                            console.log(`Word "${word}" skipped - not visible on screen`);
                        }
                        
                        currentX += wordWidth + ctx.measureText(' ').width; // Move to next word
                        wordIndex++;
                    });
                });
            }
        });
        
        // Now draw the text to create attractor data
        ctx.fillStyle = 'white';
        validElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < viewportSize.height && rect.bottom > 0) {
                // Get the computed styles to match the text rendering
                const styles = window.getComputedStyle(el);
                ctx.font = `${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
                ctx.fillStyle = 'white';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Get the text content
                const textContent = el.textContent || '';
                
                // Calculate the max width for text wrapping (use the element's width)
                const maxWidth = rect.width - 40; // Leave some margin
                
                // Function to wrap text
                const wrapText = (text: string, maxWidth: number) => {
                    const words = text.split(' ');
                    const lines: string[] = [];
                    let currentLine = '';
                    
                    for (const word of words) {
                        const testLine = currentLine ? currentLine + ' ' + word : word;
                        const metrics = ctx.measureText(testLine);
                        
                        if (metrics.width > maxWidth && currentLine) {
                            lines.push(currentLine);
                            currentLine = word;
                        } else {
                            currentLine = testLine;
                        }
                    }
                    
                    if (currentLine) {
                        lines.push(currentLine);
                    }
                    
                    return lines;
                };
                
                // Wrap the text
                const lines = wrapText(textContent, maxWidth);
                
                // Calculate line height (approximate based on font size)
                const fontSize = parseFloat(styles.fontSize);
                const lineHeight = fontSize * 1.2; // 1.2 is a typical line-height ratio
                
                // Render each line
                lines.forEach((line, index) => {
                    const y = rect.top + rect.height / 2 + (index - (lines.length - 1) / 2) * lineHeight;
                    ctx.fillText(line, rect.left + rect.width / 2, y);
                });
            }
        });

        // Convert canvas to a data buffer
        const imageData = ctx.getImageData(0, 0, viewportSize.width, viewportSize.height);
        const data = new Float32Array(viewportSize.width * viewportSize.height);
        for (let i = 0; i < imageData.data.length; i += 4) {
            data[i / 4] = imageData.data[i] / 255.0;
        }
        setAttractorData(data);
        
        // Convert bounding boxes to Float32Array (x1, y1, x2, y2 for each box)
        // Use fixed size of 10 boxes maximum, fill unused slots with dummy data
        const MAX_BOXES = 10;
        const boxesArray = new Float32Array(MAX_BOXES * 4);
        
        // Fill with dummy data first (all -999.0 to indicate unused slots)
        for (let i = 0; i < MAX_BOXES * 4; i++) {
            boxesArray[i] = -999.0;
        }
        
        // Fill with real bounding boxes
        boundingBoxes.forEach(([x1, y1, x2, y2], i) => {
            if (i < MAX_BOXES) {
                boxesArray[i * 4] = x1;
                boxesArray[i * 4 + 1] = y1;
                boxesArray[i * 4 + 2] = x2;
                boxesArray[i * 4 + 3] = y2;
            }
        });
        
        setTextCenters(boxesArray);
        
        // Update debug info
        setDebugInfo({
            boundingBoxes,
            attractorDataSize: data.length,
            lastUpdate: Date.now(),
            scrollY: window.scrollY
        });
        
        if (debugMode) {
            console.log('[Page] Updated bounding boxes:', {
                count: boundingBoxes.length,
                boxes: boundingBoxes.slice(-3), // Show last 3 boxes
                scrollY: window.scrollY,
                timestamp: Date.now()
            });
        }
        
        // Mark initial data as ready
        if (!initialDataReady) {
            setInitialDataReady(true);
            console.log('[Page] Initial attractor data and bounding boxes created');
        }
        
        if (debugMode) {
            console.log(`Updated attractor data:`, {
                dataSize: data.length,
                boundingBoxesCount: boundingBoxes.length,
                scrollY: window.scrollY,
                timestamp: Date.now()
            });
        }
    };
    
    // Create initial data immediately
    // Add a small delay to ensure DOM is fully rendered
    setTimeout(() => {
      updateAttractorData();
    }, 200);
    
    let animationFrameId: number;
    const onScroll = () => {
      if (debugMode) {
        console.log('Scroll event fired, scrollY:', window.scrollY);
      }
      // Remove immediate call to prevent race conditions
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(updateAttractorData);
    };
    
    const onResize = () => {
        if (debugMode) {
          console.log('Resize event fired, new size:', { width: window.innerWidth, height: window.innerHeight });
        }
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        requestAnimationFrame(updateAttractorData);
    };
    
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [viewportSize, debugMode, initialDataReady]);

  // Effect to restart simulation when numSlimes changes
  useEffect(() => {
    if (initialDataReady) {
      console.log('[Page] Num slimes changed to:', numSlimes, '- restarting simulation');
      setInitialDataReady(false);
      // Small delay to ensure the simulation stops before restarting
      setTimeout(() => {
        setInitialDataReady(true);
      }, 100);
    }
  }, [numSlimes]);

  return (
    <>
      <style>{`
        .attractive-text {
          color: ${webGPUAvailable === false ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0)'};
        }
      `}</style>
      
      {/* Debug Controls */}
      { debugMode && (
      <div className="fixed top-4 right-4 z-50 bg-black bg-opacity-80 text-white p-4 rounded-lg max-w-sm">
        <div className="flex items-center gap-4 mb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={debugMode}
              onChange={(e) => setDebugMode(e.target.checked)}
              className="w-4 h-4"
            />
            Debug Mode
          </label>
          <button
            onClick={() => {
              console.log('Debug Info:', debugInfo);
              console.log('Attractor Data:', attractorData);
              console.log('Text Centers (Bounding Boxes):', textCenters);
            }}
            className="px-3 py-1 bg-blue-600 rounded text-sm"
          >
            Log Data
          </button>
          <button
            onClick={() => {
              console.log('Forcing clear of bounding boxes');
              setTextCenters(new Float32Array(0));
            }}
            className="px-3 py-1 bg-red-600 rounded text-sm"
          >
            Clear Boxes
          </button>
          <button
            onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
            className={`px-3 py-1 rounded text-sm ${showBoundingBoxes ? 'bg-green-600' : 'bg-gray-600'}`}
          >
            {showBoundingBoxes ? 'Hide' : 'Show'} Boxes
          </button>
        </div>
        
        {/* Parameter Sliders */}
        <div className="space-y-3 mb-4">
          <h3 className="text-sm font-bold">Simulation Parameters</h3>
          
          <div>
            <label className="text-xs block mb-1">Num Slimes: {numSlimes.toLocaleString()}</label>
            <input
              type="range"
              min="1000"
              max="100000"
              step="1000"
              value={numSlimes}
              onChange={(e) => setNumSlimes(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="text-xs block mb-1">Decay Rate: {decayRate.toFixed(3)}</label>
            <input
              type="range"
              min="0.9"
              max="0.999"
              step="0.001"
              value={decayRate}
              onChange={(e) => setDecayRate(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="text-xs block mb-1">Diffusion Rate: {diffusionRate.toFixed(3)}</label>
            <input
              type="range"
              min="0.01"
              max="0.5"
              step="0.01"
              value={diffusionRate}
              onChange={(e) => setDiffusionRate(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="text-xs block mb-1">Move Speed: {moveSpeed.toFixed(4)}</label>
            <input
              type="range"
              min="0.001"
              max="0.01"
              step="0.0001"
              value={moveSpeed}
              onChange={(e) => setMoveSpeed(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="text-xs block mb-1">Turn Speed: {turnSpeed.toFixed(2)}</label>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.01"
              value={turnSpeed}
              onChange={(e) => setTurnSpeed(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="text-xs block mb-1">Sensor Distance: {sensorDistance.toFixed(4)}</label>
            <input
              type="range"
              min="0.001"
              max="0.02"
              step="0.0001"
              value={sensorDistance}
              onChange={(e) => setSensorDistance(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="text-xs block mb-1">Sensor Size: {sensorSize}</label>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={sensorSize}
              onChange={(e) => setSensorSize(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="text-xs block mb-1">Sensor Angle: {sensorAngle.toFixed(2)}</label>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.01"
              value={sensorAngle}
              onChange={(e) => setSensorAngle(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="text-xs block mb-1">Attraction Strength: {attractionStrength.toFixed(2)}</label>
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.01"
              value={attractionStrength}
              onChange={(e) => setAttractionStrength(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
        
        {debugMode && (
          <div className="text-sm space-y-2">
            <div>Scroll Y: {debugInfo.scrollY}</div>
            <div>Bounding Boxes: {debugInfo.boundingBoxes.length}</div>
            <div>Attractor Data Size: {debugInfo.attractorDataSize}</div>
            <div>Last Update: {new Date(debugInfo.lastUpdate).toLocaleTimeString()}</div>
            <div>Viewport: {viewportSize.width} x {viewportSize.height}</div>
          </div>
        )}
      </div>
      )}
      
      {/* Debug Overlay - Bounding Boxes */}
      {debugMode && showBoundingBoxes && (
        <div className="fixed inset-0 pointer-events-none z-40">
          {debugInfo.boundingBoxes.map(([x1, y1, x2, y2], index) => {
            const screenX1 = ((x1 + 1) / 2) * viewportSize.width;
            const screenY1 = ((y1 + 1) / 2) * viewportSize.height;
            const screenX2 = ((x2 + 1) / 2) * viewportSize.width;
            const screenY2 = ((y2 + 1) / 2) * viewportSize.height;
            
            return (
              <div
                key={index}
                className="absolute border-2 border-red-500 bg-red-500 bg-opacity-20"
                style={{
                  left: screenX1,
                  top: screenY1,
                  width: screenX2 - screenX1,
                  height: screenY2 - screenY1,
                }}
              >
                <div className="absolute -top-6 left-0 bg-red-500 text-white text-xs px-1">
                  Box {index}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Debug Attractor Data Visualization */}
      {debugMode && attractorData && (
        <div className="fixed bottom-4 left-4 z-50 bg-black bg-opacity-80 text-white p-4 rounded-lg">
          <h3 className="text-sm font-bold mb-2">Attractor Data Preview</h3>
          <div className="w-32 h-32 border border-white relative overflow-hidden">
            <canvas
              ref={(canvas) => {
                if (canvas && attractorData) {
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    canvas.width = 128;
                    canvas.height = 128;
                    
                    // Create a scaled down version of the attractor data
                    const imageData = ctx.createImageData(128, 128);
                    for (let y = 0; y < 128; y++) {
                      for (let x = 0; x < 128; x++) {
                        const srcX = Math.floor((x / 128) * viewportSize.width);
                        const srcY = Math.floor((y / 128) * viewportSize.height);
                        const srcIndex = srcY * viewportSize.width + srcX;
                        
                        if (srcIndex < attractorData.length) {
                          const value = Math.floor(attractorData[srcIndex] * 255);
                          const index = (y * 128 + x) * 4;
                          imageData.data[index] = value;     // R
                          imageData.data[index + 1] = value; // G
                          imageData.data[index + 2] = value; // B
                          imageData.data[index + 3] = 255;   // A
                        }
                      }
                    }
                    ctx.putImageData(imageData, 0, 0);
                  }
                }
              }}
              className="w-full h-full"
            />
          </div>
        </div>
      )}
      
      {viewportSize.width > 0 && webGPUAvailable && initialDataReady && attractorData && textCenters && (
        (() => {
          console.log('[Page] Starting SlimeSimulation with:', {
            viewportSize,
            attractorDataSize: attractorData.length,
            textCentersSize: textCenters.length,
            numBoxes: textCenters.length / 4,
            timestamp: Date.now()
          });
          return (
            <SlimeSimulation
              width={viewportSize.width}
              height={viewportSize.height}
              numSlimes={numSlimes}
              decayRate={decayRate}
              diffusionRate={diffusionRate}
              moveSpeed={moveSpeed}
              turnSpeed={turnSpeed}
              sensorDistance={sensorDistance}
              sensorSize={sensorSize}
              sensorAngle={sensorAngle}
              attractionStrength={attractionStrength}
              attractorData={attractorData}
              textCenters={textCenters}
            />
          );
        })()
      )}
      
      <div className="relative z-10 text-white">
        <div className="container mx-auto p-4">
          
          {/* Hero Section */}
          <div className="h-screen relative">
            <div className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2">
              <h1 className="attractive-text text-6xl md:text-9xl font-bold">WELCOME</h1>
            </div>
            <div className="absolute bottom-1/4 right-1/4 transform translate-x-1/2 translate-y-1/2">
              <h2 className="attractive-text text-6xl md:text-9xl font-bold">CREATIVE</h2>
            </div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
              <p className="text-2xl max-w-2xl">
                Exploring the intersection of art, technology, and emergent behavior through interactive experiences.
              </p>
            </div>
          </div>

          {/* About Section */}
          <div className="h-screen relative">
            <div className="absolute top-1/3 left-1/3 transform -translate-x-1/2 -translate-y-1/2">
              <h2 className="attractive-text text-6xl md:text-9xl font-bold">ABOUT</h2>
            </div>
            <div className="absolute bottom-1/3 right-1/3 transform translate-x-1/2 translate-y-1/2">
              <h3 className="attractive-text text-6xl md:text-9xl font-bold">EXPLORE</h3>
            </div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-4xl text-center">
              <p className="text-xl leading-relaxed">
                This space showcases experiments in computational creativity, from slime mold simulations to generative art. 
                Each piece explores how simple rules can create complex, beautiful behaviors.
              </p>
            </div>
          </div>

          {/* Skills Section */}
          <div className="h-screen relative">
            <div className="absolute top-1/4 right-1/4 transform translate-x-1/2 -translate-y-1/2">
              <h2 className="attractive-text text-6xl md:text-9xl font-bold">IDEAS</h2>
            </div>
            <div className="absolute top-1/12 left-1/3 transform -translate-x-1/2 -translate-y-1/2">
              <h3 className="attractive-text text-6xl md:text-9xl font-bold">EXPERIMENTS</h3>
            </div>
            <div className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 translate-y-1/2">
              <h4 className="attractive-text text-6xl md:text-9xl font-bold">DISCOVER</h4>
            </div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-4xl text-center">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <h3 className="text-2xl font-semibold mb-4">Emergence</h3>
                  <p className="">Complex patterns from simple rules, collective behavior, self-organization</p>
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-semibold mb-4">Interaction</h3>
                  <p className="">Real-time responses, dynamic systems, user-driven experiences</p>
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-semibold mb-4">Technology</h3>
                  <p className="">WebGPU, WebGL, modern browsers, cutting-edge graphics</p>
                </div>
              </div>
            </div>
          </div>

          {/* Projects Section */}
          <div className="h-screen relative">
            <div className="absolute top-1/3 left-1/4 transform -translate-x-1/2 -translate-y-full">
              <h2 className="attractive-text text-6xl md:text-9xl font-bold">CREATIONS</h2>
            </div>
            <div className="absolute top-1/12 right-1/3 transform translate-x-1/2 -translate-y-1/2">
              <h3 className="attractive-text text-6xl md:text-9xl font-bold">EXPLORATIONS</h3>
            </div>
            <div className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 translate-y-1/2">
              <h4 className="attractive-text text-6xl md:text-9xl font-bold">PATTERNS</h4>
            </div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-4xl text-center">
              <div className="space-y-8">
                <div>
                  <h3 className="text-3xl font-semibold mb-2">Slime Mold Simulation</h3>
                  <p className="text-lg">A WebGPU-powered simulation demonstrating how simple agents can create complex, beautiful patterns through collective behavior.</p>
                </div>
                <div>
                  <h3 className="text-3xl font-semibold mb-2">Interactive Visualizations</h3>
                  <p className="text-lg">Real-time graphics and animations that respond to user interaction and environmental changes.</p>
                </div>
                <div>
                  <h3 className="text-3xl font-semibold mb-2">Generative Systems</h3>
                  <p className="text-lg">Algorithmic art and procedural generation exploring the boundaries between order and chaos.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="h-screen relative">
            <div className="absolute top-1/4 left-1/3 transform -translate-x-1/2 -translate-y-1/2">
              <h2 className="attractive-text text-6xl md:text-9xl font-bold">CONNECT</h2>
            </div>
            <div className="absolute bottom-1/4 right-1/3 transform translate-x-1/2 translate-y-1/2">
              <h3 className="attractive-text text-6xl md:text-9xl font-bold">SHARE</h3>
            </div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
              <p className="text-2xl mb-8">
                Explore the code, experiment with parameters, and discover new patterns.
              </p>
              <div className="space-x-8">
                <a href="https://github.com/alessandrocavoli" className="text-xl hover:text-blue-400 transition-colors">
                  View Source
                </a>
                <a href="#" className="text-xl hover:text-blue-400 transition-colors">
                  Learn More
                </a>
                <a href="#" className="text-xl hover:text-blue-400 transition-colors">
                  Experiment
                </a>
              </div>
            </div>
          </div>
        </div>
    </div>
    </>
  )
}
