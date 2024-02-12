export const description = `
Execution tests for the 'textureDimension' builtin function

The dimensions of the texture in texels.
For textures based on cubes, the results are the dimensions of each face of the cube.
Cube faces are square, so the x and y components of the result are equal.
If level is outside the range [0, textureNumLevels(t)) then any valid value for the return type may be returned.
`;

import { makeTestGroup } from '../../../../../../common/framework/test_group.js';
import { kAllTextureFormats, kTextureFormatInfo } from '../../../../../format_info.js';
import { GPUTest } from '../../../../../gpu_test.js';

export const g = makeTestGroup(GPUTest);

g.test('sampled')
  .specURL('https://www.w3.org/TR/WGSL/#texturedimensions')
  .desc(
    `
T: f32, i32, u32

fn textureDimensions(t: texture_1d<T>) -> u32
fn textureDimensions(t: texture_1d<T>, level: u32) -> u32
fn textureDimensions(t: texture_2d<T>) -> vec2<u32>
fn textureDimensions(t: texture_2d<T>, level: u32) -> vec2<u32>
fn textureDimensions(t: texture_2d_array<T>) -> vec2<u32>
fn textureDimensions(t: texture_2d_array<T>, level: u32) -> vec2<u32>
fn textureDimensions(t: texture_3d<T>) -> vec3<u32>
fn textureDimensions(t: texture_3d<T>, level: u32) -> vec3<u32>
fn textureDimensions(t: texture_cube<T>) -> vec2<u32>
fn textureDimensions(t: texture_cube<T>, level: u32) -> vec2<u32>
fn textureDimensions(t: texture_cube_array<T>) -> vec2<u32>
fn textureDimensions(t: texture_cube_array<T>, level: u32) -> vec2<u32>
fn textureDimensions(t: texture_multisampled_2d<T>)-> vec2<u32>

Parameters:
 * t: the sampled texture
 * level:
   - The mip level, with level 0 containing a full size version of the texture.
   - If omitted, the dimensions of level 0 are returned.
`
  ).params(u =>
    u
      .combine('format', kAllTextureFormats)
      .combine('dimensions', [[8, 8], [16, 8], [8, 32]] as const)
  )
  .fn(t => {
    const formatInfo = kTextureFormatInfo[t.params.format];
    const texture = t.device.createTexture({
      size: t.params.dimensions,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
      format: t.params.format,
    });
    // TODO: Add tests for texture views
    const textureView = texture.createView();
    const wgsl = `
@group(0) @binding(0) var texture : texture_2d<${formatInfo.sampleType}>;
@group(0) @binding(1) var output : vec${t.params.dimensions.length}u;

@compute @workgroup_size(1)
fn main() {
  output = textureDimensions(texture);
}
`;
    const module = t.device.createShaderModule({
      code: wgsl,
    });
    const pipeline = t.device.createComputePipeline({
      compute: { module },
      layout: 'auto',
    });
    const outputBuffer = t.device.createBuffer({
      size: 32,
      usage: GPUBufferUsage.COPY_SRC | GPUBufferUsage.STORAGE,
    });
    const bindgroup = t.device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: outputBuffer } },
        { binding: 1, resource: textureView },
      ],
    });
    const encoder = t.device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindgroup);
    pass.dispatchWorkgroups(1);
    pass.end();
    t.device.queue.submit([encoder.finish()]);

    t.expectGPUBufferValuesEqual(outputBuffer, new Uint32Array(t.params.dimensions));
  });

g.test('depth')
  .specURL('https://www.w3.org/TR/WGSL/#texturedimensions')
  .desc(
    `
fn textureDimensions(t: texture_depth_2d) -> vec2<u32>
fn textureDimensions(t: texture_depth_2d, level: u32) -> vec2<u32>
fn textureDimensions(t: texture_depth_2d_array) -> vec2<u32>
fn textureDimensions(t: texture_depth_2d_array, level: u32) -> vec2<u32>
fn textureDimensions(t: texture_depth_cube) -> vec2<u32>
fn textureDimensions(t: texture_depth_cube, level: u32) -> vec2<u32>
fn textureDimensions(t: texture_depth_cube_array) -> vec2<u32>
fn textureDimensions(t: texture_depth_cube_array, level: u32) -> vec2<u32>
fn textureDimensions(t: texture_depth_multisampled_2d)-> vec2<u32>

Parameters:
 * t: the depth or multisampled texture
 * level:
   - The mip level, with level 0 containing a full size version of the texture.
   - If omitted, the dimensions of level 0 are returned.
`
  )
  .params(u =>
    u
      .combine('texture_type', [
        'texture_depth_2d',
        'texture_depth_2d_array',
        'texture_depth_cube',
        'texture_depth_cube_array',
        'texture_depth_multisampled_2d',
      ])
      .beginSubcases()
      .combine('level', [undefined, 0, 1, 'textureNumLevels', 'textureNumLevels+1'] as const)
  )
  .unimplemented();

g.test('storage')
  .specURL('https://www.w3.org/TR/WGSL/#texturedimensions')
  .desc(
    `
F: rgba8unorm
   rgba8snorm
   rgba8uint
   rgba8sint
   rgba16uint
   rgba16sint
   rgba16float
   r32uint
   r32sint
   r32float
   rg32uint
   rg32sint
   rg32float
   rgba32uint
   rgba32sint
   rgba32float
A: read, write, read_write

fn textureDimensions(t: texture_storage_1d<F,A>) -> u32
fn textureDimensions(t: texture_storage_2d<F,A>) -> vec2<u32>
fn textureDimensions(t: texture_storage_2d_array<F,A>) -> vec2<u32>
fn textureDimensions(t: texture_storage_3d<F,A>) -> vec3<u32>

Parameters:
 * t: the storage texture
`
  )
  .params(u =>
    u
      .combine('texel_format', [
        'rgba8unorm',
        'rgba8snorm',
        'rgba8uint',
        'rgba8sint',
        'rgba16uint',
        'rgba16sint',
        'rgba16float',
        'r32uint',
        'r32sint',
        'r32float',
        'rg32uint',
        'rg32sint',
        'rg32float',
        'rgba32uint',
        'rgba32sint',
        'rgba32float',
      ] as const)
      .beginSubcases()
      .combine('access_mode', ['read', 'write', 'read_write'] as const)
  )
  .unimplemented();

g.test('external')
  .specURL('https://www.w3.org/TR/WGSL/#texturedimensions')
  .desc(
    `
fn textureDimensions(t: texture_external) -> vec2<u32>

Parameters:
 * t: the external texture
`
  )
  .unimplemented();
