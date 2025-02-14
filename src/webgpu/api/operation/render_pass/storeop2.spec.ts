export const description = `
renderPass store op test that drawn quad is either stored or cleared based on storeop

TODO: is this duplicated with api,operation,render_pass,storeOp?
`;

import { makeTestGroup } from '../../../../common/framework/test_group.js';
import { GPUTest } from '../../../gpu_test.js';

export const g = makeTestGroup(GPUTest);

g.test('storeOp_controls_whether_1x1_drawn_quad_is_stored')
  .paramsSimple([
    { storeOp: 'store', _expected: 1 }, //
    { storeOp: 'clear', _expected: 0 },
  ] as const)
  .fn(async t => {
    const renderTexture = t.device.createTexture({
      size: { width: 1, height: 1, depthOrArrayLayers: 1 },
      format: 'r8unorm',
      usage: GPUTextureUsage.COPY_SRC | GPUTextureUsage.RENDER_ATTACHMENT,
    });

    // create render pipeline
    const renderPipeline = t.device.createRenderPipeline({
      vertex: {
        module: t.device.createShaderModule({
          code: `
            [[stage(vertex)]] fn main(
              [[builtin(vertex_index)]] VertexIndex : i32
              ) -> [[builtin(position)]] vec4<f32> {
              let pos : array<vec2<f32>, 3> = array<vec2<f32>, 3>(
                  vec2<f32>( 1.0, -1.0),
                  vec2<f32>( 1.0,  1.0),
                  vec2<f32>(-1.0,  1.0));
              return vec4<f32>(pos[VertexIndex], 0.0, 1.0);
            }
            `,
        }),
        entryPoint: 'main',
      },
      fragment: {
        module: t.device.createShaderModule({
          code: `
            [[stage(fragment)]] fn main() -> [[location(0)]] vec4<f32> {
              return vec4<f32>(1.0, 0.0, 0.0, 1.0);
            }
            `,
        }),
        entryPoint: 'main',
        targets: [{ format: 'r8unorm' }],
      },
      primitive: { topology: 'triangle-list' },
    });

    // encode pass and submit
    const encoder = t.device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: renderTexture.createView(),
          storeOp: t.params.storeOp,
          loadValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 },
        },
      ],
    });
    pass.setPipeline(renderPipeline);
    pass.draw(3);
    pass.endPass();
    t.device.queue.submit([encoder.finish()]);

    // expect the buffer to be clear
    t.expectSingleColor(renderTexture, 'r8unorm', {
      size: [1, 1, 1],
      exp: { R: t.params._expected },
    });
  });
