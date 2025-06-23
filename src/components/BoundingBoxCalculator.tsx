"use client"

interface BoundingBoxCalculatorProps {
  ctx: CanvasRenderingContext2D;
  viewportSize: { width: number; height: number };
  debugMode: boolean;
}

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function calculateTextBoundingBoxes({ ctx, viewportSize, debugMode }: BoundingBoxCalculatorProps): BoundingBox[] {
  const boundingBoxes: BoundingBox[] = [];
  
  const textElements = Array.from(document.querySelectorAll('.attractive-text'));
  const validElements = textElements.filter(el => {
    const rect = el.getBoundingClientRect();
    const styles = window.getComputedStyle(el);
    const opacity = parseFloat(styles.opacity);
    
    return rect.width > 0 && 
           rect.height > 0 && 
           rect.top < viewportSize.height && 
           rect.bottom > 0 &&
           opacity > 0.01; // Only process if opacity is greater than 1%
  });
  
  if (debugMode) {
    console.log('[BoundingBoxCalculator] Processing', validElements.length, 'valid text elements');
  }
  
  validElements.forEach(el => {
    const rect = el.getBoundingClientRect();
    const styles = window.getComputedStyle(el);
    const opacity = parseFloat(styles.opacity);
    
    if (rect.top < viewportSize.height && rect.bottom > 0 && opacity > 0.01) {
      // Get the computed styles to match the text rendering
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
              boundingBoxes.push({
                x1: clampedX1,
                y1: clampedY1,
                x2: clampedX2,
                y2: clampedY2
              });
              
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
        });
      });
    }
  });
  
  return boundingBoxes;
} 