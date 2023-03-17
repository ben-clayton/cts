import { keysOf } from '../../../../../../common/util/data_tables';
import { assert } from '../../../../../../common/util/util';
import { Float16Array } from '../../../../../../external/petamoriken/float16/float16';
import { insertBits } from '../../../../../util/buffer';
import { lin_sRGB } from '../../../../../util/color_space_conversion';
import { kValue } from '../../../../../util/constants';
import { float32ToUint32 } from '../../../../../util/conversion';
import {
  align,
  clamp,
  hashU32s,
  lerp,
  quantizeToF16,
  quantizeToF32,
} from '../../../../../util/math';
import { createTextureUploadBuffer } from '../../../../../util/texture/layout';
import { ufloat10 as uf10, ufloat11 as uf11 } from '../../../../../util/ufloat';

/** Channel is an enumerator of texel component channels */
export type Channel =
  | 'r' /** red */
  | 'g' /** green */
  | 'b' /** blue */
  | 'a' /** alpha */
  | 'd' /** depth */
  | 's' /** stencil */;

export type NumberTransform = (value: number) => number;

export interface ComponentDataType {
  kind: 'unorm' | 'unorm-srgb' | 'snorm' | 'float' | 'uint' | 'sint' | 'ufloat';
  bits: number;
  lowest: number;
  highest: number;
  quantize: NumberTransform;
  normalize: NumberTransform;
  encode: (value: number, buffer: ArrayBufferLike, bitOffset: number) => void;
}

export const unorm2: ComponentDataType = {
  kind: 'unorm',
  bits: 2,
  lowest: 0,
  highest: 3,
  quantize: (value: number) => clamp(Math.floor(value), { min: 0, max: 3 }),
  normalize: (value: number) => value / 3,
  encode: (value: number, buffer: ArrayBufferLike, bitOffset: number) => {
    insertBits(value, buffer, bitOffset, 2);
  },
};

export const unorm8: ComponentDataType = {
  kind: 'unorm',
  bits: 8,
  lowest: kValue.u8.min,
  highest: kValue.u8.max,
  quantize: (value: number) => clamp(Math.floor(value), { min: kValue.u8.min, max: kValue.u8.max }),
  normalize: (value: number) => value / kValue.u8.max,
  encode: (value: number, buffer: ArrayBufferLike, bitOffset: number) => {
    assert((bitOffset & 7) === 0);
    new Uint8Array(buffer)[bitOffset / 8] = value;
  },
};

export const unorm8srgb: ComponentDataType = {
  kind: 'unorm-srgb',
  bits: 8,
  lowest: kValue.u8.min,
  highest: kValue.u8.max,
  quantize: (value: number) => clamp(Math.floor(value), { min: kValue.u8.min, max: kValue.u8.max }),
  normalize: (value: number) => lin_sRGB([value / kValue.u8.max])[0],
  encode: (value: number, buffer: ArrayBufferLike, bitOffset: number) => {
    assert((bitOffset & 7) === 0);
    new Uint8Array(buffer)[bitOffset / 8] = value;
  },
};

export const snorm8: ComponentDataType = {
  kind: 'snorm',
  bits: 8,
  lowest: kValue.i8.negative.min,
  highest: kValue.i8.positive.max,
  quantize: (value: number) =>
    clamp(Math.floor(value), { min: kValue.i8.negative.min, max: kValue.i8.positive.max }),
  normalize: (value: number) => clamp(value / kValue.i8.positive.max, { min: -1, max: 1 }),
  encode: (value: number, buffer: ArrayBufferLike, bitOffset: number) => {
    assert((bitOffset & 7) === 0);
    new Int8Array(buffer)[bitOffset / 8] = value;
  },
};

export const uint8: ComponentDataType = {
  kind: 'uint',
  bits: 8,
  lowest: kValue.u8.min,
  highest: kValue.u8.max,
  quantize: (value: number) => clamp(Math.floor(value), { min: kValue.u8.min, max: kValue.u8.max }),
  normalize: (value: number) => value,
  encode: (value: number, buffer: ArrayBufferLike, bitOffset: number) => {
    assert((bitOffset & 7) === 0);
    new Uint8Array(buffer)[bitOffset / 8] = value;
  },
};

export const sint8: ComponentDataType = {
  kind: 'sint',
  bits: 8,
  lowest: kValue.i8.negative.min,
  highest: kValue.i8.positive.max,
  quantize: (value: number) =>
    clamp(Math.floor(value), { min: kValue.i8.negative.min, max: kValue.i8.positive.max }),
  normalize: (value: number) => value,
  encode: (value: number, buffer: ArrayBufferLike, bitOffset: number) => {
    assert((bitOffset & 7) === 0);
    new Int8Array(buffer)[bitOffset / 8] = value;
  },
};

