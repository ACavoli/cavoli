"use client"

import { useEffect, useRef, useState } from 'react'

interface SlimeSimulationProps {
  width?: number
  height?: number
  numSlimes?: number
  decayRate?: number
  diffusionRate?: number
  moveSpeed?: number
  turnSpeed?: number
  sensorDistance?: number
  sensorSize?: number
  sensorAngle?: number
  attractionStrength?: number
  attractorData?: Float32Array | null
  textCenters?: Float32Array | null
}

export default function SlimeSimulation({
  width = 1000,
  height = 1000,
  numSlimes = 1000,
  decayRate = 0.99,
  diffusionRate = 0.5,
  moveSpeed = 0.001,
  turnSpeed = 0.1,
  sensorDistance = 0.1,
  sensorSize = 1,
  sensorAngle = 0.2,
  attractionStrength = 0.01,
  attractorData = null,
  textCenters = null,
}: SlimeSimulationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState<string | null>(null)
  const frameCountRef = useRef(0)
  const simulationStateRef = useRef<{
    device: GPUDevice
    uniformBuffer: GPUBuffer
    attractorBuffer: GPUBuffer
    textBoxesBuffer: GPUBuffer
  } | null>(null)

  useEffect(() => {
    if (simulationStateRef.current) {
      const { device, uniformBuffer, attractorBuffer, textBoxesBuffer } = simulationStateRef.current
      const uniforms = new Float32Array([decayRate, diffusionRate, moveSpeed, turnSpeed, sensorDistance, sensorSize, sensorAngle, attractionStrength])
      device.queue.writeBuffer(uniformBuffer, 0, uniforms)

      if (attractorData && attractorBuffer) {
        device.queue.writeBuffer(attractorBuffer, 0, attractorData)
        console.log(`[SlimeSimulation] Updated attractor buffer:`, {
          size: attractorData.length,
          sampleValues: attractorData.slice(0, 10),
          maxValue: Math.max(...Array.from(attractorData.slice(0, 1000))), // Sample first 1000 values to avoid stack overflow
          nonZeroCount: attractorData.filter(v => v > 0).length,
          nonZeroSample: attractorData.filter(v => v > 0).slice(0, 5),
          timestamp: Date.now()
        })
      }

      if (textCenters && textBoxesBuffer) {
        device.queue.writeBuffer(textBoxesBuffer, 0, textCenters)
        console.log(`[SlimeSimulation] Updated text boxes buffer:`, {
          size: textCenters.length,
          numBoxes: textCenters.length / 4,
          boxes: Array.from({ length: Math.min(textCenters.length / 4, 10) }, (_, i) => ({
            x1: textCenters[i * 4],
            y1: textCenters[i * 4 + 1],
            x2: textCenters[i * 4 + 2],
            y2: textCenters[i * 4 + 3],
            isDummy: textCenters[i * 4] === -999.0
          })),
          timestamp: Date.now()
        })
      } else if (textBoxesBuffer) {
        // Write dummy data when no text centers
        const dummyData = new Float32Array(40).fill(-999.0);
        device.queue.writeBuffer(textBoxesBuffer, 0, dummyData)
        console.log(`[SlimeSimulation] No text boxes - wrote dummy data to buffer`, {
          textCentersType: textCenters ? 'array' : 'null',
          textCentersLength: textCenters?.length || 0,
          timestamp: Date.now()
        });
      }
    }
  }, [decayRate, diffusionRate, moveSpeed, turnSpeed, sensorDistance, sensorSize, sensorAngle, attractionStrength, attractorData, textCenters])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    console.log('[SlimeSimulation] Initializing WebGPU with data:', {
      width,
      height,
      numSlimes,
      attractorDataSize: attractorData?.length || 0,
      textCentersSize: textCenters?.length || 0
    })

    let animationFrameId: number;

    // Initialize WebGPU
    const initWebGPU = async () => {
      try {
        if (!navigator.gpu) {
          throw new Error('WebGPU not supported')
        }

        const adapter = await navigator.gpu.requestAdapter()
        if (!adapter) {
          throw new Error('No WebGPU adapter found')
        }

        const device = await adapter.requestDevice()
        
        const context = canvas.getContext('webgpu') as GPUCanvasContext
        if (!context) {
          throw new Error('Could not get WebGPU context')
        }

        // Configure canvas
        canvas.width = width
        canvas.height = height
        const format = navigator.gpu.getPreferredCanvasFormat()
        
        context.configure({
          device,
          format,
          alphaMode: 'premultiplied',
        })

        // Create a buffer for slime positions and directions
        const slimeData = new Float32Array(numSlimes * 3) // x, y, angle for each slime
        for (let i = 0; i < numSlimes; i++) {
          // Generate random positions within safe bounds
          const x = (Math.random() * 1.8) - 0.9 // Random x between -0.9 and 0.9
          const y = (Math.random() * 1.8) - 0.9 // Random y between -0.9 and 0.9
          
          slimeData[i * 3] = x // x position
          slimeData[i * 3 + 1] = y // y position
          slimeData[i * 3 + 2] = Math.random() * Math.PI * 2 // Random angle
        }

        const slimeBuffer = device.createBuffer({
          size: slimeData.byteLength,
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        })
        device.queue.writeBuffer(slimeBuffer, 0, slimeData)
        
        // Ensure buffer is written by submitting a command
        const initEncoder = device.createCommandEncoder()
        device.queue.submit([initEncoder.finish()])

        // Create uniform buffer for dynamic parameters
        const uniforms = new Float32Array([decayRate, diffusionRate, moveSpeed, turnSpeed, sensorDistance, sensorSize, sensorAngle, attractionStrength]);
        const uniformBuffer = device.createBuffer({
            size: uniforms.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(uniformBuffer, 0, uniforms);

        // Create attractor buffer
        const attractorBuffer = device.createBuffer({
          size: attractorData ? attractorData.byteLength : 4,
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        })

        // Create text boxes buffer - fixed size for 10 boxes (40 floats)
        const textBoxesBuffer = device.createBuffer({
          size: 10 * 4 * 4, // 10 boxes * 4 floats per box * 4 bytes per float
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        })

        console.log('[SlimeSimulation] Buffer creation:', {
          textCentersExists: !!textCenters,
          textCentersLength: textCenters?.length || 0,
          bufferSize: textCenters && textCenters.length > 0 ? textCenters.byteLength : 0,
          textCentersSample: textCenters ? Array.from(textCenters.slice(0, 8)) : null
        });

        // Initialize buffers with data if available
        if (attractorData) {
          device.queue.writeBuffer(attractorBuffer, 0, attractorData)
        }
        if (textCenters) {
          device.queue.writeBuffer(textBoxesBuffer, 0, textCenters)
        } else {
          // Write dummy data when no text centers
          const dummyData = new Float32Array(40).fill(-999.0);
          device.queue.writeBuffer(textBoxesBuffer, 0, dummyData)
        }

        // Create a buffer for counter
        const counterData = new Uint32Array(1)
        counterData[0] = 0 // Initialize to 0

        const counterBuffer = device.createBuffer({
          size: counterData.byteLength,
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
          mappedAtCreation: true, // Map the buffer for initial write
        })
        new Uint32Array(counterBuffer.getMappedRange()).set(counterData)
        counterBuffer.unmap()

        // Create textures for the trail map (double buffering)
        const trailTextures = [
          device.createTexture({
            size: { width, height },
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
          }),
          device.createTexture({
            size: { width, height },
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
          })
        ]

        // Create combined decay and diffusion shader
        const decayDiffusionShader = device.createShaderModule({
          code: `
            const WIDTH: u32 = ${width}u;
            const HEIGHT: u32 = ${height}u;

            struct Uniforms {
                decayRate: f32,
                diffusionRate: f32,
            };

            @binding(0) @group(0) var readTrailMap: texture_storage_2d<rgba8unorm, read>;
            @binding(1) @group(0) var writeTrailMap: texture_storage_2d<rgba8unorm, write>;
            @binding(2) @group(0) var<uniform> uniforms: Uniforms;

            @compute @workgroup_size(16, 16)
            fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
              let x = global_id.x;
              let y = global_id.y;
              
              if (x >= WIDTH || y >= HEIGHT) {
                return;
              }

              let current = textureLoad(readTrailMap, vec2<i32>(i32(x), i32(y)));
              
              // Sample neighboring pixels with proper bounds checking
              let left = textureLoad(readTrailMap, vec2<i32>(select(i32(x) - 1, 0, x == 0u), i32(y)));
              let right = textureLoad(readTrailMap, vec2<i32>(select(i32(x) + 1, i32(WIDTH) - 1, x >= WIDTH - 1u), i32(y)));
              let up = textureLoad(readTrailMap, vec2<i32>(i32(x), select(i32(y) - 1, 0, y == 0u)));
              let down = textureLoad(readTrailMap, vec2<i32>(i32(x), select(i32(y) + 1, i32(HEIGHT) - 1, y >= HEIGHT - 1u)));
              
              // Apply decay to all values first
              let decayedCurrent = current * uniforms.decayRate;
              let decayedLeft = left * uniforms.decayRate;
              let decayedRight = right * uniforms.decayRate;
              let decayedUp = up * uniforms.decayRate;
              let decayedDown = down * uniforms.decayRate;
              
              // Apply diffusion to the decayed values
              let diffused = decayedCurrent + uniforms.diffusionRate * (decayedLeft + decayedRight + decayedUp + decayedDown - 4.0 * decayedCurrent) * 0.25;
              
              // Apply a small, constant extinction factor to ensure the background decays to pure black
              let final_value = max(vec4<f32>(0.0), diffused - 0.0005);

              textureStore(writeTrailMap, vec2<u32>(x, y), final_value);
            }
          `,
        })

        // Create slime update shader (only handles slimes, not texture operations)
        const slimeShader = device.createShaderModule({
          code: `
            // Global constants
            const NUM_SLIMES: u32 = ${numSlimes}u;
            const WIDTH: u32 = ${width}u;
            const HEIGHT: u32 = ${height}u;

            struct Uniforms {
                decayRate: f32,
                diffusionRate: f32,
                moveSpeed: f32,
                turnSpeed: f32,
                sensorDistance: f32,
                sensorSize: f32,
                sensorAngle: f32,
                attractionStrength: f32,
            };

            struct Counter {
              value: u32,
            }

            struct Slime {
              x: f32,
              y: f32,
              angle: f32,
            }

            @binding(0) @group(0) var<storage, read_write> counter: Counter;
            @binding(1) @group(0) var<storage, read_write> slimes: array<Slime>;
            @binding(2) @group(0) var trailMap: texture_storage_2d<rgba8unorm, read>;
            @binding(3) @group(0) var writeTrailMap: texture_storage_2d<rgba8unorm, write>;
            @binding(4) @group(0) var<uniform> uniforms: Uniforms;
            @binding(5) @group(0) var<storage, read> attractorData: array<f32>;
            @binding(6) @group(0) var<storage, read> textBoxes: array<f32>;

            fn sampleTrail(pos: vec2<f32>) -> f32 {
              let sensor_size_u = u32(uniforms.sensorSize);

              // Fast path for single-pixel sensor
              if (sensor_size_u <= 1u) {
              let texCoord = vec2<i32>(
                i32((pos.x + 1.0) * 0.5 * f32(WIDTH)),
                i32((pos.y + 1.0) * 0.5 * f32(HEIGHT))
              );
              if (texCoord.x < 0 || texCoord.x >= i32(WIDTH) || texCoord.y < 0 || texCoord.y >= i32(HEIGHT)) {
                return 0.0;
              }
                return textureLoad(trailMap, texCoord).r;
              }

              // Averaging for larger sensors
              var total_sense: f32 = 0.0;
              let half_size: i32 = i32(sensor_size_u / 2u);
              
              let centerTexCoord = vec2<f32>(
                (pos.x + 1.0) * 0.5 * f32(WIDTH),
                (pos.y + 1.0) * 0.5 * f32(HEIGHT)
              );

              for (var dx: i32 = -half_size; dx <= half_size; dx = dx + 1) {
                for (var dy: i32 = -half_size; dy <= half_size; dy = dy + 1) {
                  let sampleCoord = vec2<i32>(
                    i32(round(centerTexCoord.x)) + dx,
                    i32(round(centerTexCoord.y)) + dy
                  );

                  if (sampleCoord.x >= 0 && sampleCoord.x < i32(WIDTH) && sampleCoord.y >= 0 && sampleCoord.y < i32(HEIGHT)) {
                    total_sense = total_sense + textureLoad(trailMap, sampleCoord).r;
                  }
                }
              }
              
              let num_pixels = f32(sensor_size_u * sensor_size_u);
              if (num_pixels == 0.0) { return 0.0; }
              return total_sense / num_pixels;
            }

            fn isPointInBox(point: vec2<f32>, box: vec4<f32>) -> bool {
              return point.x >= box.x && point.x <= box.z && point.y >= box.y && point.y <= box.w;
            }

            fn getBoxCenter(box: vec4<f32>) -> vec2<f32> {
              return vec2<f32>((box.x + box.z) * 0.5, (box.y + box.w) * 0.5);
            }

            @compute @workgroup_size(100)
            fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
              let threadId = global_id.x;
              
              // Each thread handles one slime
              if (threadId >= NUM_SLIMES) {
                return;
              }

              let current_pos = vec2<f32>(slimes[threadId].x, slimes[threadId].y);

                // Calculate sensor positions
              let frontPos = current_pos + vec2<f32>(
                cos(slimes[threadId].angle) * uniforms.sensorDistance,
                sin(slimes[threadId].angle) * uniforms.sensorDistance
              );
              
              let leftPos = current_pos + vec2<f32>(
                cos(slimes[threadId].angle - uniforms.sensorAngle) * uniforms.sensorDistance,
                sin(slimes[threadId].angle - uniforms.sensorAngle) * uniforms.sensorDistance
              );
              
              let rightPos = current_pos + vec2<f32>(
                cos(slimes[threadId].angle + uniforms.sensorAngle) * uniforms.sensorDistance,
                sin(slimes[threadId].angle + uniforms.sensorAngle) * uniforms.sensorDistance
                );

              // Sample trail at sensor positions
              let frontSense = sampleTrail(frontPos);
              let leftSense = sampleTrail(leftPos);
              let rightSense = sampleTrail(rightPos);


              // Use the attractor data to steer slimes (only when there are bounding boxes)
              var attraction: f32 = 0.0; // Default to no attraction
              let num_boxes = arrayLength(&textBoxes) / 4u;
              
              // Count real boxes (not dummy data)
              var real_box_count: u32 = 0u;
              for (var i: u32 = 0u; i < num_boxes; i = i + 1u) {
                if (textBoxes[i * 4u] != -999.0) {
                  real_box_count = real_box_count + 1u;
                }
              }
              
              // Only read attractor data if there are real bounding boxes
              if (real_box_count > 0u) {
                let slime_pos_uv = (current_pos + 1.0) * 0.5;
                let texCoord_x = i32(slime_pos_uv.x * f32(WIDTH));
                let texCoord_y = i32(slime_pos_uv.y * f32(HEIGHT));
                let attractor_index = texCoord_y * i32(WIDTH) + texCoord_x;

                if (attractor_index >= 0 && attractor_index < i32(WIDTH * HEIGHT)) {
                    attraction = attractorData[attractor_index];
                }
              }

              // Check if slime is inside any text bounding box
              var inside_box = false;
              var box_center = vec2<f32>(0.0, 0.0);
              
              // Only process bounding boxes if there are any
              if (num_boxes > 0u) {
                for (var i: u32 = 0u; i < num_boxes; i = i + 1u) {
                  // Skip dummy data
                  if (textBoxes[i * 4u] == -999.0) {
                    continue;
                  }
                  
                  let box = vec4<f32>(
                    textBoxes[i * 4u],     // x1
                    textBoxes[i * 4u + 1u], // y1
                    textBoxes[i * 4u + 2u], // x2
                    textBoxes[i * 4u + 3u]  // y2
                  );
                  
                  if (isPointInBox(current_pos, box)) {
                    inside_box = true;
                    box_center = getBoxCenter(box);
                    break;
                  }
                }

                if (inside_box) {
                  // Slime is inside a text box - check if text is within radius
                  var text_within_radius = false;
                  let check_radius = uniforms.sensorDistance * 3.0; // Check in a larger radius
                  
                  // Sample in a circle around the slime to check for text
                  for (var angle: u32 = 0u; angle < 8u; angle = angle + 1u) {
                    let test_angle = f32(angle) * 0.785398; // 45 degrees in radians
                    let test_pos = current_pos + vec2<f32>(
                      cos(test_angle) * check_radius,
                      sin(test_angle) * check_radius
                    );
                    
                    let test_uv = (test_pos + 1.0) * 0.5;
                    let test_x = i32(test_uv.x * f32(WIDTH));
                    let test_y = i32(test_uv.y * f32(HEIGHT));
                    let test_index = test_y * i32(WIDTH) + test_x;
                    
                    if (test_index >= 0 && test_index < i32(WIDTH * HEIGHT)) {
                      let test_attraction = attractorData[test_index];
                      if (test_attraction > 0.1) {
                        text_within_radius = true;
                        break;
                      }
                    }
                  }
                  
                  if (text_within_radius) {
                    // Text is within radius - use local attraction to follow text contours
                    var best_angle = slimes[threadId].angle;
                    var max_attraction = attraction;
                    
                    for (var i: u32 = 0u; i < 8u; i = i + 1u) {
                      let test_angle = f32(i) * 0.785398; // 45 degrees in radians
                      let test_pos = current_pos + vec2<f32>(
                        cos(test_angle) * uniforms.sensorDistance / 1.0,
                        sin(test_angle) * uniforms.sensorDistance / 1.0
                      );
                      
                      let test_uv = (test_pos + 1.0) * 0.5;
                      let test_x = i32(test_uv.x * f32(WIDTH));
                      let test_y = i32(test_uv.y * f32(HEIGHT));
                      let test_index = test_y * i32(WIDTH) + test_x;
                      
                      if (test_index >= 0 && test_index < i32(WIDTH * HEIGHT)) {
                        let test_attraction = attractorData[test_index];
                        if (test_attraction > max_attraction) {
                          max_attraction = test_attraction;
                          best_angle = test_angle;
                        }
                      }
                    }
                    
                    // Turn towards the direction of strongest attraction
                    var angle_diff = best_angle - slimes[threadId].angle;
                    if (angle_diff > 3.14159) { angle_diff = angle_diff - 6.28318; }
                    if (angle_diff < -3.14159) { angle_diff = angle_diff + 6.28318; }
                    
                    slimes[threadId].angle = slimes[threadId].angle + angle_diff * uniforms.attractionStrength;
                  }
                } else {
                  // Slime is not inside any text box - find nearest point on any box edge
                  var nearest_edge_point = vec2<f32>(0.0, 0.0);
                  var min_distance = 1.5;
                  var found_box = false;
                  
                  for (var i: u32 = 0u; i < num_boxes; i = i + 1u) {
                    // Skip dummy data
                    if (textBoxes[i * 4u] == -999.0) {
                      continue;
                    }
                    
                    let box = vec4<f32>(
                      textBoxes[i * 4u],     // x1
                      textBoxes[i * 4u + 1u], // y1
                      textBoxes[i * 4u + 2u], // x2
                      textBoxes[i * 4u + 3u]  // y2
                    );
                    
                    // Find nearest point on box edges
                    let x = clamp(current_pos.x, box.x, box.z);
                    let y = clamp(current_pos.y, box.y, box.w);
                    let edge_point = vec2<f32>(x, y);
                    
                    // Calculate distance to this edge point
                    let distance = length(current_pos - edge_point);
                    if (distance < min_distance) {
                      min_distance = distance;
                      nearest_edge_point = edge_point;
                      found_box = true;
                    }
                  }
                  
                  // If we found a box, attract towards nearest edge point
                  if (found_box) {
                    let angle_to_edge = atan2(nearest_edge_point.y - current_pos.y, nearest_edge_point.x - current_pos.x);
                    var angle_diff = angle_to_edge - slimes[threadId].angle;
                    
                    // Ensure we take the shortest turn
                    if (angle_diff > 3.14159) { angle_diff = angle_diff - 6.28318; }
                    if (angle_diff < -3.14159) { angle_diff = angle_diff + 6.28318; }

                    // Add a small random offset to the angle difference
                    let random_offset = (sin(f32(threadId) * 0.1 + f32(counter.value) * 0.01) - 0.5) * 0.2;
                    angle_diff = angle_diff + random_offset;

                    slimes[threadId].angle = slimes[threadId].angle + angle_diff * uniforms.attractionStrength * 0.05;
                  }
                }
              }
              // If num_boxes == 0, skip all bounding box logic and proceed to normal slime behavior

              // Turn based on wall sensing
              if (leftPos.x <= -1.0 && leftPos.x < rightPos.x) {
                slimes[threadId].angle = slimes[threadId].angle + uniforms.turnSpeed;
              } else if (rightPos.x <= -1.0 && rightPos.x < leftPos.x) {
                slimes[threadId].angle = slimes[threadId].angle - uniforms.turnSpeed;
              } else if (leftPos.x >= 1.0 && leftPos.x > rightPos.x) {
                slimes[threadId].angle = slimes[threadId].angle + uniforms.turnSpeed;
              } else if (rightPos.x >= 1.0 && rightPos.x > leftPos.x) {
                slimes[threadId].angle = slimes[threadId].angle - uniforms.turnSpeed;
              } else if (leftPos.y <= -1.0 && leftPos.y < rightPos.y) {
                slimes[threadId].angle = slimes[threadId].angle + uniforms.turnSpeed;
              } else if (rightPos.y <= -1.0 && rightPos.y < leftPos.y) {
                slimes[threadId].angle = slimes[threadId].angle - uniforms.turnSpeed;
              } else if (leftPos.y >= 1.0 && leftPos.y > rightPos.y) {
                slimes[threadId].angle = slimes[threadId].angle + uniforms.turnSpeed;
              } else if (rightPos.y >= 1.0 && rightPos.y > leftPos.y) {
                slimes[threadId].angle = slimes[threadId].angle - uniforms.turnSpeed;
              } else if (frontSense > leftSense && frontSense > rightSense) {
                // Continue straight - do nothing
              } else if (leftSense > rightSense) {
                slimes[threadId].angle = slimes[threadId].angle - uniforms.turnSpeed;
              } else if (rightSense > leftSense) {
                slimes[threadId].angle = slimes[threadId].angle + uniforms.turnSpeed;
              }
              
              // Move forward
              slimes[threadId].x = slimes[threadId].x + cos(slimes[threadId].angle) * uniforms.moveSpeed;
              slimes[threadId].y = slimes[threadId].y + sin(slimes[threadId].angle) * uniforms.moveSpeed;

              // Keep slimes within bounds
              slimes[threadId].x = clamp(slimes[threadId].x, -1.0, 1.0);
              slimes[threadId].y = clamp(slimes[threadId].y, -1.0, 1.0);

              // Convert slime position to texture coordinates with precise conversion
              let texCoord = vec2<i32>(
                i32(floor((slimes[threadId].x + 1.0) * 0.5 * f32(WIDTH))),
                i32(floor((slimes[threadId].y + 1.0) * 0.5 * f32(HEIGHT)))
              );

              // Ensure coordinates are within bounds with a small margin to prevent edge positioning
              if (texCoord.x >= 1 && texCoord.x < i32(WIDTH) - 1 && texCoord.y >= 1 && texCoord.y < i32(HEIGHT) - 1) {
                // Write a bright white trail that will be visible
                textureStore(writeTrailMap, vec2<u32>(u32(texCoord.x), u32(texCoord.y)), vec4<f32>(1.0, 1.0, 1.0, 1.0));
              }

              // Only the first thread updates the counter
              if (threadId == 0u) {
                counter.value = counter.value + 1u;
              }

              // Ensure all threads in the workgroup complete before moving to next workgroup
              workgroupBarrier();
            }
          `,
        })

        // Create render shader
        const renderShader = device.createShaderModule({
          code: `
            // Global constants
            const NUM_SLIMES: u32 = ${numSlimes}u;
            const WIDTH: f32 = ${width}.0;
            const HEIGHT: f32 = ${height}.0;

            struct VertexOutput {
              @builtin(position) position: vec4<f32>,
            };

            @vertex
            fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
              var pos = array<vec2<f32>, 6>(
                vec2<f32>(-1.0, -1.0),
                vec2<f32>(1.0, -1.0),
                vec2<f32>(-1.0, 1.0),
                vec2<f32>(-1.0, 1.0),
                vec2<f32>(1.0, -1.0),
                vec2<f32>(1.0, 1.0)
              );

              var output: VertexOutput;
              output.position = vec4<f32>(pos[vertexIndex], 0.0, 1.0);
              return output;
            }

            struct Counter {
              value: u32,
            }

            struct Slime {
              x: f32,
              y: f32,
              angle: f32,
            }

            @binding(0) @group(0) var<storage, read> counter: Counter;
            @binding(1) @group(0) var<storage, read> slimes: array<Slime>;
            @binding(2) @group(0) var trailMap: texture_2d<f32>;

            @fragment
            fn fragmentMain(@builtin(position) position: vec4<f32>) -> @location(0) vec4<f32> {
              // Sample trail map
              let trailColor = textureLoad(trailMap, vec2<i32>(i32(position.x), i32(position.y)), 0);
              
              // Make trails more visible - use any channel that has value
              let trailIntensity = max(trailColor.r, max(trailColor.g, trailColor.b));
              
              // If there's a trail, show it as white
              if (trailIntensity > 0.0) {
                return vec4<f32>(trailIntensity, trailIntensity, trailIntensity, 1.0);
              }
              
              // Otherwise show black background
              return vec4<f32>(0.0, 0.0, 0.0, 1.0);
            }
          `,
        })

        // Create decay-diffusion pipeline
        const decayDiffusionPipeline = device.createComputePipeline({
          layout: 'auto',
          compute: {
            module: decayDiffusionShader,
            entryPoint: 'main',
          },
        })

        // Create slime pipeline
        const slimePipeline = device.createComputePipeline({
          layout: 'auto',
          compute: {
            module: slimeShader,
            entryPoint: 'main',
          },
        })

        // Create render pipeline
        const renderPipeline = device.createRenderPipeline({
          layout: 'auto',
          vertex: {
            module: renderShader,
            entryPoint: 'vertexMain',
          },
          fragment: {
            module: renderShader,
            entryPoint: 'fragmentMain',
            targets: [{
              format,
            }],
          },
          primitive: {
            topology: 'triangle-list',
          },
        })

        // Create bind group layout
        // const bindGroupLayout = device.createBindGroupLayout({
        //   entries: [
        //     { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        //     { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        //     { binding: 2, visibility: GPUShaderStage.COMPUTE, texture: { sampleType: 'unfilterable-float' } },
        //     { binding: 3, visibility: GPUShaderStage.COMPUTE, storageTexture: { access: 'write-only', format: 'rgba8unorm' } },
        //     { binding: 4, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
        //     { binding: 5, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
        //     { binding: 6, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
        //   ],
        // })

        // Create slime bind groups
        const slimeBindGroups = [
          device.createBindGroup({
            layout: slimePipeline.getBindGroupLayout(0),
            entries: [
              {
                binding: 0,
                resource: { buffer: counterBuffer },
              },
              {
                binding: 1,
                resource: { buffer: slimeBuffer },
              },
              {
                binding: 2,
                resource: trailTextures[0].createView(),
              },
              {
                binding: 3,
                resource: trailTextures[1].createView(),
              },
              {
                binding: 4,
                resource: { buffer: uniformBuffer },
              },
              {
                binding: 5,
                resource: { buffer: attractorBuffer },
              },
              {
                binding: 6,
                resource: { buffer: textBoxesBuffer },
              },
            ],
          }),
          device.createBindGroup({
            layout: slimePipeline.getBindGroupLayout(0),
            entries: [
              {
                binding: 0,
                resource: { buffer: counterBuffer },
              },
              {
                binding: 1,
                resource: { buffer: slimeBuffer },
              },
              {
                binding: 2,
                resource: trailTextures[1].createView(),
              },
              {
                binding: 3,
                resource: trailTextures[0].createView(),
              },
              {
                binding: 4,
                resource: { buffer: uniformBuffer },
              },
              {
                binding: 5,
                resource: { buffer: attractorBuffer },
              },
              {
                binding: 6,
                resource: { buffer: textBoxesBuffer },
              },
            ],
          }),
        ]

        // Create decay-diffusion bind groups
        const decayDiffusionBindGroups = [
          device.createBindGroup({
            layout: decayDiffusionPipeline.getBindGroupLayout(0),
            entries: [
              {
                binding: 0,
                resource: trailTextures[0].createView(),
              },
              {
                binding: 1,
                resource: trailTextures[1].createView(),
              },
              {
                binding: 2,
                resource: { buffer: uniformBuffer },
              }
            ],
          }),
          device.createBindGroup({
            layout: decayDiffusionPipeline.getBindGroupLayout(0),
            entries: [
              {
                binding: 0,
                resource: trailTextures[1].createView(),
              },
              {
                binding: 1,
                resource: trailTextures[0].createView(),
              },
              {
                binding: 2,
                resource: { buffer: uniformBuffer },
              }
            ],
          }),
        ]

        const renderBindGroups = [
          device.createBindGroup({
            layout: renderPipeline.getBindGroupLayout(0),
            entries: [
              {
                binding: 0,
                resource: { buffer: counterBuffer },
              },
              {
                binding: 1,
                resource: { buffer: slimeBuffer },
              },
              {
                binding: 2,
                resource: trailTextures[0].createView(),
              },
            ],
          }),
          device.createBindGroup({
            layout: renderPipeline.getBindGroupLayout(0),
            entries: [
              {
                binding: 0,
                resource: { buffer: counterBuffer },
              },
              {
                binding: 1,
                resource: { buffer: slimeBuffer },
              },
              {
                binding: 2,
                resource: trailTextures[1].createView(),
              },
            ],
          }),
        ]

        simulationStateRef.current = {
            device,
            uniformBuffer,
            attractorBuffer,
            textBoxesBuffer,
        };

        let currentBuffer = 0

        // Animation loop
        const animate = async () => {
          try {
            frameCountRef.current++
            
            // Create command encoder
            const commandEncoder = device.createCommandEncoder()
            
            // Decay-diffusion pass
            const decayDiffusionPass = commandEncoder.beginComputePass()
            decayDiffusionPass.setPipeline(decayDiffusionPipeline)
            decayDiffusionPass.setBindGroup(0, decayDiffusionBindGroups[currentBuffer])
            const decayDiffusionWorkgroupsX = Math.ceil(width / 16)
            const decayDiffusionWorkgroupsY = Math.ceil(height / 16)
            decayDiffusionPass.dispatchWorkgroups(decayDiffusionWorkgroupsX, decayDiffusionWorkgroupsY, 1)
            decayDiffusionPass.end()
            
            // Submit compute commands to ensure texture is ready for slimes
            device.queue.submit([commandEncoder.finish()])

            // Create a new command encoder for slime updates
            const slimeEncoder = device.createCommandEncoder()
            
            // Slime update pass - read from current buffer, write to next buffer
            const slimePass = slimeEncoder.beginComputePass()
            slimePass.setPipeline(slimePipeline)
            slimePass.setBindGroup(0, slimeBindGroups[currentBuffer])
            const slimeWorkgroupsX = Math.ceil(numSlimes / 100)
            
            slimePass.dispatchWorkgroups(slimeWorkgroupsX, 1, 1)
            slimePass.end()
            
            // Submit slime commands
            device.queue.submit([slimeEncoder.finish()])

            // Create a new command encoder for rendering
            const renderEncoder = device.createCommandEncoder()
            
            // Render pass
            const renderPass = renderEncoder.beginRenderPass({
              colorAttachments: [
                {
                  view: context.getCurrentTexture().createView(),
                  clearValue: { r: 0, g: 0, b: 0, a: 1 },
                  loadOp: 'clear',
                  storeOp: 'store',
                },
              ],
            })

            renderPass.setPipeline(renderPipeline)
            renderPass.setBindGroup(0, renderBindGroups[currentBuffer])
            renderPass.draw(6, 1, 0, 0)
            renderPass.end()

            // Submit render commands
            device.queue.submit([renderEncoder.finish()])

            // Swap buffers
            currentBuffer = 1 - currentBuffer

            animationFrameId = requestAnimationFrame(animate)
          } catch (error) {
            console.error('Error in animation loop:', error)
            setError(error instanceof Error ? error.message : 'An error occurred in animation loop')
          }
        }

        // Start animation
        animate().catch(error => {
          console.error('Error starting animation:', error)
          setError(error instanceof Error ? error.message : 'An error occurred starting animation')
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      }
    }

    initWebGPU()

    return () => {
        cancelAnimationFrame(animationFrameId);
        simulationStateRef.current = null;
    }
  }, [width, height, numSlimes])

  if (error) {
    return <div className="text-red-500">Error: {error}</div>
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ touchAction: 'none', backgroundColor: '#000000', position: 'fixed', top: 0, left: 0, zIndex: -1 }}
    />
  )
} 