"use client"

import { useState, useEffect } from 'react'
import SlimeSimulation from '@/components/SlimeSimulation'
import TextContent from '@/components/TextContent'
import DebugControls from '@/components/DebugControls'
import { generateAttractorData } from '@/components/AttractorDataGenerator'

// TypeScript interfaces for the keyframe system
interface Keyframe {
  startPercent: number;
  endPercent: number;
  startValue: number;
  endValue: number;
}

interface ParameterKeyframe {
  parameter: string;
  keyframes: Keyframe[];
}

interface ScrollParameters {
  parallaxStrength?: number;
  sensorDistance?: number;
  attractionStrength?: number;
  moveSpeed?: number;
  turnSpeed?: number;
  sensorSize?: number;
  sensorAngle?: number;
  decayRate?: number;
  diffusionRate?: number;
  hideCube?: number;
  [key: string]: number | undefined;
}

const defaultValues: Record<string, number> = {
  parallaxStrength: 0.0,
  sensorDistance: 0.0035,
  attractionStrength: 1.0,
  moveSpeed: 0.0035,
  turnSpeed: 0.20,
  sensorSize: 1,
  sensorAngle: 0.43,
  decayRate: 0.965,
  diffusionRate: 0.350,
  hideCube: 0,
  numSlimes: 50000
}