export const unorm10: ComponentDataType = {
  kind: 'unorm',
  bits: 10,
  lowest: 0,
  highest: 1023,
  quantize: (value: number) => clamp(Math.floor(value), { min: 0, max: 1023 }),
  normalize: (value: number) => value / 1023,
  encode: (value: number, buffer: ArrayBufferLike, bitOffset: number) => {
    insertBits(value, buffer, bitOffset, 10);
  },
};

export const ufloat10: ComponentDataType = {
  kind: 'ufloat',
  bits: 10,
  lowest: uf10.lowest,
  highest: uf10.highest,
  quantize: (value: number) => uf10.quantize(value),
  normalize: (value: number) => value,
  encode: (value: number, buffer: ArrayBufferLike, bitOffset: number) => {
    insertBits(uf10.toBits(value), buffer, bitOffset, 10);
  },
};

export const ufloat11: ComponentDataType = {
  kind: 'ufloat',
  bits: 11,
  lowest: uf11.lowest,
  highest: uf11.highest,
  quantize: (value: number) => uf11.quantize(value),
  normalize: (value: number) => value,
  encode: (value: number, buffer: ArrayBufferLike, bitOffset: number) => {
    insertBits(uf11.toBits(value), buffer, bitOffset, 11);
  },
};

export const uint16: ComponentDataType = {
  kind: 'uint',
  bits: 16,
  lowest: kValue.u16.min,
  highest: kValue.u16.max,
  quantize: (value: number) =>
    clamp(Math.floor(value), { min: kValue.u16.min, max: kValue.u16.max }),
  normalize: (value: number) => value,
  encode: (value: number, buffer: ArrayBufferLike, bitOffset: number) => {
    assert((bitOffset & 15) === 0);
    new Uint16Array(buffer)[bitOffset / 16] = value;
  },
};

export const sint16: ComponentDataType = {
  kind: 'sint',
  bits: 16,
  lowest: kValue.i16.negative.min,
  highest: kValue.i16.positive.max,
  quantize: (value: number) =>
    clamp(Math.floor(value), { min: kValue.i16.negative.min, max: kValue.i16.positive.max }),
  normalize: (value: number) => value,
  encode: (value: number, buffer: ArrayBufferLike, bitOffset: number) => {
    assert((bitOffset & 15) === 0);
    new Int16Array(buffer)[bitOffset / 16] = value;
  },
};

export const float16: ComponentDataType = {
  kind: 'float',
  bits: 16,
  lowest: kValue.f16.negative.min,
  highest: kValue.f16.positive.max,
  quantize: quantizeToF16,
  normalize: (value: number) => value,
  encode: (value: number, buffer: ArrayBufferLike, bitOffset: number) => {
    assert((bitOffset & 15) === 0);
    new Float16Array(buffer)[bitOffset / 16] = value;
  },
};

export const uint32: ComponentDataType = {
  kind: 'uint',
  bits: 32,
  lowest: kValue.u32.min,
  highest: kValue.u32.max,
  quantize: (value: number) =>
    clamp(Math.floor(value), { min: kValue.u32.min, max: kValue.u32.max }),
  normalize: (value: number) => value,
  encode: (value: number, buffer: ArrayBufferLike, bitOffset: number) => {
    assert((bitOffset & 31) === 0);
    new Uint32Array(buffer)[bitOffset / 32] = value;
  },
};

export const sint32: ComponentDataType = {
  kind: 'sint',
  bits: 32,
  lowest: kValue.i32.negative.min,
  highest: kValue.i32.positive.max,
  quantize: (value: number) =>
    clamp(Math.floor(value), { min: kValue.i32.negative.min, max: kValue.i32.positive.max }),
  normalize: (value: number) => value,
  encode: (value: number, buffer: ArrayBufferLike, bitOffset: number) => {
    assert((bitOffset & 31) === 0);
    new Int32Array(buffer)[bitOffset / 32] = value;
  },
};

export const float32: ComponentDataType = {
  kind: 'float',
  bits: 32,
  lowest: 0, // -1e20, // kValue.f32.negative.min,
  highest: 1, //  1e20, // kValue.f32.positive.max,
  quantize: quantizeToF32,
  normalize: (value: number) => value,
  encode: (value: number, buffer: ArrayBufferLike, bitOffset: number) => {
    assert((bitOffset & 31) === 0);
    new Float32Array(buffer)[bitOffset / 32] = value;
  },
};

export type ImageSampledType = 'f32' | 'i32' | 'u32';

export interface ComponentInfo {
  channel: Channel;
  dataType: ComponentDataType;
}

export interface ImageFormat {
  /** The GPUTextureFormat */
  readonly textureFormat: GPUTextureFormat;

  /** The texel components */
  readonly components: ComponentInfo[];

  /** The total number of bits, per texel */
  readonly bitsPerTexel: number;

  /** The WGSL sampled texture type, i.e. `X` in `texture_2d<X>` */
  readonly sampledType: ImageSampledType;
}

