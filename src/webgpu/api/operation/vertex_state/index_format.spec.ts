export const description = `
Test indexing, index format and primitive restart.
`;

import { makeTestGroup } from '../../../../common/framework/test_group.js';
import { GPUTest } from '../../../gpu_test.js';
import { getTextureCopyLayout } from '../../../util/texture/layout.js';

const kHeight = 4;
const kWidth = 8;
const kTextureFormat = 'r8uint' as const;

/** 4x4 grid of r8uint values (each 0 or 1). */
type Raster8x4 = readonly [
  readonly [0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1],
  readonly [0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1],
  readonly [0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1],
  readonly [0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1]
];

/** Expected 4x4 rasterization of a bottom-left triangle. */
const kBottomLeftTriangle: Raster8x4 = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 1, 0, 0, 0],
  [0, 0, 0, 0, 1, 1, 0, 0],
  [0, 0, 0, 0, 1, 1, 1, 0],
];

/** Expected 4x4 rasterization filling the whole quad. */
const kSquare: Raster8x4 = [
  [0, 0, 0, 0, 1, 1, 1, 1],
  [0, 0, 0, 0, 1, 1, 1, 1],
  [0, 0, 0, 0, 1, 1, 1, 1],
  [0, 0, 0, 0, 1, 1, 1, 1],
];

/** Expected 4x4 rasterization with no pixels. */
const kNothing: Raster8x4 = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

const { byteLength, bytesPerRow, rowsPerImage } = getTextureCopyLayout(kTextureFormat, '2d', [
  kWidth,
  kHeight,
  1,
]);

class IndexFormatTest extends GPUTest {
  MakeRenderPipeline(
    topology: GPUPrimitiveTopology,
    stripIndexFormat?: GPUIndexFormat
  ): GPURenderPipeline {
    const vertexModule = this.device.createShaderModule({
      // TODO?: These positions will create triangles that cut right through pixel centers. If this
      // results in different rasterization results on different hardware, tweak to avoid this.
      code: `
        let pos: array<vec2<f32>, 4> = array<vec2<f32>, 4>(
          vec2<f32>(0.01,  0.98),
          vec2<f32>(0.99, -0.98),
          vec2<f32>(0.99,  0.98),
          vec2<f32>(0.01, -0.98));

        [[stage(vertex)]]
        fn main([[builtin(vertex_index)]] VertexIndex : u32)
             -> [[builtin(position)]] vec4<f32> {
          var Position : vec4<f32>;
          if (VertexIndex == 0xFFFFu || VertexIndex == 0xFFFFFFFFu) {
            Position = vec4<f32>(-0.99, -0.98, 0.0, 1.0);
          } else {
            Position = vec4<f32>(pos[VertexIndex], 0.0, 1.0);
          }
          return Position;
        }
      `,
    });

    const fragmentModule = this.device.createShaderModule({
      code: `
        [[stage(fragment)]]
        fn main() -> [[location(0)]] u32 {
          return 1u;
        }
      `,
    });

    return this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({ bindGroupLayouts: [] }),
      vertex: { module: vertexModule, entryPoint: 'main' },
      fragment: {
        module: fragmentModule,
        entryPoint: 'main',
        targets: [{ format: kTextureFormat }],
      },
      primitive: {
        topology,
        stripIndexFormat,
      },
    });
  }

  CreateIndexBuffer(indices: readonly number[], indexFormat: GPUIndexFormat): GPUBuffer {
    const typedArrayConstructor = { uint16: Uint16Array, uint32: Uint32Array }[indexFormat];

    const indexBuffer = this.device.createBuffer({
      size: indices.length * typedArrayConstructor.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.INDEX,
      mappedAtCreation: true,
    });

    new typedArrayConstructor(indexBuffer.getMappedRange()).set(indices);

    indexBuffer.unmap();
    return indexBuffer;
  }

  run(
    indexBuffer: GPUBuffer,
    indexCount: number,
    indexFormat: GPUIndexFormat,
    indexOffset: number = 0,
    primitiveTopology: GPUPrimitiveTopology = 'triangle-list'
  ): GPUBuffer {
    let pipeline: GPURenderPipeline;
    // The indexFormat must be set in render pipeline descriptor that specifys a strip primitive
    // topology for primitive restart testing
    if (primitiveTopology === 'line-strip' || primitiveTopology === 'triangle-strip') {
      pipeline = this.MakeRenderPipeline(primitiveTopology, indexFormat);
    } else {
      pipeline = this.MakeRenderPipeline(primitiveTopology);
    }

    const colorAttachment = this.device.createTexture({
      format: kTextureFormat,
      size: { width: kWidth, height: kHeight, depthOrArrayLayers: 1 },
      usage: GPUTextureUsage.COPY_SRC | GPUTextureUsage.RENDER_ATTACHMENT,
    });

    const result = this.device.createBuffer({
      size: byteLength,
      usage: GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
    });

    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        { view: colorAttachment.createView(), loadValue: [0, 0, 0, 0], storeOp: 'store' },
      ],
    });
    pass.setPipeline(pipeline);
    pass.setIndexBuffer(indexBuffer, indexFormat, indexOffset);
    pass.drawIndexed(indexCount);
    pass.endPass();
    encoder.copyTextureToBuffer(
      { texture: colorAttachment },
      { buffer: result, bytesPerRow, rowsPerImage },
      [kWidth, kHeight]
    );
    this.device.queue.submit([encoder.finish()]);

    return result;
  }

  CreateExpectedUint8Array(renderShape: Raster8x4): Uint8Array {
    const arrayBuffer = new Uint8Array(byteLength);
    for (let row = 0; row < renderShape.length; row++) {
      for (let col = 0; col < renderShape[row].length; col++) {
        const texel: 0 | 1 = renderShape[row][col];

        const kBytesPerTexel = 1; // r8uint
        const byteOffset = row * bytesPerRow + col * kBytesPerTexel;
        arrayBuffer[byteOffset] = texel;
      }
    }
    return arrayBuffer;
  }
}

