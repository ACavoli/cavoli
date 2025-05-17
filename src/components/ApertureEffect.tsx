'use client';

import { useEffect, useState, useRef } from 'react';
import { animate } from 'animejs';

interface ApertureEffectProps {
  bladeCount: number;
  bladeWidth?: number;
  duration?: number; // in ms
}

export default function ApertureEffect({
  bladeCount,
  bladeWidth = 1300,
  duration = 1000,
}: ApertureEffectProps) {
  const [visible, setVisible] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);

  const sideLength = 2*bladeWidth*Math.sin(Math.PI/bladeCount)
  const angle = (bladeCount-2)*Math.PI/bladeCount/2
  const initialClosedAngle = angle + 0.001

  const calculatePath = (closedAngle: number) => {
    const closedLength = sideLength*Math.cos(closedAngle) + sideLength*Math.sin(closedAngle)*Math.tan(2*angle - Math.PI/2)
    const closedWidth = closedLength * Math.sin(Math.PI/2 - closedAngle-angle)
    const closedX = Math.round(bladeWidth - sideLength*Math.cos(angle) + closedWidth)
    const closedHeight = closedLength * Math.cos(Math.PI/2 - closedAngle-angle)
    const closedY = Math.round(sideLength*Math.sin(angle) - closedHeight)

    return `M ${closedX} ${closedY} L ${bladeWidth - sideLength*Math.cos(angle)} ${sideLength*Math.sin(angle)} L ${bladeWidth} 0 Z`
  }

  const numFrames = 15
  // Create keyframes by calculating paths at different angles
  const keyframes = Array.from({ length: numFrames }, (_, i) => {
    const progress = i / (numFrames-1); // 0 to 1
    const currentAngle = initialClosedAngle * (1 - progress);
    return calculatePath(currentAngle);
  });

  const poly1 = keyframes[0];
  const poly2 = keyframes[keyframes.length - 1];

  useEffect(() => {
    if (!svgRef.current) return;

    const timeout = setTimeout(() => setVisible(false), duration);

    const blades = svgRef.current.querySelectorAll('.blade');
    if (blades.length === 0) return;

    // Create temporary paths for each keyframe
    const tempPaths = keyframes.map(path => {
      const tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      tempPath.setAttribute('d', path);
      tempPath.setAttribute('fill', 'none');
      svgRef.current?.appendChild(tempPath);
      return tempPath;
    });

    const animation = animate(blades, {
      d: keyframes,
      duration: duration,
      delay: 500,
      ease: 'linear',
      playbackEase: 'cubicBezier(.31,.46,.26,-0.63)'
    });

    return () => {
      clearTimeout(timeout);
      animation.pause();
      // Clean up temporary paths
      tempPaths.forEach(path => path.remove());
    };
  }, [duration]);

  if (!visible) return null;

  const viewBoxSize = 800;
  const center = viewBoxSize / 2;

  const blades = Array.from({ length: bladeCount }, (_, i) => {
    const bladeAngle = (Math.PI * 2 * i) / bladeCount;

    return (
      <g
        key={i}
        transform={`translate(${center}, ${center}) rotate(${bladeAngle * (180 / Math.PI)})`}
      >
        <path
          d={poly1}
          className="blade"
          fill="gray"
          stroke="black"
        />
      </g>
    );
  });

  return (
    <svg
      ref={svgRef}
      className="fixed inset-0 z-50 pointer-events-none overflow-hidden"
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
    >
      {blades}
    </svg>
  );
}