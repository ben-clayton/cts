export const description = `Shader module reflection view tests`;

import { makeTestGroup } from '../../../common/framework/test_group.js';
import { keysOf } from '../../../common/util/data_tables.js';
import { iterRange } from '../../../common/util/util.js';
import { GPUTest } from '../../gpu_test.js';
import { checkElementsEqual } from '../../util/check_contents.js';
import { checkDeepEqual } from '../../util/deep_compare.js';

import { compileAndGetBinding, kWgslScalarTypeInfo, kWgslScalarTypeNames } from './harness.js';
import { WGSLSizedType } from './wgsl_types.js';

export const g = makeTestGroup(GPUTest);

g.test('scalar')
  .desc(`TODO`)
  .params(u =>
    u
      .combine('type', keysOf(kWgslScalarTypeInfo)) //
      .combine('offset', [undefined, 0, 4, 12])
  )
  .fn(async t => {
    const wgsl = `
@binding(10) @group(20) var<storage> VARIABLE : ${t.params.type};
@compute @workgroup_size(1)
fn main() {
_ = VARIABLE;
}
`;
    const binding = await compileAndGetBinding(t, wgsl, 20, 10);
    if (binding === undefined) {
      return;
    }

    const value = 42;

    const typeInfo = kWgslScalarTypeInfo[t.params.type];

    const buffer = new typeInfo.array(8);

    const view = (binding.type as WGSLSizedType).createView({
      buffer: buffer.buffer,
      offset: t.params.offset,
    });
    view.set(value);

    const expected = new typeInfo.array(8);
    expected[(t.params.offset ?? 0) / typeInfo.size] = value;

    t.expectOK(checkElementsEqual(buffer, expected));
    t.expectDeepEqual('view.get()', view.get(), value);
  });

g.test('atomic')
  .desc(`TODO`)
  .params(u =>
    u //
      .combine('el_type', ['i32', 'u32'] as readonly kWgslScalarTypeNames[])
      .combine('offset', [undefined, 0, 4, 12])
  )
  .fn(async t => {
    const wgsl = `
@binding(10) @group(20) var<storage, read_write> VARIABLE : atomic<${t.params.el_type}>;
@compute @workgroup_size(1)
fn main() {
_ = &VARIABLE;
}
`;
    const binding = await compileAndGetBinding(t, wgsl, 20, 10);
    if (binding === undefined) {
      return;
    }

    const value = 42;

    const typeInfo = kWgslScalarTypeInfo[t.params.el_type];

    const buffer = new typeInfo.array(8);

    const view = (binding.type as WGSLSizedType).createView({
      buffer: buffer.buffer,
      offset: t.params.offset,
    });
    view.set(value);

    const expected = new typeInfo.array(8);
    expected[(t.params.offset ?? 0) / typeInfo.size] = value;

    t.expectOK(checkElementsEqual(buffer, expected));
    t.expectDeepEqual('view.get()', view.get(), value);
  });

g.test('vector')
  .desc(`TODO`)
  .params(u =>
    u //
      .combine('el_type', keysOf(kWgslScalarTypeInfo)) //
      .combine('el_count', [2, 3, 4])
      .combine('offset', [undefined, 0, 4, 12])
  )
  .fn(async t => {
    const wgsl = `
@binding(10) @group(20) var<storage> VARIABLE : vec${t.params.el_count}<${t.params.el_type}>;
@compute @workgroup_size(1)
fn main() {
_ = VARIABLE;
}
`;
    const binding = await compileAndGetBinding(t, wgsl, 20, 10);
    if (binding === undefined) {
      return;
    }

    const vector = [10, 20, 30, 40].slice(0, t.params.el_count);

    const typeInfo = kWgslScalarTypeInfo[t.params.el_type];

    const buffer = new typeInfo.array(16);

    const view = (binding.type as WGSLSizedType).createView({
      buffer: buffer.buffer,
      offset: t.params.offset,
    });
    view.set(vector);

    {
      const expected = new typeInfo.array(16);
      const offset = (t.params.offset ?? 0) / typeInfo.size;
      for (let i = 0; i < t.params.el_count; i++) {
        expected[i + offset] = vector[i];
      }
      t.expectOK(checkElementsEqual(buffer, expected));
    }

    t.expectOK(checkDeepEqual(view.get(), vector, 'view.get()', 'vector'));
  });