function buildImageFormats() {
  const a2unorm: ComponentInfo = { channel: 'a', dataType: unorm2 };
  const r8unorm: ComponentInfo = { channel: 'r', dataType: unorm8 };
  const r8unormsrgb: ComponentInfo = { channel: 'r', dataType: unorm8srgb };
  const r8snorm: ComponentInfo = { channel: 'r', dataType: snorm8 };
  const r8uint: ComponentInfo = { channel: 'r', dataType: uint8 };
  const r8sint: ComponentInfo = { channel: 'r', dataType: sint8 };
  const g8unorm: ComponentInfo = { channel: 'g', dataType: unorm8 };
  const g8unormsrgb: ComponentInfo = { channel: 'g', dataType: unorm8srgb };
  const g8snorm: ComponentInfo = { channel: 'g', dataType: snorm8 };
  const g8uint: ComponentInfo = { channel: 'g', dataType: uint8 };
  const g8sint: ComponentInfo = { channel: 'g', dataType: sint8 };
  const b8unorm: ComponentInfo = { channel: 'b', dataType: unorm8 };
  const b8unormsrgb: ComponentInfo = { channel: 'b', dataType: unorm8srgb };
  const b8snorm: ComponentInfo = { channel: 'b', dataType: snorm8 };
  const b8uint: ComponentInfo = { channel: 'b', dataType: uint8 };
  const b8sint: ComponentInfo = { channel: 'b', dataType: sint8 };
  const a8unorm: ComponentInfo = { channel: 'a', dataType: unorm8 };
  const a8snorm: ComponentInfo = { channel: 'a', dataType: snorm8 };
  const a8uint: ComponentInfo = { channel: 'a', dataType: uint8 };
  const a8sint: ComponentInfo = { channel: 'a', dataType: sint8 };
  const r10unorm: ComponentInfo = { channel: 'r', dataType: unorm10 };
  const g10unorm: ComponentInfo = { channel: 'g', dataType: unorm10 };
  const b10unorm: ComponentInfo = { channel: 'b', dataType: unorm10 };
  const r11ufloat: ComponentInfo = { channel: 'r', dataType: ufloat11 };
  const g11ufloat: ComponentInfo = { channel: 'g', dataType: ufloat11 };
  const b10ufloat: ComponentInfo = { channel: 'b', dataType: ufloat10 };
  const r16uint: ComponentInfo = { channel: 'r', dataType: uint16 };
  const r16sint: ComponentInfo = { channel: 'r', dataType: sint16 };
  const r16float: ComponentInfo = { channel: 'r', dataType: float16 };
  const g16uint: ComponentInfo = { channel: 'g', dataType: uint16 };
  const g16sint: ComponentInfo = { channel: 'g', dataType: sint16 };
  const g16float: ComponentInfo = { channel: 'g', dataType: float16 };
  const b16uint: ComponentInfo = { channel: 'b', dataType: uint16 };
  const b16sint: ComponentInfo = { channel: 'b', dataType: sint16 };
  const b16float: ComponentInfo = { channel: 'b', dataType: float16 };
  const a16uint: ComponentInfo = { channel: 'a', dataType: uint16 };
  const a16sint: ComponentInfo = { channel: 'a', dataType: sint16 };
  const a16float: ComponentInfo = { channel: 'a', dataType: float16 };
  const r32uint: ComponentInfo = { channel: 'r', dataType: uint32 };
  const r32sint: ComponentInfo = { channel: 'r', dataType: sint32 };
  const r32float: ComponentInfo = { channel: 'r', dataType: float32 };
  const g32uint: ComponentInfo = { channel: 'g', dataType: uint32 };
  const g32sint: ComponentInfo = { channel: 'g', dataType: sint32 };
  const g32float: ComponentInfo = { channel: 'g', dataType: float32 };
  const b32uint: ComponentInfo = { channel: 'b', dataType: uint32 };
  const b32sint: ComponentInfo = { channel: 'b', dataType: sint32 };
  const b32float: ComponentInfo = { channel: 'b', dataType: float32 };
  const a32uint: ComponentInfo = { channel: 'a', dataType: uint32 };
  const a32sint: ComponentInfo = { channel: 'a', dataType: sint32 };
  const a32float: ComponentInfo = { channel: 'a', dataType: float32 };

  const F = (
    textureFormat: GPUTextureFormat,
    components: ComponentInfo[],
    bitsPerTexel: number,
    sampledType: ImageSampledType
  ): ImageFormat => ({ textureFormat, components, bitsPerTexel, sampledType });

  const formats: ImageFormat[] = [
    F('r8unorm', [r8unorm], 8, 'f32'),
    F('r8snorm', [r8snorm], 8, 'f32'),
    F('r8uint', [r8uint], 8, 'u32'),
    F('r8sint', [r8sint], 8, 'i32'),
    F('r16uint', [r16uint], 16, 'u32'),
    F('r16sint', [r16sint], 16, 'i32'),
    F('r16float', [r16float], 16, 'f32'),
    F('rg8unorm', [r8unorm, g8unorm], 16, 'f32'),
    F('rg8snorm', [r8snorm, g8snorm], 16, 'f32'),
    F('rg16uint', [r16uint, g16uint], 32, 'u32'),
    F('rg16sint', [r16sint, g16sint], 32, 'i32'),
    F('r32uint', [r32uint], 32, 'u32'),
    F('r32sint', [r32sint], 32, 'i32'),
    F('r32float', [r32float], 32, 'f32'),
    F('rg32uint', [r32uint, g32uint], 64, 'u32'),
    F('rg32sint', [r32sint, g32sint], 64, 'i32'),
    F('rg32float', [r32float, g32float], 64, 'f32'),
    F('rg16uint', [r16uint, g16uint], 32, 'u32'),
    F('rg16sint', [r16sint, g16sint], 32, 'i32'),
    F('rg16float', [r16float, g16float], 32, 'f32'),
    F('rgba8unorm', [r8unorm, g8unorm, b8unorm, a8unorm], 32, 'f32'),
    F('rgba8unorm-srgb', [r8unormsrgb, g8unormsrgb, b8unormsrgb, a8unorm], 32, 'f32'),
    F('rgba8snorm', [r8snorm, g8snorm, b8snorm, a8snorm], 32, 'f32'),
    F('rgba8uint', [r8uint, g8uint, b8uint, a8uint], 32, 'u32'),
    F('rgba8sint', [r8sint, g8sint, b8sint, a8sint], 32, 'i32'),
    F('bgra8unorm', [b8unorm, g8unorm, r8unorm, a8unorm], 32, 'f32'),
    F('bgra8unorm-srgb', [b8unormsrgb, g8unormsrgb, r8unormsrgb, a8unorm], 32, 'f32'),
    // F('rgb9e5ufloat', [], 0, 'f32'),
    F('rgb10a2unorm', [r10unorm, g10unorm, b10unorm, a2unorm], 32, 'f32'),
    F('rg11b10ufloat', [r11ufloat, g11ufloat, b10ufloat], 32, 'f32'),
    F('rg32uint', [r32uint, g32uint], 64, 'u32'),
    F('rg32sint', [r32sint, g32sint], 64, 'i32'),
    F('rg32float', [r32float, g32float], 64, 'f32'),
    F('rgba16uint', [r16uint, g16uint, b16uint, a16uint], 64, 'u32'),
    F('rgba16sint', [r16sint, g16sint, b16sint, a16sint], 64, 'i32'),
    F('rgba16float', [r16float, g16float, b16float, a16float], 64, 'f32'),
    F('rgba32uint', [r32uint, g32uint, b32uint, a32uint], 128, 'u32'),
    F('rgba32sint', [r32sint, g32sint, b32sint, a32sint], 128, 'i32'),
    F('rgba32float', [r32float, g32float, b32float, a32float], 128, 'f32'),
  ];

  theImageFormats = {
    all: new Map(formats.map(f => [f.textureFormat, f])),
    filterable: new Map(
      formats.filter(f => f.sampledType === 'f32').map(f => [f.textureFormat, f])
    ),
  };
}