export default function Home() {
  const [numSlimes, setNumSlimes] = useState(defaultValues.numSlimes)
  const [decayRate, setDecayRate] = useState(defaultValues.decayRate)
  const [diffusionRate, setDiffusionRate] = useState(defaultValues.diffusionRate)
  const [moveSpeed, setMoveSpeed] = useState(defaultValues.moveSpeed)
  const [turnSpeed, setTurnSpeed] = useState(defaultValues.turnSpeed)
  const [sensorDistance, setSensorDistance] = useState(defaultValues.sensorDistance)
  const [sensorSize, setSensorSize] = useState(defaultValues.sensorSize)
  const [sensorAngle, setSensorAngle] = useState(defaultValues.sensorAngle)
  const [attractionStrength, setAttractionStrength] = useState(defaultValues.attractionStrength)
  const [parallaxStrength, setParallaxStrength] = useState(defaultValues.parallaxStrength)
  const [hideCube, setHideCube] = useState(defaultValues.hideCube)
  const [attractorData, setAttractorData] = useState<Float32Array | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [webGPUAvailable, setWebGPUAvailable] = useState(true);
  const [textCenters, setTextCenters] = useState<Float32Array | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(false);
  const [cubeAnimation, setCubeAnimation] = useState(true);
  const [totalPageHeight, setTotalPageHeight] = useState(0);
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
      // Calculate total page height (document height minus one screen height)
      const docHeight = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );
      setTotalPageHeight(docHeight - window.innerHeight);
    };
    handleResize(); // Initial size
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Function to calculate scroll-based parameters
  const calculateScrollBasedParameters = (scrollY: number, totalHeight: number): ScrollParameters | null => {
    if (totalHeight <= 0) return null;
    
    const scrollProgress = scrollY / totalHeight;
    
    // Define parameter keyframes for easy configuration
    const parameterKeyframes: ParameterKeyframe[] = [
      // Decay Rate keyframes
      {
        parameter: 'decayRate',
        keyframes: [
          { startPercent: 0, endPercent: 10, startValue: 0.965, endValue: 0.900 },
          { startPercent: 10, endPercent: 15, startValue: 0.900, endValue: 0.900 },
          { startPercent: 15, endPercent: 20, startValue: 0.900, endValue: 0.948 },
          { startPercent: 20, endPercent: 30, startValue: 0.948, endValue: 0.948 },
          { startPercent: 30, endPercent: 60, startValue: 0.948, endValue: 0.948 },
          { startPercent: 60, endPercent: 70, startValue: 0.948, endValue: 0.976 },
          { startPercent: 70, endPercent: 80, startValue: 0.976, endValue: 0.964 },
          { startPercent: 80, endPercent: 90, startValue: 0.964, endValue: 0.948 },
          { startPercent: 90, endPercent: 100, startValue: 0.948, endValue: 0.965 }
        ]
      },
      // Diffusion Rate keyframes
      {
        parameter: 'diffusionRate',
        keyframes: [
          { startPercent: 0, endPercent: 10, startValue: 0.350, endValue: 0.340 },
          { startPercent: 10, endPercent: 15, startValue: 0.340, endValue: 0.350 },
          { startPercent: 15, endPercent: 20, startValue: 0.350, endValue: 0.220 },
          { startPercent: 20, endPercent: 30, startValue: 0.220, endValue: 0.400 },
          { startPercent: 30, endPercent: 60, startValue: 0.400, endValue: 0.400 },
          { startPercent: 60, endPercent: 70, startValue: 0.400, endValue: 0.500 },
          { startPercent: 70, endPercent: 80, startValue: 0.500, endValue: 0.500 },
          { startPercent: 80, endPercent: 90, startValue: 0.500, endValue: 0.400 },
          { startPercent: 90, endPercent: 100, startValue: 0.400, endValue: 0.350 }
        ]
      },
      // Move Speed keyframes
      {
        parameter: 'moveSpeed',
        keyframes: [
          { startPercent: 0, endPercent: 10, startValue: 0.0035, endValue: 0.0077 },
          { startPercent: 10, endPercent: 15, startValue: 0.0077, endValue: 0.0056 },
          { startPercent: 15, endPercent: 20, startValue: 0.0056, endValue: 0.0100 },
          { startPercent: 20, endPercent: 25, startValue: 0.0100, endValue: 0.0026 },
          { startPercent: 25, endPercent: 30, startValue: 0.0026, endValue: 0.0100 },
          { startPercent: 30, endPercent: 40, startValue: 0.0100, endValue: 0.0057 },
          { startPercent: 40, endPercent: 50, startValue: 0.0057, endValue: 0.0050 },
          { startPercent: 50, endPercent: 60, startValue: 0.0050, endValue: 0.0100 },
          { startPercent: 60, endPercent: 70, startValue: 0.0100, endValue: 0.0037 },
          { startPercent: 70, endPercent: 80, startValue: 0.0037, endValue: 0.0042 },
          { startPercent: 80, endPercent: 90, startValue: 0.0042, endValue: 0.0042 },
          { startPercent: 90, endPercent: 100, startValue: 0.0042, endValue: 0.0035 }
        ]
      },
      // Turn Speed keyframes
      {
        parameter: 'turnSpeed',
        keyframes: [
          { startPercent: 0, endPercent: 10, startValue: 0.20, endValue: 0.10 },
          { startPercent: 10, endPercent: 15, startValue: 0.10, endValue: 0.68 },
          { startPercent: 15, endPercent: 20, startValue: 0.68, endValue: 0.88 },
          { startPercent: 20, endPercent: 25, startValue: 0.88, endValue: 0.27 },
          { startPercent: 25, endPercent: 30, startValue: 0.27, endValue: 0.88 },
          { startPercent: 30, endPercent: 60, startValue: 0.88, endValue: 1.00 },
          { startPercent: 60, endPercent: 70, startValue: 1.00, endValue: 0.10 },
          { startPercent: 70, endPercent: 80, startValue: 0.10, endValue: 0.42 },
          { startPercent: 80, endPercent: 90, startValue: 0.42, endValue: 0.50 },
          { startPercent: 90, endPercent: 100, startValue: 0.50, endValue: 0.20 }
        ]
      },
      // Sensor Distance keyframes
      {
        parameter: 'sensorDistance',
        keyframes: [
          { startPercent: 0, endPercent: 10, startValue: 0.0035, endValue: 0.0044 },
          { startPercent: 10, endPercent: 15, startValue: 0.0044, endValue: 0.0018 },
          { startPercent: 15, endPercent: 20, startValue: 0.0018, endValue: 0.0200 },
          { startPercent: 20, endPercent: 25, startValue: 0.0200, endValue: 0.0040 },
          { startPercent: 25, endPercent: 30, startValue: 0.0040, endValue: 0.0052 },
          { startPercent: 30, endPercent: 40, startValue: 0.0052, endValue: 0.0166 },
          { startPercent: 40, endPercent: 50, startValue: 0.0166, endValue: 0.0046 },
          { startPercent: 50, endPercent: 60, startValue: 0.0046, endValue: 0.0010 },
          { startPercent: 60, endPercent: 70, startValue: 0.0010, endValue: 0.0113 },
          { startPercent: 70, endPercent: 80, startValue: 0.0113, endValue: 0.0171 },
          { startPercent: 80, endPercent: 90, startValue: 0.0171, endValue: 0.0032 },
          { startPercent: 90, endPercent: 100, startValue: 0.0032, endValue: 0.0035 }
        ]
      },
      // Sensor Angle keyframes
      {
        parameter: 'sensorAngle',
        keyframes: [
          { startPercent: 0, endPercent: 10, startValue: 0.43, endValue: 0.30 },
          { startPercent: 10, endPercent: 15, startValue: 0.30, endValue: 0.10 },
          { startPercent: 15, endPercent: 20, startValue: 0.10, endValue: 0.88 },
          { startPercent: 20, endPercent: 30, startValue: 0.88, endValue: 0.53 },
          { startPercent: 30, endPercent: 60, startValue: 0.53, endValue: 0.53 },
          { startPercent: 60, endPercent: 70, startValue: 0.53, endValue: 0.10 },
          { startPercent: 70, endPercent: 80, startValue: 0.10, endValue: 0.57 },
          { startPercent: 80, endPercent: 90, startValue: 0.57, endValue: 0.57 },
          { startPercent: 90, endPercent: 100, startValue: 0.57, endValue: 0.43 }
        ]
      },
      // Attraction Strength keyframes
      {
        parameter: 'attractionStrength',
        keyframes: [
          { startPercent: 0, endPercent: 10, startValue: 1.0, endValue: 1.0 },
          { startPercent: 10, endPercent: 15, startValue: 1.0, endValue: 0.8 },
          { startPercent: 15, endPercent: 20, startValue: 0.8, endValue: 1.0 },
          { startPercent: 25, endPercent: 30, startValue: 1.0, endValue: 0.0 },
          { startPercent: 30, endPercent: 90, startValue: 0.0, endValue: 0.0 },
          { startPercent: 90, endPercent: 95, startValue: 0.0, endValue: 1.0 },
          { startPercent: 95, endPercent: 100, startValue: 1.0, endValue: 1.0 }
        ]
      },
      // Hide Cube keyframes
      {
        parameter: 'hideCube',
        keyframes: [
          { startPercent: 0, endPercent: 30, startValue: 0, endValue: 0 },
          { startPercent: 30, endPercent: 89, startValue: 0, endValue: 1 },
          { startPercent: 89, endPercent: 90, startValue: 1, endValue: 0 },
          { startPercent: 90, endPercent: 100, startValue: 0, endValue: 0 }
        ]
      },
      // Sensor Size keyframes
      {
        parameter: 'sensorSize',
        keyframes: [
          { startPercent: 0, endPercent: 70, startValue: 1, endValue: 1 },
          { startPercent: 70, endPercent: 80, startValue: 1, endValue: 5 },
          { startPercent: 80, endPercent: 90, startValue: 5, endValue: 1 },
          { startPercent: 90, endPercent: 100, startValue: 1, endValue: 1 }
        ]
      },
    ];

    // Helper function to interpolate between two values
    const interpolate = (startValue: number, endValue: number, progress: number): number => {
      return startValue + (endValue - startValue) * progress;
    };

    // Helper function to get parameter value from keyframes
    const getParameterValue = (keyframes: Keyframe[], scrollProgress: number): number => {
      const progressPercent = scrollProgress * 100;
      
      for (const keyframe of keyframes) {
        if (progressPercent >= keyframe.startPercent && progressPercent <= keyframe.endPercent) {
          const keyframeProgress = (progressPercent - keyframe.startPercent) / (keyframe.endPercent - keyframe.startPercent);
          return interpolate(keyframe.startValue, keyframe.endValue, keyframeProgress);
        }
      }
      
      // Return the last keyframe's end value if we're beyond all keyframes
      return keyframes[keyframes.length - 1]?.endValue || 0;
    };

    // Calculate all parameter values
    const result: ScrollParameters = {};
    let hasChanges = false;

    parameterKeyframes.forEach(({ parameter, keyframes }) => {
      const value = getParameterValue(keyframes, scrollProgress);
      result[parameter] = value;
      
      // Check if this parameter has changed from its default value
      
      if (Math.abs(value - defaultValues[parameter]) > 0.00001) {
        hasChanges = true;
      }
    });

    return hasChanges ? result : null;
  };

  // Effect to create and manage the attractor data from page content
  useEffect(() => {
    if (viewportSize.width === 0) return;

    const updateAttractorData = () => {
      try {
        const result = generateAttractorData({ 
          viewportSize, 
          debugMode, 
          parallaxStrength, 
          scrollY: window.scrollY,
          hideCube
        });
        
        setAttractorData(result.attractorData);
        
        // Convert bounding boxes to Float32Array (x1, y1, x2, y2 for each box)
        // Use fixed size of 10 boxes maximum, fill unused slots with dummy data
        const MAX_BOXES = 10;
        const boxesArray = new Float32Array(MAX_BOXES * 4);
        
        // Fill with dummy data first (all -999.0 to indicate unused slots)
        for (let i = 0; i < MAX_BOXES * 4; i++) {
          boxesArray[i] = -999.0;
        }
        
        // Fill with real bounding boxes
        result.boundingBoxes.forEach((box, i) => {
          if (i < MAX_BOXES) {
            boxesArray[i * 4] = box.x1;
            boxesArray[i * 4 + 1] = box.y1;
            boxesArray[i * 4 + 2] = box.x2;
            boxesArray[i * 4 + 3] = box.y2;
          }
        });
        
        setTextCenters(boxesArray);
        
        // Update debug info
        setDebugInfo({
          boundingBoxes: result.boundingBoxes.map(box => [box.x1, box.y1, box.x2, box.y2]),
          attractorDataSize: result.attractorData.length,
          lastUpdate: Date.now(),
          scrollY: window.scrollY
        });
        
        if (debugMode) {
          console.log('[Page] Updated attractor data:', {
            dataSize: result.attractorData.length,
            boundingBoxesCount: result.boundingBoxes.length,
            scrollY: window.scrollY,
            timestamp: Date.now(),
            hideCube
          });
        }
        
        // Mark initial data as ready
        if (!initialDataReady) {
          setInitialDataReady(true);
        }
      } catch (error) {
        console.error('[Page] Error generating attractor data:', error);
      }
    };
    
    // Create initial data immediately
    // Add a small delay to ensure DOM is fully rendered
    setTimeout(() => {
      updateAttractorData();
    }, 200);
    
    let animationFrameId: number;
    let cubeAnimationId: number;
    
    // Continuous animation loop for the cube
    const animateCube = () => {
      if (cubeAnimation) {
        updateAttractorData();
        cubeAnimationId = requestAnimationFrame(animateCube);
      }
    };
    
    // Start cube animation
    if (cubeAnimation) {
      cubeAnimationId = requestAnimationFrame(animateCube);
    }
    
    const onScroll = () => {
      if (debugMode) {
        console.log('Scroll event fired, scrollY:', window.scrollY);
      }
      
      // Calculate scroll-based parameters
      const scrollParams = calculateScrollBasedParameters(window.scrollY, totalPageHeight);
      if (scrollParams) {
        if (scrollParams.sensorDistance !== undefined) {
          setSensorDistance(scrollParams.sensorDistance);
        }
        if (scrollParams.attractionStrength !== undefined) {
          setAttractionStrength(scrollParams.attractionStrength);
        }
        if (scrollParams.parallaxStrength !== undefined) {
          setParallaxStrength(scrollParams.parallaxStrength);
        }
        if (scrollParams.moveSpeed !== undefined) {
          setMoveSpeed(scrollParams.moveSpeed);
        }
        if (scrollParams.turnSpeed !== undefined) {
          setTurnSpeed(scrollParams.turnSpeed);
        }
        if (scrollParams.sensorSize !== undefined) {
          setSensorSize(scrollParams.sensorSize);
        }
        if (scrollParams.sensorAngle !== undefined) {
          setSensorAngle(scrollParams.sensorAngle);
        }
        if (scrollParams.decayRate !== undefined) {
          setDecayRate(scrollParams.decayRate);
        }
        if (scrollParams.diffusionRate !== undefined) {
          setDiffusionRate(scrollParams.diffusionRate);
        }
        if (scrollParams.hideCube !== undefined) {
          setHideCube(scrollParams.hideCube);
        }
        
        if (debugMode) {
          console.log('[Page] Applied scroll-based parameters:', {
            scrollY: window.scrollY,
            totalHeight: totalPageHeight,
            scrollProgress: window.scrollY / totalPageHeight,
            sensorDistance: scrollParams.sensorDistance,
            attractionStrength: scrollParams.attractionStrength,
            parallaxStrength: scrollParams.parallaxStrength,
            moveSpeed: scrollParams.moveSpeed,
            turnSpeed: scrollParams.turnSpeed,
            sensorSize: scrollParams.sensorSize,
            sensorAngle: scrollParams.sensorAngle,
            decayRate: scrollParams.decayRate,
            diffusionRate: scrollParams.diffusionRate,
            hideCube: scrollParams.hideCube
          });
        }
      }
      
      // Remove immediate call to prevent race conditions
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(updateAttractorData);
    };
    
    const onResize = () => {
      if (debugMode) {
        console.log('Resize event fired, new size:', { width: window.innerWidth, height: window.innerHeight });
      }
      requestAnimationFrame(updateAttractorData);
    };
    
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animationFrameId);
      cancelAnimationFrame(cubeAnimationId);
    };
  }, [viewportSize, debugMode, initialDataReady, cubeAnimation, parallaxStrength, totalPageHeight, hideCube]);

  // Effect to restart simulation when numSlimes changes
  useEffect(() => {
    if (initialDataReady) {
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
      {debugMode && (
        <DebugControls
          debugMode={debugMode}
          setDebugMode={setDebugMode}
          showBoundingBoxes={showBoundingBoxes}
          setShowBoundingBoxes={setShowBoundingBoxes}
          cubeAnimation={cubeAnimation}
          setCubeAnimation={setCubeAnimation}
          debugInfo={debugInfo}
          attractorData={attractorData}
          textCenters={textCenters}
          viewportSize={viewportSize}
          totalPageHeight={totalPageHeight}
          numSlimes={numSlimes}
          setNumSlimes={setNumSlimes}
          decayRate={decayRate}
          setDecayRate={setDecayRate}
          diffusionRate={diffusionRate}
          setDiffusionRate={setDiffusionRate}
          moveSpeed={moveSpeed}
          setMoveSpeed={setMoveSpeed}
          turnSpeed={turnSpeed}
          setTurnSpeed={setTurnSpeed}
          sensorDistance={sensorDistance}
          setSensorDistance={setSensorDistance}
          sensorSize={sensorSize}
          setSensorSize={setSensorSize}
          sensorAngle={sensorAngle}
          setSensorAngle={setSensorAngle}
          attractionStrength={attractionStrength}
          setAttractionStrength={setAttractionStrength}
          parallaxStrength={parallaxStrength}
          setParallaxStrength={setParallaxStrength}
          hideCube={hideCube}
          setHideCube={setHideCube}
        />
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
                    for (let y = 0; y < 128; y += 1) {
                      for (let x = 0; x < 128; x += 1) {
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

      <TextContent webGPUAvailable={webGPUAvailable} />
    </>
  )
}
