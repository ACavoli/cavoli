# Slime Mold Simulation

A WebGPU-powered slime mold simulation inspired by cellular automata and emergent behavior patterns.

## Overview

This implementation creates a realistic simulation of slime mold behavior using WebGPU compute shaders. The simulation demonstrates how simple rules can lead to complex, emergent patterns similar to those observed in nature.

## Features

- **WebGPU Acceleration**: Uses modern GPU compute shaders for high-performance simulation
- **Real-time Rendering**: Smooth 60fps animation with thousands of agents
- **Interactive Controls**: Adjustable parameters for experimentation
- **Diffusion System**: Realistic trail diffusion and decay
- **Emergent Behavior**: Complex patterns emerge from simple agent rules

## How It Works

### Agent Behavior

Each slime agent follows these simple rules:

1. **Sensing**: Each agent has three sensors (front, left, right) that detect trail concentration
2. **Turning**: Agents turn towards areas with higher trail concentration
3. **Movement**: Agents move forward at a constant speed
4. **Trail Laying**: Agents leave trails as they move

### Technical Implementation

#### Compute Shaders

The simulation uses two main compute shaders:

1. **Diffusion Shader**: Applies diffusion to trails, spreading them to neighboring pixels
2. **Agent Shader**: Updates agent positions and behaviors, and applies trail decay

#### Rendering Pipeline

- **Vertex Shader**: Renders a full-screen quad
- **Fragment Shader**: Samples the trail texture and renders agents as green dots

#### Double Buffering

The simulation uses double buffering for both textures and bind groups to prevent race conditions and ensure smooth rendering.

## Parameters

- **Number of Slimes**: Controls the density of agents (100-5000)
- **Decay Rate**: How quickly trails fade (0.95-0.999)
- **Diffusion Rate**: How quickly trails spread (0.1-1.0)
- **Trail Weight**: Intensity of trail deposition (0.1-1.0)

## Performance

- **GPU-accelerated**: All computation happens on the GPU
- **Efficient**: Uses compute shaders for parallel processing
- **Scalable**: Can handle thousands of agents at 60fps

## Browser Compatibility

Requires a browser with WebGPU support:
- Chrome Canary with WebGPU flag enabled
- Firefox Nightly with WebGPU flag enabled
- Safari Technology Preview (experimental)

## Usage

1. Navigate to `/slime` for the full interactive simulation
2. Adjust parameters using the sliders
3. Watch as emergent patterns form from simple agent behavior

## Implementation Details

### WebGPU Setup

```typescript
const device = await adapter.requestDevice()
const context = canvas.getContext('webgpu') as GPUCanvasContext
context.configure({
  device,
  format: navigator.gpu.getPreferredCanvasFormat(),
  alphaMode: 'premultiplied',
})
```

### Shader Structure

The compute shaders use workgroup-based processing:
- Each workgroup processes 8x8 pixels
- Agents are distributed across workgroups
- Double buffering prevents race conditions

### Memory Management

- Uses storage buffers for agent data
- Storage textures for trail maps
- Proper cleanup and resource management

## Future Enhancements

- **Obstacles**: Add static obstacles for agents to navigate around
- **Multiple Species**: Different agent types with varying behaviors
- **Food Sources**: Attract agents to specific locations
- **3D Rendering**: Extend to 3D space
- **Particle Effects**: Add visual effects for trail deposition

## References

This implementation is inspired by:
- [Slime Mold Simulation by SuboptimalEng](https://github.com/SuboptimalEng/slime-sim-webgpu)
- Cellular automata principles
- Emergent behavior research
- WebGPU specification and examples 