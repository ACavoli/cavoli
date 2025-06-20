"use client"

import { useState, useEffect, useRef } from 'react'
import SlimeSimulation from '@/components/SlimeSimulation'
import Globe from "@/components/Globe"

export default function Home() {
  const [numSlimes, setNumSlimes] = useState(100000)
  const [decayRate, setDecayRate] = useState(0.985)
  const [diffusionRate, setDiffusionRate] = useState(0.2)
  const [moveSpeed, setMoveSpeed] = useState(0.003)
  const [turnSpeed, setTurnSpeed] = useState(0.2)
  const [sensorDistance, setSensorDistance] = useState(0.005)
  const [sensorSize, setSensorSize] = useState(1)
  const [sensorAngle, setSensorAngle] = useState(0.3)
  const [attractionStrength, setAttractionStrength] = useState(1)
  const [attractorData, setAttractorData] = useState<Float32Array | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [webGPUAvailable, setWebGPUAvailable] = useState(true);

  // Effect to check for debug mode
  useEffect(() => {
    setIsDebugMode(window.location.search.includes('debug=true'));
  }, []);

  // Effect to check WebGPU availability
  useEffect(() => {
    const checkWebGPU = async () => {
      try {
        const adapter = await navigator.gpu?.requestAdapter();
        const device = await adapter?.requestDevice();
        setWebGPUAvailable(!!device);
      } catch (error) {
        setWebGPUAvailable(false);
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

    const updateAttractorData = () => {
        // Clear with black for the non-attracting background
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, viewportSize.width, viewportSize.height);
        
        // Draw the actual text shapes in white to define attracting areas
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        textElements.forEach(el => {
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
    };
    
    let animationFrameId: number;
    const onScroll = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(updateAttractorData);
    };
    
    const onResize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        requestAnimationFrame(updateAttractorData);
    };
    
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    updateAttractorData(); // Initial draw

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [viewportSize, isDebugMode]);

  return (
    <>
      <style>{`
        .attractive-text {
          color: ${webGPUAvailable === false ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0)'};
        }
      `}</style>
      
      {viewportSize.width > 0 && webGPUAvailable && (
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
        />
      )}
      
      <div className="relative z-10 text-white">
        <div className="container mx-auto p-4">
          
          {/* Hero Section with Globe */}
          <div className="h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="attractive-text text-6xl md:text-9xl font-bold mb-8">ALESSANDRO CAVOLI</h1>
              <p className="attractive-text text-4xl max-w-2xl mx-auto">
                Full-stack developer passionate about creating interactive experiences and pushing the boundaries of web technology.
              </p>
            </div>
          </div>

          {/* About Section */}
          <div className="h-screen flex items-center justify-center">
            <div className="max-w-4xl">
              <h2 className="attractive-text text-6xl font-bold mb-8 text-center">About Me</h2>
              <p className="attractive-text text-xl leading-relaxed">
                I specialize in building modern web applications using cutting-edge technologies like WebGPU, 
                React, and Next.js. My work focuses on creating immersive, interactive experiences that 
                bridge the gap between art and technology.
              </p>
            </div>
          </div>

          {/* Skills Section */}
          <div className="h-screen flex items-center justify-center">
            <div className="max-w-4xl">
              <h2 className="attractive-text text-6xl font-bold mb-8 text-center">Skills & Technologies</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <h3 className="attractive-text text-2xl font-semibold mb-4">Frontend</h3>
                  <p className="attractive-text">React, Next.js, TypeScript, WebGPU, Three.js</p>
                </div>
                <div className="text-center">
                  <h3 className="attractive-text text-2xl font-semibold mb-4">Backend</h3>
                  <p className="attractive-text">Node.js, Python, PostgreSQL, Redis</p>
                </div>
                <div className="text-center">
                  <h3 className="attractive-text text-2xl font-semibold mb-4">Tools</h3>
                  <p className="attractive-text">Docker, AWS, Git, CI/CD</p>
                </div>
              </div>
            </div>
          </div>

          {/* Projects Section */}
          <div className="h-screen flex items-center justify-center">
            <div className="max-w-4xl">
              <h2 className="attractive-text text-6xl font-bold mb-8 text-center">Featured Projects</h2>
              <div className="space-y-8">
                <div>
                  <h3 className="attractive-text text-3xl font-semibold mb-2">Interactive Globe</h3>
                  <p className="attractive-text text-lg">A 3D interactive globe built with D3.js and WebGL, featuring real-time data visualization.</p>
                </div>
                <div>
                  <h3 className="attractive-text text-3xl font-semibold mb-2">Slime Mold Simulation</h3>
                  <p className="attractive-text text-lg">A WebGPU-powered simulation demonstrating emergent behavior and GPU computing.</p>
                </div>
                <div>
                  <h3 className="attractive-text text-3xl font-semibold mb-2">Content Management System</h3>
                  <p className="attractive-text text-lg">A full-stack application for managing and approving digital content with real-time collaboration.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="h-screen flex items-center justify-center">
            <div className="text-center">
              <h2 className="attractive-text text-6xl font-bold mb-8">Get In Touch</h2>
              <p className="attractive-text text-2xl mb-8">
                Let's create something amazing together.
              </p>
              <div className="space-x-8">
                <a href="mailto:hello@alessandrocavoli.com" className="attractive-text text-xl hover:text-blue-400 transition-colors">
                  hello@alessandrocavoli.com
                </a>
                <a href="https://github.com/alessandrocavoli" className="attractive-text text-xl hover:text-blue-400 transition-colors">
                  GitHub
                </a>
                <a href="https://linkedin.com/in/alessandrocavoli" className="attractive-text text-xl hover:text-blue-400 transition-colors">
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
