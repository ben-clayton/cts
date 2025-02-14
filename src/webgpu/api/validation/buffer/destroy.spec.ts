export const description = `
Destroying a buffer more than once is allowed.
`;

import { makeTestGroup } from '../../../../common/framework/test_group.js';
import { GPUConst } from '../../../constants.js';
import { ValidationTest } from '../validation_test.js';

export const g = makeTestGroup(ValidationTest);

g.test('twice')
  .desc('Tests various mapping-related descripton options that could affect how state is tracked.')
  .paramsSubcasesOnly(u =>
    u //
      .combine('mappedAtCreation', [false, true])
      .combineWithParams([
        { size: 4, usage: GPUConst.BufferUsage.COPY_SRC },
        { size: 4, usage: GPUConst.BufferUsage.MAP_WRITE | GPUConst.BufferUsage.COPY_SRC },
        { size: 4, usage: GPUConst.BufferUsage.COPY_DST | GPUConst.BufferUsage.MAP_READ },
      ])
  )
  .fn(async t => {
    const buf = t.device.createBuffer(t.params);

    buf.destroy();
    buf.destroy();
  });

g.test('while_mapped')
  .desc(
    `Test destroying a {mappable, unmappable mapAtCreation, mappable mapAtCreation} buffer while it
is {mapped, mapped at creation}`
  )
  .unimplemented();