interface ImageFormats {
  all: Map<GPUTextureFormat, ImageFormat>;
  filterable: Map<GPUTextureFormat, ImageFormat>;
}

let theImageFormats: undefined | ImageFormats = undefined;

/** Map of all ImageFormats by GPUTextureFormat */
export function imageFormats(): Map<GPUTextureFormat, ImageFormat> {
  if (theImageFormats === undefined) {
    buildImageFormats();
  }
  return (theImageFormats as ImageFormats).all;
}

/** Map of ImageFormats by GPUTextureFormat that can be used by textureSample() */
export function filterableImageFormats() {
  if (theImageFormats === undefined) {
    buildImageFormats();
  }
  return (theImageFormats as ImageFormats).filterable;
}

/** @returns a ImageFormat by GPUTextureFormat */
export function imageFormat(format: GPUTextureFormat) {
  const info = imageFormats().get(format);
  if (info === undefined) {
    throw new Error(`unhandled GPUTextureFormat ${JSON.stringify(format)}`);
  }
  return info;
}

/** ImageInfo describes an image */
export interface ImageInfo {
  /** Width of the image in texels */
  readonly width: number;
  /** Height of the image in texels */
  readonly height: number;
  /** Depth of the image in texels */
  readonly depth: number;
  /** Number of mipmap levels */
  readonly mipLevels: number;
  /** Number of array layers */
  readonly arrayLayers: number;
  /** Number of samples */
  readonly samples: number;
  /** The format if the image */
  readonly format: ImageFormat;
}

