"use client"

interface DebugControlsProps {
  debugMode: boolean;
  setDebugMode: (value: boolean) => void;
  showBoundingBoxes: boolean;
  setShowBoundingBoxes: (value: boolean) => void;
  cubeAnimation: boolean;
  setCubeAnimation: (value: boolean) => void;
  hideCube: number;
  setHideCube: (value: number) => void;
  debugInfo: {
    boundingBoxes: [number, number, number, number][];
    attractorDataSize: number;
    lastUpdate: number;
    scrollY: number;
  };
  attractorData: Float32Array | null;
  textCenters: Float32Array | null;
  viewportSize: { width: number; height: number };
  totalPageHeight: number;
  // Simulation parameters
  numSlimes: number;
  setNumSlimes: (value: number) => void;
  decayRate: number;
  setDecayRate: (value: number) => void;
  diffusionRate: number;
  setDiffusionRate: (value: number) => void;
  moveSpeed: number;
  setMoveSpeed: (value: number) => void;
  turnSpeed: number;
  setTurnSpeed: (value: number) => void;
  sensorDistance: number;
  setSensorDistance: (value: number) => void;
  sensorSize: number;
  setSensorSize: (value: number) => void;
  sensorAngle: number;
  setSensorAngle: (value: number) => void;
  attractionStrength: number;
  setAttractionStrength: (value: number) => void;
  parallaxStrength: number;
  setParallaxStrength: (value: number) => void;
}

export default function DebugControls({
  debugMode,
  setDebugMode,
  showBoundingBoxes,
  setShowBoundingBoxes,
  cubeAnimation,
  setCubeAnimation,
  hideCube,
  setHideCube,
  debugInfo,
  attractorData,
  textCenters,
  viewportSize,
  totalPageHeight,
  numSlimes,
  setNumSlimes,
  decayRate,
  setDecayRate,
  diffusionRate,
  setDiffusionRate,
  moveSpeed,
  setMoveSpeed,
  turnSpeed,
  setTurnSpeed,
  sensorDistance,
  setSensorDistance,
  sensorSize,
  setSensorSize,
  sensorAngle,
  setSensorAngle,
  attractionStrength,
  setAttractionStrength,
  parallaxStrength,
  setParallaxStrength,
}: DebugControlsProps) {
  return (
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
            // Note: This would need to be handled by the parent component
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
        <button
          onClick={() => setCubeAnimation(!cubeAnimation)}
          className={`px-3 py-1 rounded text-sm ${cubeAnimation ? 'bg-green-600' : 'bg-gray-600'}`}
        >
          {cubeAnimation ? 'Stop' : 'Start'} Cube
        </button>
        <button
          onClick={() => setHideCube(hideCube === 1 ? 0 : 1)}
          className={`px-3 py-1 rounded text-sm ${hideCube === 1 ? 'bg-red-600' : 'bg-gray-600'}`}
        >
          {hideCube === 1 ? 'Show' : 'Hide'} Cube
        </button>
      </div>
      
      {/* Parameter Sliders */}
      <div className="space-y-3 mb-4">
        <h3 className="text-sm font-bold">Simulation Parameters</h3>
        
        <div>
          <label className="text-xs block mb-1">Hide Cube: {hideCube === 1 ? 'Yes' : 'No'}</label>
          <input
            type="range"
            min="0"
            max="1"
            step="1"
            value={hideCube}
            onChange={(e) => setHideCube(parseInt(e.target.value))}
            className="w-full"
          />
        </div>
        
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
        
        <div>
          <label className="text-xs block mb-1">Parallax Strength: {parallaxStrength.toFixed(2)}</label>
          <input
            type="range"
            min="0.1"
            max="2.0"
            step="0.01"
            value={parallaxStrength}
            onChange={(e) => setParallaxStrength(parseFloat(e.target.value))}
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
      
      <div className="mb-4 p-3 bg-gray-800 rounded">
        <h3 className="text-sm font-bold mb-2">Scroll Progress</h3>
        <div className="text-xs space-y-1">
          <div>Scroll Y: {debugInfo.scrollY}px</div>
          <div>Total Height: {totalPageHeight}px</div>
          <div>Progress: {totalPageHeight > 0 ? ((debugInfo.scrollY / totalPageHeight) * 100).toFixed(1) : '0'}%</div>
          <div className="mt-2">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-100" 
                style={{ width: `${totalPageHeight > 0 ? (debugInfo.scrollY / totalPageHeight) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {(() => {
              const progress = totalPageHeight > 0 ? debugInfo.scrollY / totalPageHeight : 0;
              if (progress <= 0.3) return "Phase: Normal (0-30%)";
              if (progress <= 0.4) return "Phase: Transitioning (30-40%)";
              if (progress <= 0.6) return "Phase: Modified (40-60%)";
              if (progress <= 0.7) return "Phase: Returning (60-70%)";
              return "Phase: Normal (70-100%)";
            })()}
          </div>
        </div>
      </div>
      
      <div className="mb-4 p-3 bg-gray-800 rounded">
        <h3 className="text-sm font-bold mb-2">Simulation Parameters</h3>
      </div>
    </div>
  );
} 