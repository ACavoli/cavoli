interface Navigator {
  gpu: GPU;
}

interface GPU {
  requestAdapter(options?: GPURequestAdapterOptions): Promise<GPUAdapter | null>;
  getPreferredCanvasFormat(): GPUTextureFormat;
}

interface GPUAdapter {
  requestDevice(descriptor?: GPUDeviceDescriptor): Promise<GPUDevice>;
}

interface GPUDevice {
  createBuffer(descriptor: GPUBufferDescriptor): GPUBuffer;
  createBindGroupLayout(descriptor: GPUBindGroupLayoutDescriptor): GPUBindGroupLayout;
  createPipelineLayout(descriptor: GPUPipelineLayoutDescriptor): GPUPipelineLayout;
  createShaderModule(descriptor: GPUShaderModuleDescriptor): GPUShaderModule;
  createComputePipeline(descriptor: GPUComputePipelineDescriptor): GPUComputePipeline;
  createRenderPipeline(descriptor: GPURenderPipelineDescriptor): GPURenderPipeline;
  createBindGroup(descriptor: GPUBindGroupDescriptor): GPUBindGroup;
  createCommandEncoder(descriptor?: GPUCommandEncoderDescriptor): GPUCommandEncoder;
  createTexture(descriptor: GPUTextureDescriptor): GPUTexture;
  createSampler(descriptor?: GPUSamplerDescriptor): GPUSampler;
  queue: GPUQueue;
  addEventListener(type: string, listener: EventListener): void;
}

interface GPUBuffer {
  size: number;
  getMappedRange(): ArrayBuffer;
  unmap(): void;
}

interface GPUBindGroupLayout {
  entries: GPUBindGroupLayoutEntry[];
}

interface GPUPipelineLayout {
  bindGroupLayouts: GPUBindGroupLayout[];
}

interface GPUShaderModule {
  code: string;
}

interface GPUComputePipeline {
  getBindGroupLayout(index: number): GPUBindGroupLayout;
}

interface GPURenderPipeline {
  getBindGroupLayout(index: number): GPUBindGroupLayout;
}

interface GPURenderPipelineColorTargetState {
  format: GPUTextureFormat;
}

type GPUPrimitiveTopology = 'point-list' | 'line-list' | 'line-strip' | 'triangle-list' | 'triangle-strip';

interface GPUBindGroup {
  layout: GPUBindGroupLayout;
  entries: GPUBindGroupEntry[];
}

interface GPUCommandEncoder {
  beginComputePass(descriptor?: GPUComputePassDescriptor): GPUComputePassEncoder;
  beginRenderPass(descriptor: GPURenderPassDescriptor): GPURenderPassEncoder;
  copyBufferToBuffer(
    source: GPUBuffer,
    sourceOffset: number,
    destination: GPUBuffer,
    destinationOffset: number,
    size: number
  ): void;
  finish(): GPUCommandBuffer;
}

interface GPUComputePassEncoder {
  setPipeline(pipeline: GPUComputePipeline): void;
  setBindGroup(index: number, bindGroup: GPUBindGroup): void;
  dispatchWorkgroups(x: number, y: number, z: number): void;
  end(): void;
}

interface GPURenderPassEncoder {
  setPipeline(pipeline: GPURenderPipeline): void;
  setBindGroup(index: number, bindGroup: GPUBindGroup): void;
  draw(vertexCount: number, instanceCount: number, firstVertex: number, firstInstance: number): void;
  end(): void;
}

interface GPUQueue {
  submit(commandBuffers: GPUCommandBuffer[]): void;
  writeBuffer(buffer: GPUBuffer, bufferOffset: number, data: BufferSource): void;
  copyExternalImageToTexture(
    source: GPUImageCopyExternalImage,
    destination: GPUImageCopyTexture,
    copySize: GPUExtent3D
  ): void;
}

// interface GPUCommandBuffer {}

interface GPUTexture {
  createView(descriptor?: GPUTextureViewDescriptor): GPUTextureView;
}

// interface GPUTextureView {}

interface GPUCanvasContext {
  configure(descriptor: GPUCanvasConfiguration): void;
  getCurrentTexture(): GPUTexture;
}

interface GPUCanvasConfiguration {
  device: GPUDevice;
  format: GPUTextureFormat;
  alphaMode?: GPUCanvasAlphaMode;
}

type GPUCanvasAlphaMode = 'opaque' | 'premultiplied' | 'unpremultiplied';

interface GPURenderPassDescriptor {
  colorAttachments: GPURenderPassColorAttachment[];
}

interface GPURenderPassColorAttachment {
  view: GPUTextureView;
  clearValue: GPUColor;
  loadOp: GPULoadOp;
  storeOp: GPUStoreOp;
}

