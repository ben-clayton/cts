/** @module webgpu/constants */

// Note: Types ensure every field is specified.

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
function checkType<T>(x: T) {}

const BufferUsage = {
  MAP_READ: 0x0001,
  MAP_WRITE: 0x0002,
  COPY_SRC: 0x0004,
  COPY_DST: 0x0008,
  INDEX: 0x0010,
  VERTEX: 0x0020,
  UNIFORM: 0x0040,
  STORAGE: 0x0080,
  INDIRECT: 0x0100,
  QUERY_RESOLVE: 0x0200,
} as const;
checkType<Omit<GPUBufferUsage, '__brand'>>(BufferUsage);

const TextureUsage = {
  COPY_SRC: 0x01,
  COPY_DST: 0x02,
  SAMPLED: 0x04,
  STORAGE: 0x08,
  RENDER_ATTACHMENT: 0x10,
} as const;
checkType<Omit<GPUTextureUsage, '__brand'>>(TextureUsage);

const ColorWrite = {
  RED: 0x1,
  GREEN: 0x2,
  BLUE: 0x4,
  ALPHA: 0x8,
  ALL: 0xf,
} as const;
checkType<Omit<GPUColorWrite, '__brand'>>(ColorWrite);

const ShaderStage = {
  VERTEX: 0x1,
  FRAGMENT: 0x2,
  COMPUTE: 0x4,
} as const;
checkType<Omit<GPUShaderStage, '__brand'>>(ShaderStage);

const MapMode = {
  READ: 0x1,
  WRITE: 0x2,
} as const;
checkType<Omit<GPUMapMode, '__brand'>>(MapMode);

export const GPUConst = {
  BufferUsage,
  TextureUsage,
  ColorWrite,
  ShaderStage,
  MapMode,
} as const;

type Limits = Omit<GPUAdapterLimits, '__brand'>;
export const DefaultLimits: Limits = {
  maxTextureDimension1D: 8192,
  maxTextureDimension2D: 8192,
  maxTextureDimension3D: 2048,
  maxTextureArrayLayers: 2048,
  maxBindGroups: 4,
  maxDynamicUniformBuffersPerPipelineLayout: 8,
  maxDynamicStorageBuffersPerPipelineLayout: 4,
  maxSampledTexturesPerShaderStage: 16,
  maxSamplersPerShaderStage: 16,
  maxStorageBuffersPerShaderStage: 4,
  maxStorageTexturesPerShaderStage: 4,
  maxUniformBuffersPerShaderStage: 12,
  maxUniformBufferBindingSize: 16384,
  maxStorageBufferBindingSize: 134217728,
  maxVertexBuffers: 8,
  maxVertexAttributes: 16,
  maxVertexBufferArrayStride: 2048,
};