export const g = makeTestGroup(IndexFormatTest);

g.test('index_format,uint16')
  .desc('Test rendering result of indexed draw with index format of uint16.')
  .paramsSubcasesOnly([
    { indexOffset: 0, _expectedShape: kSquare },
    { indexOffset: 6, _expectedShape: kBottomLeftTriangle },
    { indexOffset: 18, _expectedShape: kNothing },
  ])
  .fn(t => {
    const { indexOffset, _expectedShape } = t.params;

    // If this is written as uint16 but interpreted as uint32, it will have index 1 and 2 be both 0
    // and render nothing.
    // And the index buffer size - offset must be not less than the size required by triangle
    // list, otherwise it also render nothing.
    const indices: number[] = [1, 2, 0, 0, 0, 0, 0, 1, 3, 0];
    const indexBuffer = t.CreateIndexBuffer(indices, 'uint16');
    const result = t.run(indexBuffer, indices.length, 'uint16', indexOffset);

    const expectedTextureValues = t.CreateExpectedUint8Array(_expectedShape);
    t.expectContents(result, expectedTextureValues);
  });

g.test('index_format,uint32')
  .desc('Test rendering result of indexed draw with index format of uint32.')
  .paramsSubcasesOnly([
    { indexOffset: 0, _expectedShape: kSquare },
    { indexOffset: 12, _expectedShape: kBottomLeftTriangle },
    { indexOffset: 36, _expectedShape: kNothing },
  ])
  .fn(t => {
    const { indexOffset, _expectedShape } = t.params;

    // If this is interpreted as uint16, then it would be 0, 1, 0, ... and would draw nothing.
    // And the index buffer size - offset must be not less than the size required by triangle
    // list, otherwise it also render nothing.
    const indices: number[] = [1, 2, 0, 0, 0, 0, 0, 1, 3, 0];
    const indexBuffer = t.CreateIndexBuffer(indices, 'uint32');
    const result = t.run(indexBuffer, indices.length, 'uint32', indexOffset);

    const expectedTextureValues = t.CreateExpectedUint8Array(_expectedShape);
    t.expectContents(result, expectedTextureValues);
  });