export interface DefaultedTexelLocation {
  /** The x-coordinate of the texel */
  x: number;
  /** The y-coordinate of the texel. Defaults to 0. */
  y?: number;
  /** The z-coordinate of the texel. Defaults to 0. */
  z?: number;
  /** The mipmap level of the texel. Defaults to 0. */
  mip?: number;
  /** The array index, or cube face of the texel. Defaults to 0. */
  layer?: number;
  /** The sample index. Defaults to 0. */
  sample?: number;
}

export interface TexelLocation {
  /** The x-coordinate of the texel */
  x: number;
  /** The y-coordinate of the texel. */
  y: number;
  /** The z-coordinate of the texel. */
  z: number;
  /** The mipmap level of the texel. */
  mip: number;
  /** The array index, or cube face of the texel. */
  layer: number;
  /** The sample index. */
  sample: number;
}

/** Texel holds a number of component values */
export interface Texel {
  /** @returns the value of the given channel */
  get(channel: Channel): number;
  /** Sets the value of the given channel */
  set(channel: Channel, value: number): void;
}

/** Image is a structured container for texels */
export interface Image extends ImageInfo {
  /** @returns the texel at the given location */
  at(location: DefaultedTexelLocation): Texel;
}

export function foreachTexelLocation(image: Image, callback: (location: TexelLocation) => void) {
  for (let layer = 0; layer < image.arrayLayers; layer++) {
    for (let mip = 0; mip < image.mipLevels; mip++) {
      for (let z = 0; z < image.depth; z++) {
        for (let y = 0; y < image.height; y++) {
          for (let x = 0; x < image.width; x++) {
            for (let sample = 0; sample < image.samples; sample++) {
              callback({ x, y, z, mip, layer, sample });
            }
          }
        }
      }
    }
  }
}

export function checkImageDimensionsEqual(got: Image, expect: Image): Error | undefined {
  const errs = new Array<Error>();
  for (const property of ['width', 'height', 'depth', 'mipLevels', 'arrayLayers']) {
    const gotProperty = ((got as unknown) as Record<string, number>)[property];
    const expectProperty = ((expect as unknown) as Record<string, number>)[property];
    new Error(`checkImageDimensionsEqual() ${property} was not as expected
  got:        ${gotProperty},
  expect:     ${expectProperty}`);
  }
  if (errs.length > 0) {
    return new Error(errs.map(err => err.message).join('\n'));
  }
  return undefined;
}

export function compareImageTexels(
  got: Image,
  expect: Image,
  threshold: number
): Error | undefined {
  const fn = `compareTexels(got, expect, ${threshold}):`;
  const errs = new Array<Error>();
  {
    // Check the image dimensions are all equal
    const err = checkImageDimensionsEqual(got, expect);
    if (err) {
      errs.push(err);
    }
  }

  const gotComponents = new Map(got.format.components.map(c => [c.channel, c]));
  const expectComponents = new Map(expect.format.components.map(c => [c.channel, c]));
  {
    // Check the both images have the same channels
    const gotMissing = [...expectComponents].filter(c => !gotComponents.has(c[0]));
    if (gotMissing.length > 0) {
      errs.push(
        new Error(
          `${fn} 'got' does not have channels [${gotMissing.map(c => c[0])}] found in 'expect'`
        )
      );
    }
    const expectMissing = [...gotComponents].filter(c => !expectComponents.has(c[0]));
    if (expectMissing.length > 0) {
      errs.push(
        new Error(
          `${fn} 'expect' does not have channels [${expectMissing.map(c => c[0])}] found in 'got'`
        )
      );
    }
  }
  if (errs.length === 1) {
    return errs[0];
  }
  if (errs.length > 0) {
    return new Error(errs.map(err => err.message).join('\n'));
  }

  const components = got.format.components.map(gotComponent => {
    const channel = gotComponent.channel;
    const expectComponent = expectComponents.get(channel) as ComponentInfo;
    return {
      channel,
      normalizeGot: gotComponent.dataType.normalize,
      normalizeExpect: expectComponent.dataType.normalize,
    };
  });

  foreachTexelLocation(got, (location: TexelLocation) => {
    const gotTexel = got.at(location);
    const expectTexel = expect.at(location);
    for (const component of components) {
      const channel = component.channel;
      const g = component.normalizeGot(gotTexel.get(channel));
      const e = component.normalizeExpect(expectTexel.get(channel));
      const difference = Math.abs(g - e);
      if (difference > threshold) {
        errs.push(
          Error(`${fn} texel channel ${channel} difference found at ${JSON.stringify(location)}
got:        ${g},
expect:     ${e}
difference: ${difference}`)
        );
      }
    }
  });

  if (errs.length === 1) {
    return errs[0];
  }
  if (errs.length > 0) {
    return new Error(errs.map(err => err.message).join('\n'));
  }
  return undefined;
}

