export type WGSLScalarKind = 'bool' | 'i32' | 'u32' | 'f32' | 'f16';
export type WGSLCompoundKind = 'vector' | 'matrix' | 'array' | 'struct' | 'atomic';
export type WGSLSamplerKind = 'sampler' | 'sampler-comparison';
export type WGSLTextureKind =
  | 'sampled-texture'
  | 'multisampled-texture'
  | 'depth-texture'
  | 'depth-multisampled-texture';

export type WGSLKind = WGSLScalarKind | WGSLCompoundKind | WGSLSamplerKind | WGSLTextureKind;

export interface WGSLTypeBase {
  // The kind of the WGSL type
  readonly kind: WGSLKind;
}

interface WGSLView {
  // Returns a new view on the array element, vector element or matrix column
  // or structure member.
  index(i: number | string): WGSLView;

  // The view's type
  readonly type: WGSLSizedType;

  // Deserializes the value from the buffer
  get(): any;

  // Serializes value to the buffer
  set(value: any): undefined;
}

// The behavior used for incomplete struct members or array elements in the
// value passed to WGSLView.set().
export type WGSLViewMissingValue =
  | 'zero' // Write a zero value.
  | 'preserve'; // Preserve the existing value.

export interface WGSLViewDescriptor extends GPUObjectDescriptorBase {
  // The buffer to apply the view to
  buffer: ArrayBuffer;
  // The byte offset within the buffer
  offset?: number;
  // The behavior used when calling set() with incomplete struct members or
  // array elements
  missingValue?: WGSLViewMissingValue;
}

export interface WGSLSizedType extends WGSLTypeBase {
  // The size in bytes of the type
  readonly size: GPUSize64;
  // The alignment in bytes of the type
  readonly align: GPUSize64;

  createView(descriptor: WGSLViewDescriptor): WGSLView;
}

export interface WGSLScalarType extends WGSLSizedType {
  // The kind of the WGSL type
  readonly kind: WGSLScalarKind;
}

export interface WGSLAtomicType extends WGSLSizedType {
  // The kind of the WGSL type
  readonly kind: 'atomic';
  // The vector element type
  readonly elementType: WGSLScalarType;
}

export interface WGSLVectorType extends WGSLSizedType {
  // The kind of the WGSL type
  readonly kind: 'vector';
  // The number of elements in the vector
  readonly elementCount: GPUSize64;
  // The vector element type
  readonly elementType: WGSLScalarType;
}

export interface WGSLMatrixType extends WGSLSizedType {
  // The kind of the WGSL type
  readonly kind: 'matrix';
  // The number of columns in the matrix
  readonly columnCount: GPUSize64;
  // The number of rows in the matrix
  readonly rowCount: GPUSize64;
  // The matrix element type
  readonly elementType: WGSLScalarType;
  // The matrix column vector type
  readonly columnType: WGSLVectorType;
}

export type WGSLArrayCount = GPUSize64 | 'runtime-sized';

export interface WGSLArrayType extends WGSLSizedType {
  // The kind of the WGSL type
  readonly kind: 'array';
  // The number of elements in the array
  readonly elementCount: WGSLArrayCount;
  // The matrix element type
  readonly elementType: WGSLScalarType;
}

export interface WGSLStructMember {
  // The name of the structure member
  readonly name: string;
  // Tha type of the structure member
  readonly type: WGSLSizedType;
  // The index of the member in the structure
  readonly index: GPUIndex32;
  // The offset in bytes of the structure member from the start of the
  // structure
  readonly offset: GPUSize64;
  // The size of the structure member.
  // If the member was annotated with a @size(N) attribute, then this is the
  // value of N, otherwise this is equal to type.size.
  readonly size: GPUSize64;
  // The alignment of the structure member.
  // If the member was annotated with a @alignment(N) attribute, then this is
  // the value of N, otherwise this is equal to type.alignment.
  readonly align: GPUSize64;
}

export interface WGSLStructType extends WGSLSizedType {
  // The kind of the WGSL type
  readonly kind: 'struct';
  // The name of the structure
  readonly name: string;
  // The members in the structure
  readonly members: ReadonlyArray<WGSLStructMember>;
}

export interface WGSLSamplerType extends WGSLTypeBase {
  // The kind of the WGSL type
  readonly kind: WGSLSamplerKind;
}

export interface WGSLSampledTextureType extends WGSLTypeBase {
  // The kind of the WGSL type
  readonly kind: 'sampled-texture';
  // The dimensions of the texture
  readonly dimensions: GPUTextureViewDimension;
  // The sampled type of the texture
  readonly sampledType: WGSLSizedType;
}

export interface WGSLMultisampledTextureType extends WGSLTypeBase {
  // The kind of the WGSL type
  readonly kind: 'multisampled-texture';
  // The sampled type of the texture
  readonly sampledType: WGSLSizedType;
}

export interface WGSLDepthTextureType extends WGSLTypeBase {
  // The kind of the WGSL type
  readonly kind: 'depth-texture';
  // The dimensions of the texture
  readonly dimensions: GPUTextureViewDimension;
}

export interface WGSLMultisampledDepthTextureType extends WGSLTypeBase {
  // The kind of the WGSL type
  readonly kind: 'depth-multisampled-texture';
}

export type WGSLType =
  | WGSLScalarType
  | WGSLAtomicType
  | WGSLVectorType
  | WGSLMatrixType
  | WGSLArrayType
  | WGSLStructType
  | WGSLSamplerType
  | WGSLSampledTextureType
  | WGSLMultisampledTextureType
  | WGSLDepthTextureType
  | WGSLMultisampledDepthTextureType;

export interface WGSLBindPoint {
  // The name of the variable
  readonly name: string;
  // The value for @group()
  readonly group: GPUIndex32;
  // The value for @binding()
  readonly binding: GPUIndex32;
  // The type of the variable
  readonly type: WGSLType;
}

export interface WGSLBindGroup extends ReadonlyMap<GPUIndex32, WGSLBindPoint> {
  readonly group: GPUIndex32;
}

export type WGSLBindGroups = ReadonlyMap<GPUIndex32, WGSLBindGroup>;

export interface WGSLEntryPoint {
  readonly stage: 'compute' | 'fragment' | 'vertex';
  readonly bindgroups: ReadonlyMap<GPUIndex32, WGSLBindGroup>;
  readonly name: string;
}

export type WGSLEntryPoints = ReadonlyMap<string, WGSLEntryPoint>;