g.test('matrix')
  .desc(`TODO`)
  .params(u =>
    u //
      .combine('el_type', ['f32'] as readonly kWgslScalarTypeNames[])
      .combine('columns', [2, 3, 4])
      .combine('rows', [2, 3, 4])
      .combine('offset', [undefined, 0, 4, 12])
  )
  .fn(async t => {
    const wgsl = `
@binding(10) @group(20) var<storage> VARIABLE : mat${t.params.columns}x${t.params.rows}<${t.params.el_type}>;
@compute @workgroup_size(1)
fn main() {
_ = VARIABLE;
}
`;
    const binding = await compileAndGetBinding(t, wgsl, 20, 10);
    if (binding === undefined) {
      return;
    }

    const matrix = [
      [1, 2, 3, 4].slice(0, t.params.rows),
      [5, 6, 7, 8].slice(0, t.params.rows),
      [9, 10, 11, 12].slice(0, t.params.rows),
      [13, 14, 15, 16].slice(0, t.params.rows),
    ].slice(0, t.params.columns);

    const typeInfo = kWgslScalarTypeInfo[t.params.el_type];

    const buffer = new typeInfo.array(32);

    const view = (binding.type as WGSLSizedType).createView({
      buffer: buffer.buffer,
      offset: t.params.offset,
    });
    view.set(matrix);

    {
      const expected = new typeInfo.array(32);
      const stride = t.params.rows === 2 ? 2 : 4;
      const offset = (t.params.offset ?? 0) / typeInfo.size;
      for (let c = 0; c < t.params.columns; c++) {
        for (let r = 0; r < t.params.rows; r++) {
          expected[offset + r + c * stride] = matrix[c][r];
        }
      }
      t.expectOK(checkElementsEqual(buffer, expected));
    }

    t.expectOK(checkDeepEqual(view.get(), matrix, 'view.get()', 'matrix'));
  });

g.test('fixed_sized_array')
  .desc(`TODO`)
  .params(u =>
    u //
      .combine('el_type', keysOf(kWgslScalarTypeInfo))
      .combine('count', [1, 2, 5, 100])
      .combine('offset', [undefined, 0, 4, 12])
  )
  .fn(async t => {
    const wgsl = `
@binding(10) @group(20) var<storage> VARIABLE : array<${t.params.el_type}, ${t.params.count}>;
@compute @workgroup_size(1)
fn main() {
_ = VARIABLE;
}
`;
    const binding = await compileAndGetBinding(t, wgsl, 20, 10);
    if (binding === undefined) {
      return;
    }

    const array = [...iterRange(t.params.count, x => x * 10)];

    const typeInfo = kWgslScalarTypeInfo[t.params.el_type];

    const buffer = new typeInfo.array(200);

    const view = (binding.type as WGSLSizedType).createView({
      buffer: buffer.buffer,
      offset: t.params.offset,
    });
    view.set(array);

    {
      const expected = new typeInfo.array(200);
      const offset = (t.params.offset ?? 0) / typeInfo.size;
      for (let i = 0; i < t.params.count; i++) {
        expected[i + offset] = array[i];
      }
      t.expectOK(checkElementsEqual(buffer, expected));
    }

    t.expectOK(checkDeepEqual(view.get(), array, 'view.get()', 'array'));
  });

g.test('struct')
  .desc(`TODO`)
  .fn(async t => {
    const wgsl = `
struct Y {
  @size(32) y_a : u32,
  y_b : mat2x3f,
}
struct X {
  x_a : vec3i,
  x_b : array<f32, 2>,
  x_c : Y,
  @align(64) x_d : i32,
};
@binding(10) @group(20) var<storage> VARIABLE : X;
@compute @workgroup_size(1)
fn main() {
_ = &VARIABLE;
}
`;
    const binding = await compileAndGetBinding(t, wgsl, 20, 10);
    if (binding === undefined) {
      return;
    }

    const str = {
      x_a: [1, 2, 3],
      x_b: [5, 6],
      x_c: {
        y_a: 42,
        y_b: [
          [9, 8, 7],
          [6, 5, 4],
        ],
      },
      x_d: 99,
    };

    const buffer = new Uint32Array(48);

    const view = (binding.type as WGSLSizedType).createView({ buffer: buffer.buffer });
    view.set(str);

    t.expectOK(
      checkElementsEqual(
        buffer,
        // prettier-ignore
        new Uint32Array([
          /* 0x0000 */ 0x00000001, 0x00000002, 0x00000003, 0x40a00000, // X.x_a, X.x_b[0]
          /* 0x0010 */ 0x40c00000, 0x00000000, 0x00000000, 0x00000000, // X.x_b[1]
          /* 0x0020 */ 0x0000002a, 0x00000000, 0x00000000, 0x00000000, // Y.y_a
          /* 0x0030 */ 0x00000000, 0x00000000, 0x00000000, 0x00000000, //
          /* 0x0040 */ 0x41100000, 0x41000000, 0x40e00000, 0x00000000, // Y.y_b[0]
          /* 0x0050 */ 0x40c00000, 0x40a00000, 0x40800000, 0x00000000, // Y.y_b[1]
          /* 0x0060 */ 0x00000000, 0x00000000, 0x00000000, 0x00000000, //
          /* 0x0070 */ 0x00000000, 0x00000000, 0x00000000, 0x00000000, //
          /* 0x0080 */ 0x00000063, 0x00000000, 0x00000000, 0x00000000, // X.x_d

          /* 0x0090 */ 0x00000000, 0x00000000, 0x00000000, 0x00000000, //
          /* 0x00a0 */ 0x00000000, 0x00000000, 0x00000000, 0x00000000, //
          /* 0x00b0 */ 0x00000000, 0x00000000, 0x00000000, 0x00000000, //

        ])
      )
    );
  });
