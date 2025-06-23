"use client"

interface CubeRendererProps {
  ctx: CanvasRenderingContext2D;
  viewportSize: { width: number; height: number };
  parallaxStrength: number;
  scrollY: number;
}

export interface CubeBoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function draw3DCube({ ctx, viewportSize, parallaxStrength, scrollY }: CubeRendererProps): [number, number, number, number] {
  const centerX = viewportSize.width * 0.5;
  const centerY = viewportSize.height * 0.5;
  
  // Apply parallax effect to Y position - start below screen and move up as you scroll 
  const parallaxOffset = - scrollY * parallaxStrength;
  const adjustedCenterY = centerY + parallaxOffset;
  
  const size = Math.min(viewportSize.width, viewportSize.height) * 0.4;
  
  // Cube vertices in 3D space
  const vertices = [
    [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],  // back face
    [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]       // front face
  ];
  
  // Cube faces (each face is defined by 4 vertices)
  const faces = [
    [0, 1, 2, 3], // back face (dark grey)
    [4, 5, 6, 7], // front face (white)
    [0, 4, 7, 3], // left face (light grey)
    [1, 5, 6, 2], // right face (light grey)
    [3, 7, 6, 2], // top face (white)
    [0, 4, 5, 1]  // bottom face (dark grey)
  ];
  
  const faceColors = [
    0.3, // dark grey (back)
    1.0, // white (front)
    0.7, // light grey (left)
    0.7, // light grey (right)
    1.0, // white (top)
    0.3  // dark grey (bottom)
  ];
  
  // Simple 3D rotation (rotate around Y and X axes)
  const time = Date.now() * 0.001;
  const cosY = Math.cos(time * 0.1);
  const sinY = Math.sin(time * 0.1);
  const cosX = Math.cos(time * 0.1);
  const sinX = Math.sin(time * 0.1);
  
  // Transform vertices
  const transformedVertices = vertices.map(([x, y, z]) => {
    // Rotate around Y axis
    const x1 = x * cosY - z * sinY;
    const z1 = x * sinY + z * cosY;
    
    // Rotate around X axis
    const y2 = y * cosX - z1 * sinX;
    const z2 = y * sinX + z1 * cosX;
    
    // Project to 2D
    const scale = 1 / (z2 + 3); // Simple perspective
    const screenX = centerX + x1 * size * scale;
    const screenY = adjustedCenterY + y2 * size * scale;
    
    return { x: screenX, y: screenY, z: z2 };
  });
  
  // Calculate bounding box of the cube
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  transformedVertices.forEach(vertex => {
    minX = Math.min(minX, vertex.x);
    minY = Math.min(minY, vertex.y);
    maxX = Math.max(maxX, vertex.x);
    maxY = Math.max(maxY, vertex.y);
  });
  
  // Add some padding to the bounding box
  const padding = 20;
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;
  
  // Sort faces by depth (painter's algorithm)
  const faceDepths = faces.map((face, index) => {
    const avgZ = face.reduce((sum, vertexIndex) => sum + transformedVertices[vertexIndex].z, 0) / 4;
    return { index, depth: avgZ };
  });
  
  faceDepths.sort((a, b) => b.depth - a.depth);
  
  // Draw faces from back to front
  faceDepths.forEach(({ index }) => {
    const face = faces[index];
    const color = faceColors[index];
    
    ctx.fillStyle = `rgb(${Math.floor(color * 250)}, ${Math.floor(color * 250)}, ${Math.floor(color * 250)})`;
    
    ctx.beginPath();
    const firstVertex = transformedVertices[face[0]];
    ctx.moveTo(firstVertex.x, firstVertex.y);
    
    for (let i = 1; i < face.length; i++) {
      const vertex = transformedVertices[face[i]];
      ctx.lineTo(vertex.x, vertex.y);
    }
    
    ctx.closePath();
    ctx.fill();
  });
  
  // Return the bounding box in world coordinates
  return [
    (minX / viewportSize.width) * 2 - 1,
    (minY / viewportSize.height) * 2 - 1,
    (maxX / viewportSize.width) * 2 - 1,
    (maxY / viewportSize.height) * 2 - 1
  ];
} 