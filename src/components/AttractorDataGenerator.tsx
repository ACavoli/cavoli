"use client"

import { draw3DCube } from './CubeRenderer';
import { calculateTextBoundingBoxes, BoundingBox } from './BoundingBoxCalculator';

interface AttractorDataGeneratorProps {
  viewportSize: { width: number; height: number };
  debugMode: boolean;
  parallaxStrength: number;
  scrollY: number;
  hideCube: number;
}

export interface AttractorDataResult {
  attractorData: Float32Array;
  boundingBoxes: BoundingBox[];
  cubeBoundingBox: [number, number, number, number] | null;
}

export function generateAttractorData({ viewportSize, debugMode, parallaxStrength, scrollY, hideCube }: AttractorDataGeneratorProps): AttractorDataResult {
  const canvas = document.createElement('canvas');
  canvas.width = viewportSize.width;
  canvas.height = viewportSize.height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get 2D context');
  }

  // Clear with black for the non-attracting background
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, viewportSize.width, viewportSize.height);
  
  // Draw 3D cube and get its bounding box (only if not hidden)
  let cubeBoundingBox: [number, number, number, number] | null = null;
  if (hideCube === 0) {
    cubeBoundingBox = draw3DCube({ ctx, viewportSize, parallaxStrength, scrollY });
    
    if (debugMode) {
      console.log('[AttractorDataGenerator] Cube bounding box:', {
        world: { x1: cubeBoundingBox[0], y1: cubeBoundingBox[1], x2: cubeBoundingBox[2], y2: cubeBoundingBox[3] },
        timestamp: Date.now()
      });
    }
  } else if (debugMode) {
    console.log('[AttractorDataGenerator] Cube is hidden');
  }
  
  // Calculate text bounding boxes
  const textBoundingBoxes = calculateTextBoundingBoxes({ ctx, viewportSize, debugMode });
  
  // Combine all bounding boxes (only include cube if not hidden)
  const allBoundingBoxes = [
    ...(cubeBoundingBox ? [{ x1: cubeBoundingBox[0], y1: cubeBoundingBox[1], x2: cubeBoundingBox[2], y2: cubeBoundingBox[3] }] : []),
    ...textBoundingBoxes
  ];
  
  // Now draw the text to create attractor data
  ctx.fillStyle = 'white';
  const textElements = Array.from(document.querySelectorAll('.attractive-text'));
  const validElements = textElements.filter(el => {
    const rect = el.getBoundingClientRect();
    const styles = window.getComputedStyle(el);
    const opacity = parseFloat(styles.opacity);
    
    // Skip elements that are not visible due to opacity or positioning
    return rect.width > 0 && 
           rect.height > 0 && 
           rect.top < viewportSize.height && 
           rect.bottom > 0 &&
           opacity > 0.01; // Only render if opacity is greater than 1%
  });
  
  validElements.forEach(el => {
    const rect = el.getBoundingClientRect();
    const styles = window.getComputedStyle(el);
    const opacity = parseFloat(styles.opacity);
    
    if (rect.top < viewportSize.height && rect.bottom > 0 && opacity > 0.01) {
      // Get the computed styles to match the text rendering
      ctx.font = `${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`; // Use actual opacity
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
  
  if (debugMode) {
    console.log('[AttractorDataGenerator] Generated attractor data:', {
      dataSize: data.length,
      boundingBoxesCount: allBoundingBoxes.length,
      timestamp: Date.now()
    });
  }
  
  return {
    attractorData: data,
    boundingBoxes: allBoundingBoxes,
    cubeBoundingBox
  };
} 