/** An implementation of Image, where all the components are backed by a f32 value */
class ImageImpl implements Image {
  constructor(info: ImageInfo) {
    assert(info.width > 0 && Number.isInteger(info.width));
    assert(info.height > 0 && Number.isInteger(info.height));
    assert(info.depth > 0 && Number.isInteger(info.depth));
    assert(info.mipLevels > 0 && Number.isInteger(info.mipLevels));
    assert(info.arrayLayers > 0 && Number.isInteger(info.arrayLayers));
    assert(info.samples > 0 && Number.isInteger(info.samples));
    this.info = info;
    this.channelIndices = new Map();
    for (let i = 0; i < info.format.components.length; i++) {
      this.channelIndices.set(info.format.components[i].channel, i);
    }
    this.mipOffsetInTexels = new Array<number>(info.mipLevels);
    this.texelsPerLayer = 0;
    for (let mip = 0; mip < this.mipLevels; mip++) {
      this.mipOffsetInTexels[mip] = this.texelsPerLayer;
      this.texelsPerLayer +=
        (this.width >> mip) * (this.height >> mip) * (this.depth >> mip) * this.samples;
    }
    this.data = new Array(this.texelsPerLayer * this.mipLevels * this.format.components.length);
  }
  public get width(): number {
    return this.info.width;
  }
  public get height(): number {
    return this.info.height;
  }
  public get depth(): number {
    return this.info.depth;
  }
  public get mipLevels(): number {
    return this.info.mipLevels;
  }
  public get arrayLayers(): number {
    return this.info.arrayLayers;
  }
  public get samples(): number {
    return this.info.samples;
  }
  public get format(): ImageFormat {
    return this.info.format;
  }

  public at(location: TexelLocation): Texel {
    const data = this.data;
    const index = (channel: Channel) => {
      const l = this.expandTexelLocation(location);
      let texel = this.texelsPerLayer * l.layer;
      texel += this.mipOffsetInTexels[l.mip];
      texel += l.z * this.width * this.height * this.samples;
      texel += l.y * this.width * this.samples;
      texel += l.x * this.samples;
      return texel * this.format.components.length + this.channelIndex(channel);
    };
    return {
      set: (channel: Channel, value: number) => {
        data[index(channel)] = value;
      },
      get: (channel: Channel) => data[index(channel)],
    };
  }

  /**
   * Validates that all the provided values in the texel location are valid.
   * @returns a structure holding a default-populated TexelLocation
   */
  protected expandTexelLocation(l: DefaultedTexelLocation): TexelLocation {
    const x = l.x;
    assert(Number.isInteger(x) && x >= 0 && x < this.width, `invalid TexelLocation.x: ${x}`);
    const y = l.y ? Math.floor(l.y) : 0;
    assert(Number.isInteger(y) && y >= 0 && y < this.height, `invalid TexelLocation.y: ${y}`);
    const z = l.z ? Math.floor(l.z) : 0;
    assert(Number.isInteger(z) && z >= 0 && z < this.depth, `invalid TexelLocation.z: ${z}`);
    const mip = l.mip ? Math.floor(l.mip) : 0;
    assert(
      Number.isInteger(mip) && mip >= 0 && mip < this.mipLevels,
      `invalid TexelLocation.mip: ${mip}`
    );
    const sample = l.sample ? l.sample : 0;
    assert(
      Number.isInteger(sample) && sample >= 0 && sample < this.samples,
      `invalid TexelLocation.sample: ${sample}`
    );
    const layer = l.layer ? l.layer : 0;
    assert(
      Number.isInteger(layer) && layer >= 0 && layer < this.arrayLayers,
      `invalid TexelLocation.layer: ${layer}`
    );
    return { x, y, z, mip, sample, layer };
  }

  /** @returns the index of the given channel */
  protected channelIndex(c: Channel): number {
    const idx = this.channelIndices.get(c);
    assert(idx !== undefined);
    return idx;
  }

  private info: ImageInfo;
  private channelIndices: Map<Channel, number>;
  private mipOffsetInTexels: number[];
  private texelsPerLayer: number;
  private data: Array<number>;
}

export function createImage(info: ImageInfo): Image {
  return new ImageImpl(info);
}

export function fillImageWithRandomTexels(image: Image): Image {
  foreachTexelLocation(image, location => {
    const texel = image.at(location);
    for (const component of image.format.components) {
      const rnd = hashU32s(
        location.x,
        location.y,
        location.z,
        location.mip,
        location.layer,
        location.sample,
        component.channel.charCodeAt(0)
      );
      const normalized = clamp(rnd / 0xffffffff, { min: 0, max: 1 });
      const unquantized = lerp(component.dataType.lowest, component.dataType.highest, normalized);
      const quantized = component.dataType.quantize(unquantized);
      texel.set(component.channel, quantized);
    }
  });
  return image;
}

export interface Texture {
  /** The GPUTexture object */
  gpu: GPUTexture;
  /** The image used to construct the texture */
  image: Image;
  /** The WGSL type to use for this texture */
  wgslType: string;
}