type GPULoadOp = 'clear' | 'load';
type GPUStoreOp = 'store' | 'discard';
type GPUTextureFormat = string;
type GPUColor = { r: number; g: number; b: number; a: number };

interface GPUBufferDescriptor {
  size: number;
  usage: number;
  mappedAtCreation?: boolean;
}

interface GPUTextureDescriptor {
  size: GPUExtent3D;
  format: GPUTextureFormat;
  usage: number;
}

interface GPUExtent3D {
  width: number;
  height: number;
  depthOrArrayLayers?: number;
}

interface GPUBindGroupLayoutDescriptor {
  entries: GPUBindGroupLayoutEntry[];
}

interface GPUBindGroupLayoutEntry {
  binding: number;
  visibility: number;
  buffer?: {
    type: string;
  };
  texture?: {
    sampleType: string;
  };
  storageTexture?: {
    access: string;
    format: string;
  };
}

interface GPUPipelineLayoutDescriptor {
  bindGroupLayouts: GPUBindGroupLayout[];
}

interface GPUShaderModuleDescriptor {
  code: string;
}

interface GPUComputePipelineDescriptor {
  layout: GPUPipelineLayout | 'auto';
  compute: {
    module: GPUShaderModule;
    entryPoint: string;
  };
}

interface GPURenderPipelineDescriptor {
  layout: GPUPipelineLayout | 'auto';
  vertex: {
    module: GPUShaderModule;
    entryPoint: string;
  };
  fragment: {
    module: GPUShaderModule;
    entryPoint: string;
    targets: GPURenderPipelineColorTargetState[];
  };
  primitive: {
    topology: GPUPrimitiveTopology;
  };
}

interface GPUBindGroupDescriptor {
  layout: GPUBindGroupLayout;
  entries: GPUBindGroupEntry[];
}

interface GPUBindGroupEntry {
  binding: number;
  resource: {
    buffer?: GPUBuffer;
    texture?: GPUTextureView;
    sampler?: GPUSampler;
  };
}

// interface GPUCommandEncoderDescriptor {}

// interface GPUComputePassDescriptor {}

// interface GPUTextureViewDescriptor {}

// interface GPURequestAdapterOptions {}

// interface GPUDeviceDescriptor {}

// WebGPU constants
declare const GPUBufferUsage: {
  MAP_READ: number;
  MAP_WRITE: number;
  COPY_SRC: number;
  COPY_DST: number;
  INDEX: number;
  VERTEX: number;
  UNIFORM: number;
  STORAGE: number;
  INDIRECT: number;
  QUERY_RESOLVE: number;
};

declare const GPUTextureUsage: {
  COPY_SRC: number;
  COPY_DST: number;
  TEXTURE_BINDING: number;
  STORAGE_BINDING: number;
  RENDER_ATTACHMENT: number;
};

declare const GPUShaderStage: {
  VERTEX: number;
  FRAGMENT: number;
  COMPUTE: number;
};

declare const GPUTextureSampleType: {
  UNFILTERABLE_FLOAT: string;
  FILTERABLE_FLOAT: string;
  UNFILTERABLE_INT: string;
  UNFILTERABLE_UINT: string;
  DEPTH: string;
  SINT: string;
  UINT: string;
};

declare const GPUStorageTextureAccess: {
  WRITE_ONLY: string;
};

// Extend HTMLCanvasElement to support WebGPU context
interface HTMLCanvasElement {
  getContext(contextId: 'webgpu'): GPUCanvasContext | null;
}

// interface GPUSampler {}

interface GPUSamplerDescriptor {
    addressModeU?: GPUAddressMode;
    addressModeV?: GPUAddressMode;
    addressModeW?: GPUAddressMode;
    magFilter?: GPUFilterMode;
    minFilter?: GPUFilterMode;
    mipmapFilter?: GPUMipmapFilterMode;
    lodMinClamp?: number;
    lodMaxClamp?: number;
    compare?: GPUCompareFunction;
    maxAnisotropy?: number;
}

type GPUAddressMode = 'clamp-to-edge' | 'repeat' | 'mirror-repeat';
type GPUFilterMode = 'nearest' | 'linear';
type GPUMipmapFilterMode = 'nearest' | 'linear';
type GPUCompareFunction = 'never' | 'less' | 'equal' | 'less-equal' | 'greater' | 'not-equal' | 'greater-equal' | 'always';

interface GPUImageCopyExternalImage {
    source: HTMLCanvasElement | HTMLVideoElement | ImageBitmap;
    origin?: { x?: number, y?: number };
    flipY?: boolean;
}

interface GPUImageCopyTexture {
    texture: GPUTexture;
    mipLevel?: number;
    origin?: { x?: number, y?: number, z?: number };
    aspect?: 'all' | 'stencil-only' | 'depth-only';
} 