g.test('primitive_restart')
  .desc(
    `
Test primitive restart with each primitive topology.

Primitive restart should be always active with strip primitive topologies
('line-strip' or 'triangle-strip') and never active for other topologies, where
the primitive restart value isn't special and should be treated as a regular index value.

The value -1 gets uploaded as 0xFFFF or 0xFFFF_FFFF according to the format.

The positions of these points are embedded in the shader above, and look like this:
  |   0  2|
  |       |
  -1  3  1|

Below are the indices lists used for each test, and the expected rendering result of each
(approximately, in the case of incorrect results). This shows the expected result (marked '->')
is different from what you would get if the topology were incorrect.

- primitiveTopology: triangle-list
  indices: [0, 1, 3, -1, 2, 1, 0, 0],
   -> triangle-list:              (0, 1, 3), (-1, 2, 1)
        |    #  #|
        |    ####|
        |   #####|
        | #######|
      triangle-list with restart: (0, 1, 3), (2, 1, 0)
      triangle-strip:             (0, 1, 3), (2, 1, 0), (1, 0, 0)
        |    ####|
        |    ####|
        |    ####|
        |    ####|
      triangle-strip w/o restart: (0, 1, 3), (1, 3, -1), (3, -1, 2), (-1, 2, 1), (2, 1, 0), (1, 0, 0)
        |    ####|
        |    ####|
        |   #####|
        | #######|

- primitiveTopology: triangle-strip
  indices: [3, 1, 0, -1, 2, 2, 1, 3],
   -> triangle-strip:             (3, 1, 0), (2, 2, 1), (2, 1, 3)
        |    #  #|
        |    ####|
        |    ####|
        |    ####|
      triangle-strip w/o restart: (3, 1, 0), (1, 0, -1), (0, -1, 2), (2, 2, 1), (2, 3, 1)
        |    ####|
        |   #####|
        |  ######|
        | #######|
      triangle-list:              (3, 1, 0), (-1, 2, 2)
      triangle-list with restart: (3, 1, 0), (2, 2, 1)
        |        |
        |    #   |
        |    ##  |
        |    ### |

- primitiveTopology: point, line-list, line-strip:
  indices: [0, 1, -1, 2, -1, 2, 3, 0],
   -> point-list:             (0), (1), (-1), (2), (3), (0)
        |    #  #|
        |        |
        |        |
        |#   #  #|
      point-list with restart (0), (1), (2), (3), (0)
        |    #  #|
        |        |
        |        |
        |    #  #|
   -> line-list:              (0, 1), (-1, 2), (3, 0)
        |    # ##|
        |    ##  |
        |  ### # |
        |##  #  #|
      line-list with restart: (0, 1), (2, 3)
        |    #  #|
        |     ## |
        |     ## |
        |    #  #|
   -> line-strip:             (0, 1), (2, 3), (3, 0)
        |    #  #|
        |    ### |
        |    ### |
        |    #  #|
      line-strip w/o restart: (0, 1), (1, -1), (-1, 2), (2, 3), (3, 3)
        |    # ##|
        |    ### |
        |  ## ## |
        |########|
`
  )
  .params(u =>
    u //
      .combine('indexFormat', ['uint16', 'uint32'] as const)
      .combineWithParams([
        {
          primitiveTopology: 'point-list',
          _indices: [0, 1, -1, 2, 3, 0],
          _expectedShape: [
            [0, 0, 0, 0, 1, 0, 0, 1],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [1, 0, 0, 0, 1, 0, 0, 1],
          ],
        },
        {
          primitiveTopology: 'line-list',
          _indices: [0, 1, -1, 2, 3, 0],
          _expectedShape: [
            [0, 0, 0, 0, 1, 0, 1, 1],
            [0, 0, 0, 0, 1, 1, 0, 0],
            [0, 0, 1, 1, 1, 0, 1, 0],
            [1, 1, 0, 0, 1, 0, 0, 1],
          ],
        },
        {
          primitiveTopology: 'line-strip',
          _indices: [0, 1, -1, 2, 3, 0],
          _expectedShape: [
            [0, 0, 0, 0, 1, 0, 0, 1],
            [0, 0, 0, 0, 1, 1, 1, 0],
            [0, 0, 0, 0, 1, 1, 1, 0],
            [0, 0, 0, 0, 1, 0, 0, 1],
          ],
        },
        {
          primitiveTopology: 'triangle-list',
          _indices: [0, 1, 3, -1, 2, 1, 0, 0],
          _expectedShape: [
            [0, 0, 0, 0, 0, 0, 0, 1],
            [0, 0, 0, 0, 1, 1, 1, 1],
            [0, 0, 0, 1, 1, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 1, 1],
          ],
        },
        {
          primitiveTopology: 'triangle-strip',
          _indices: [3, 1, 0, -1, 2, 2, 1, 3],
          _expectedShape: [
            [0, 0, 0, 0, 0, 0, 0, 1],
            [0, 0, 0, 0, 1, 0, 1, 1],
            [0, 0, 0, 0, 1, 1, 1, 1],
            [0, 0, 0, 0, 1, 1, 1, 1],
          ],
        },
      ] as const)
  )
  .fn(t => {
    const { indexFormat, primitiveTopology, _indices, _expectedShape } = t.params;

    const indexBuffer = t.CreateIndexBuffer(_indices, indexFormat);
    const result = t.run(indexBuffer, _indices.length, indexFormat, 0, primitiveTopology);

    const expectedTextureValues = t.CreateExpectedUint8Array(_expectedShape);
    t.expectContents(result, expectedTextureValues);
  });