/** @returns a Texture built from the given Image */
function createTexture(device: GPUDevice, image: Image): Texture {
  const texture = device.createTexture({
    format: image.format.textureFormat,
    size: { width: image.width, height: image.height },
    mipLevelCount: image.mipLevels,
    sampleCount: image.samples,
    usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING,
  });

  const mips = new Array<Uint8Array>();
  for (let mip = 0; mip < image.mipLevels; mip++) {
    const mipWidth = image.width >> mip;
    const mipHeight = image.height >> mip;
    const mipDepth = image.depth >> mip;
    const mipStrideInBits = align(mipWidth * image.format.bitsPerTexel, 64);
    const mipSizeInBits = mipDepth * mipHeight * mipStrideInBits;
    const mipData = new Uint8Array(mipSizeInBits / 8);

    for (let z = 0; z < image.depth; z++) {
      const zOffsetInBits = z * mipHeight * mipStrideInBits;
      for (let y = 0; y < image.height; y++) {
        const yOffsetInBits = zOffsetInBits + y * mipStrideInBits;
        let bitOffset = yOffsetInBits;
        for (let x = 0; x < image.width; x++) {
          for (let sample = 0; sample < image.samples; sample++) {
            const texel = image.at({ x, y, z, sample });
            for (const component of image.format.components) {
              const value = texel.get(component.channel);
              component.dataType.encode(value, mipData.buffer, bitOffset);
              bitOffset += component.dataType.bits;
            }
          }
        }
      }
    }

    device.queue.writeTexture(
      { texture, mipLevel: mip },
      mipData,
      { bytesPerRow: mipStrideInBits / 8 },
      { width: mipWidth, height: mipHeight }
    );
    mips.push(mipData);
  }
  return {
    gpu: texture,
    image,
    wgslType: `texture_2d<${image.format.sampledType}>`,
  };
}

export type vec2 = [number, number];
export type vec3 = [number, number, number];
export type vec4 = [number, number, number, number];
export type TextureCoordinate = number | vec2 | vec3;

export interface TextureArgs<T extends TextureCoordinate> {
  coords?: T;
  mipLevel?: number;
  arrayIndex?: number;
  ddx?: T;
  ddy?: T;
}

export interface TextureCall<T extends TextureCoordinate> {
  op: string;
  coordType: 'f';
  offset?: T;
  args: TextureArgs<T>[];
}

function wgslTypeFor(data: TextureCoordinate, type: 'f' | 'i' | 'u'): string {
  if (data instanceof Array) {
    switch (data.length) {
      case 2:
        return `vec2${type}`;
      case 3:
        return `vec3${type}`;
    }
  }
  return '${type}32';
}

function wgslExpr(data: TextureCoordinate): string {
  if (data instanceof Array) {
    switch (data.length) {
      case 2:
        return `vec2(${data.map(v => v.toString()).join(', ')})`;
      case 3:
        return `vec3(${data.map(v => v.toString()).join(', ')})`;
    }
  }
  return data.toString();
}

export async function useImageInFragmentShader<T extends TextureCoordinate>(
  device: GPUDevice,
  image: Image,
  call: TextureCall<T>
) {
  const opArgs: string[] = ['T']; // All texture builtins take the texture as the first argument
  const fields: string[] = [];

  if (call.op.startsWith('textureSample')) {
    // textureSample*() builtins take a sampler as the second argument
    opArgs.push('S');
  }

  assert(call.args.length > 0, 'TextureCall.args must have at least one element');
  const has = {
    coords: call.args[0].coords !== undefined,
    mipLevel: call.args[0].mipLevel !== undefined,
    ddx: call.args[0].ddx !== undefined,
    ddy: call.args[0].ddy !== undefined,
  };

  if (has.coords) {
    opArgs.push('args.coords');
    fields.push(`coords : ${wgslTypeFor(call.args[0].coords!, call.coordType)}`);
  }
  if (has.mipLevel) {
    opArgs.push('args.mipLevel');
    fields.push('mipLevel : u32');
  }
  if (has.ddx) {
    opArgs.push('args.ddx');
    fields.push(`ddx : ${wgslTypeFor(call.args[0].ddx!, call.coordType)}`);
  }
  if (has.ddy) {
    opArgs.push('args.ddy');
    fields.push(`ddy : ${wgslTypeFor(call.args[0].ddy!, call.coordType)}`);
  }

  const data: number[] = [];
  const bitcastToU32 = (value: number) => {
    if (call.coordType === 'f') {
      return float32ToUint32(value);
    }
    return value;
  };
  const pushData = (coord: number | number[]) => {
    if (coord instanceof Array) {
      for (const c of coord) {
        data.push(bitcastToU32(c));
      }
    } else {
      data.push(bitcastToU32(coord));
    }
    // All fields are aligned to 16 bytes.
    while ((data.length & 3) !== 0) {
      data.push(0);
    }
  };
  for (const arg of call.args) {
    for (const key of keysOf(has)) {
      assert(
        has[key] === (arg[key] !== undefined),
        `'${key}' must be omitted or present in all args`
      );
    }
    if (has.coords) {
      pushData(arg.coords!);
    }
    if (has.ddx) {
      pushData(arg.ddx!);
    }
    if (has.ddy) {
      pushData(arg.ddy!);
    }
  }
  if (call.offset !== undefined) {
    opArgs.push(`/* offset */ ${wgslExpr(call.offset)}`);
  }

  const dataBuffer = device.createBuffer({
    size: data.length * 4,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.STORAGE,
  });
  device.queue.writeBuffer(dataBuffer, 0, new Uint32Array(data));

  const texture = createTexture(device, image);

  const renderTarget = device.createTexture({
    format: 'rgba32float',
    size: { width: texture.gpu.width, height: texture.gpu.height },
    usage: GPUTextureUsage.COPY_SRC | GPUTextureUsage.RENDER_ATTACHMENT,
  });

  const shaderModule = device.createShaderModule({
    code: `
struct Data {
  ${fields.map(f => `@align(16) ${f},`).join('  \n')}
};

@vertex
fn vs_main(@builtin(vertex_index) vertex_index : u32) -> @builtin(position) vec4f {
  let positions = array(
    vec4f(-1,  1, 0, 1), vec4f( 1,  1, 0, 1),
    vec4f(-1, -1, 0, 1), vec4f( 1, -1, 0, 1),
  );
  return positions[vertex_index];
}

@group(0) @binding(0) var          T : ${texture.wgslType};
@group(0) @binding(1) var          S : sampler;
@group(0) @binding(2) var<storage> D : array<Data>;

@fragment
fn fs_main(@builtin(position) frag_pos : vec4f) -> @location(0) vec4f {
  let frag_idx = u32(frag_pos.x) + u32(frag_pos.y) * ${renderTarget.width};
  let args = D[frag_idx];
  return ${call.op}(${opArgs.join(', ')});
}
`,
  });

  const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: { module: shaderModule, entryPoint: 'vs_main' },
    fragment: {
      module: shaderModule,
      entryPoint: 'fs_main',
      targets: [{ format: renderTarget.format }],
    },
    primitive: { topology: 'triangle-strip', cullMode: 'none' },
  });

  const sampler = device.createSampler({
    addressModeU: 'clamp-to-edge',
    addressModeV: 'clamp-to-edge',
  });

  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: texture.gpu.createView() },
      { binding: 1, resource: sampler },
      { binding: 2, resource: { buffer: dataBuffer } },
    ],
  });

  const bytesPerRow = align(16 * renderTarget.width, 256);
  const resultBuffer = device.createBuffer({
    size: renderTarget.height * bytesPerRow,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  });
  const encoder = device.createCommandEncoder();

  const renderPass = encoder.beginRenderPass({
    colorAttachments: [{ view: renderTarget.createView(), loadOp: 'clear', storeOp: 'store' }],
  });

  renderPass.setPipeline(pipeline);
  renderPass.setBindGroup(0, bindGroup);
  renderPass.draw(4);
  renderPass.end();
  encoder.copyTextureToBuffer(
    { texture: renderTarget },
    { buffer: resultBuffer, bytesPerRow },
    { width: renderTarget.width, height: renderTarget.height }
  );
  device.queue.submit([encoder.finish()]);

  await resultBuffer.mapAsync(GPUMapMode.READ);

  // Build a custom image format with input texel component data type replaced with float32
  const outputFormat: ImageFormat = {
    textureFormat: '<none>' as GPUTextureFormat,
    components: texture.image.format.components.map(c => ({
      channel: c.channel,
      dataType: float32,
    })),
    bitsPerTexel: texture.image.format.components.length * 32,
    sampledType: 'f32',
  };

  const output = createImage({
    format: outputFormat,
    width: renderTarget.width,
    height: renderTarget.height,
    depth: 1,
    mipLevels: 1,
    arrayLayers: 1,
    samples: 1,
  });
  const results = new Float32Array(resultBuffer.getMappedRange());
  for (let y = 0; y < renderTarget.height; y++) {
    const srcRowBase = (y * bytesPerRow) / 4;
    for (let x = 0; x < renderTarget.width; x++) {
      const srcBase = srcRowBase + x * 4;
      const texel = output.at({ x, y });
      for (const component of outputFormat.components) {
        switch (component.channel) {
          case 'r':
            texel.set('r', results[srcBase + 0]);
            break;
          case 'g':
            texel.set('g', results[srcBase + 1]);
            break;
          case 'b':
            texel.set('b', results[srcBase + 2]);
            break;
          case 'a':
            texel.set('a', results[srcBase + 3]);
            break;
        }
      }
    }
  }
  return output;
}
