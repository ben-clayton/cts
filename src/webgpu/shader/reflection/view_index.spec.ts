export const description = `Shader module reflection view index tests`;

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
      .combine('index', [0, 1, 2, 'a', 'b', 'c'])
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

    const typeInfo = kWgslScalarTypeInfo[t.params.type];

    const buffer = new typeInfo.array(8);

    const view = (binding.type as WGSLSizedType).createView({ buffer: buffer.buffer });
    t.expectDeepEqual(`view.index(${t.params.index})`, view.index(t.params.index), undefined);
  });

g.test('atomic')
  .desc(`TODO`)
  .params(u =>
    u //
      .combine('el_type', ['i32', 'u32'] as readonly kWgslScalarTypeNames[])
      .combine('index', [0, 1, 2, 'a', 'b', 'c'])
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

    const typeInfo = kWgslScalarTypeInfo[t.params.el_type];

    const buffer = new typeInfo.array(8);

    const view = (binding.type as WGSLSizedType).createView({ buffer: buffer.buffer });
    t.expectDeepEqual(`view.index(${t.params.index})`, view.index(t.params.index), undefined);
  });

const kVectorCases = {
  kVec2Index0: { el_count: 2, index: 0, expected: 10 },
  kVec3Index0: { el_count: 3, index: 0, expected: 10 },
  kVec4Index0: { el_count: 4, index: 0, expected: 10 },

  kVec2Index1: { el_count: 2, index: 1, expected: 20 },
  kVec3Index1: { el_count: 3, index: 1, expected: 20 },
  kVec4Index1: { el_count: 4, index: 1, expected: 20 },

  kVec2Index2: { el_count: 2, index: 2, expected: undefined },
  kVec3Index2: { el_count: 3, index: 2, expected: 30 },
  kVec4Index2: { el_count: 4, index: 2, expected: 30 },

  kVec2Index3: { el_count: 2, index: 3, expected: undefined },
  kVec3Index3: { el_count: 3, index: 3, expected: undefined },
  kVec4Index3: { el_count: 4, index: 3, expected: 40 },

  kVec2Index4: { el_count: 2, index: 4, expected: undefined },
  kVec3Index4: { el_count: 3, index: 4, expected: undefined },
  kVec4Index4: { el_count: 4, index: 4, expected: undefined },

  kVec2IndexX: { el_count: 2, index: 'x', expected: 10 },
  kVec3IndexX: { el_count: 3, index: 'x', expected: 10 },
  kVec4IndexX: { el_count: 4, index: 'x', expected: 10 },

  kVec2IndexY: { el_count: 2, index: 'y', expected: 20 },
  kVec3IndexY: { el_count: 3, index: 'y', expected: 20 },
  kVec4IndexY: { el_count: 4, index: 'y', expected: 20 },

  kVec2IndexZ: { el_count: 2, index: 'z', expected: undefined },
  kVec3IndexZ: { el_count: 3, index: 'z', expected: 30 },
  kVec4IndexZ: { el_count: 4, index: 'z', expected: 30 },

  kVec2IndexW: { el_count: 2, index: 'w', expected: undefined },
  kVec3IndexW: { el_count: 3, index: 'w', expected: undefined },
  kVec4IndexW: { el_count: 4, index: 'w', expected: 40 },

  kVec2IndexR: { el_count: 2, index: 'r', expected: 10 },
  kVec3IndexR: { el_count: 3, index: 'r', expected: 10 },
  kVec4IndexR: { el_count: 4, index: 'r', expected: 10 },

  kVec2IndexG: { el_count: 2, index: 'g', expected: 20 },
  kVec3IndexG: { el_count: 3, index: 'g', expected: 20 },
  kVec4IndexG: { el_count: 4, index: 'g', expected: 20 },

  kVec2IndexB: { el_count: 2, index: 'b', expected: undefined },
  kVec3IndexB: { el_count: 3, index: 'b', expected: 30 },
  kVec4IndexB: { el_count: 4, index: 'b', expected: 30 },

  kVec2IndexA: { el_count: 2, index: 'a', expected: undefined },
  kVec3IndexA: { el_count: 3, index: 'a', expected: undefined },
  kVec4IndexA: { el_count: 4, index: 'a', expected: 40 },

  kVec2IndexQ: { el_count: 2, index: 'q', expected: undefined },
  kVec3IndexQ: { el_count: 3, index: 'q', expected: undefined },
  kVec4IndexQ: { el_count: 4, index: 'q', expected: undefined },
};

g.test('vector')
  .desc(`TODO`)
  .params(u =>
    u //
      .combine('el_type', keysOf(kWgslScalarTypeInfo)) //
      .combine('case', keysOf(kVectorCases))
  )
  .fn(async t => {
    const c = kVectorCases[t.params.case];
    const wgsl = `
@binding(10) @group(20) var<storage> VARIABLE : vec${c.el_count}<${t.params.el_type}>;
@compute @workgroup_size(1)
fn main() {
_ = VARIABLE;
}
`;
    const binding = await compileAndGetBinding(t, wgsl, 20, 10);
    if (binding === undefined) {
      return;
    }

    const typeInfo = kWgslScalarTypeInfo[t.params.el_type];

    const buffer = new typeInfo.array(8);

    const view = (binding.type as WGSLSizedType).createView({ buffer: buffer.buffer });
    view.set([10, 20, 30, 40]);
    const indexed = view.index(c.index);

    if (!t.expectEqual(`indexed === undefined`, indexed === undefined, c.expected === undefined)) {
      return;
    }
    if (indexed !== undefined) {
      t.expectDeepEqual(`indexed.get()`, indexed.get(), c.expected);
    }
  });

const kMatrixCases = {
  kMat2x2Index0: { columns: 2, rows: 2, indices: [0], expected: [1, 2] },
  kMat2x3Index0: { columns: 2, rows: 3, indices: [0], expected: [1, 2, 3] },
  kMat2x4Index0: { columns: 2, rows: 4, indices: [0], expected: [1, 2, 3, 4] },
  kMat3x2Index0: { columns: 3, rows: 2, indices: [0], expected: [1, 2] },
  kMat3x3Index0: { columns: 3, rows: 3, indices: [0], expected: [1, 2, 3] },
  kMat3x4Index0: { columns: 3, rows: 4, indices: [0], expected: [1, 2, 3, 4] },
  kMat4x2Index0: { columns: 4, rows: 2, indices: [0], expected: [1, 2] },
  kMat4x3Index0: { columns: 4, rows: 3, indices: [0], expected: [1, 2, 3] },
  kMat4x4Index0: { columns: 4, rows: 4, indices: [0], expected: [1, 2, 3, 4] },

  kMat2x2Index1: { columns: 2, rows: 2, indices: [1], expected: [5, 6] },
  kMat2x3Index1: { columns: 2, rows: 3, indices: [1], expected: [5, 6, 7] },
  kMat2x4Index1: { columns: 2, rows: 4, indices: [1], expected: [5, 6, 7, 8] },
  kMat3x2Index1: { columns: 3, rows: 2, indices: [1], expected: [5, 6] },
  kMat3x3Index1: { columns: 3, rows: 3, indices: [1], expected: [5, 6, 7] },
  kMat3x4Index1: { columns: 3, rows: 4, indices: [1], expected: [5, 6, 7, 8] },
  kMat4x2Index1: { columns: 4, rows: 2, indices: [1], expected: [5, 6] },
  kMat4x3Index1: { columns: 4, rows: 3, indices: [1], expected: [5, 6, 7] },
  kMat4x4Index1: { columns: 4, rows: 4, indices: [1], expected: [5, 6, 7, 8] },

  kMat2x2Index2: { columns: 2, rows: 2, indices: [2], expected: undefined },
  kMat2x3Index2: { columns: 2, rows: 3, indices: [2], expected: undefined },
  kMat2x4Index2: { columns: 2, rows: 4, indices: [2], expected: undefined },
  kMat3x2Index2: { columns: 3, rows: 2, indices: [2], expected: [9, 10] },
  kMat3x3Index2: { columns: 3, rows: 3, indices: [2], expected: [9, 10, 11] },
  kMat3x4Index2: { columns: 3, rows: 4, indices: [2], expected: [9, 10, 11, 12] },
  kMat4x2Index2: { columns: 4, rows: 2, indices: [2], expected: [9, 10] },
  kMat4x3Index2: { columns: 4, rows: 3, indices: [2], expected: [9, 10, 11] },
  kMat4x4Index2: { columns: 4, rows: 4, indices: [2], expected: [9, 10, 11, 12] },

  kMat2x2Index3: { columns: 2, rows: 2, indices: [3], expected: undefined },
  kMat2x3Index3: { columns: 2, rows: 3, indices: [3], expected: undefined },
  kMat2x4Index3: { columns: 2, rows: 4, indices: [3], expected: undefined },
  kMat3x2Index3: { columns: 3, rows: 2, indices: [3], expected: undefined },
  kMat3x3Index3: { columns: 3, rows: 3, indices: [3], expected: undefined },
  kMat3x4Index3: { columns: 3, rows: 4, indices: [3], expected: undefined },
  kMat4x2Index3: { columns: 4, rows: 2, indices: [3], expected: [13, 14] },
  kMat4x3Index3: { columns: 4, rows: 3, indices: [3], expected: [13, 14, 15] },
  kMat4x4Index3: { columns: 4, rows: 4, indices: [3], expected: [13, 14, 15, 16] },

  kMat2x2Index4: { columns: 2, rows: 2, indices: [4], expected: undefined },
  kMat2x3Index4: { columns: 2, rows: 3, indices: [4], expected: undefined },
  kMat2x4Index4: { columns: 2, rows: 4, indices: [4], expected: undefined },
  kMat3x2Index4: { columns: 3, rows: 2, indices: [4], expected: undefined },
  kMat3x3Index4: { columns: 3, rows: 3, indices: [4], expected: undefined },
  kMat3x4Index4: { columns: 3, rows: 4, indices: [4], expected: undefined },
  kMat4x2Index4: { columns: 4, rows: 2, indices: [4], expected: undefined },
  kMat4x3Index4: { columns: 4, rows: 3, indices: [4], expected: undefined },
  kMat4x4Index4: { columns: 4, rows: 4, indices: [4], expected: undefined },

  kMat4x2Index0_0: { columns: 4, rows: 2, indices: [0, 0], expected: 1 },
  kMat3x4Index2_1: { columns: 3, rows: 4, indices: [2, 1], expected: 10 },
  kMat4x4Index3_3: { columns: 4, rows: 4, indices: [3, 3], expected: 16 },

  kMat4x2Index0_3: { columns: 4, rows: 2, indices: [0, 3], expected: undefined },
  kMat4x2Index1_2: { columns: 4, rows: 2, indices: [1, 2], expected: undefined },
};

g.test('matrix')
  .desc(`TODO`)
  .params(u =>
    u //
      .combine('el_type', ['f32'] as readonly kWgslScalarTypeNames[])
      .combine('case', keysOf(kMatrixCases))
  )
  .fn(async t => {
    const c = kMatrixCases[t.params.case];

    const wgsl = `
@binding(10) @group(20) var<storage> VARIABLE : mat${c.columns}x${c.rows}<${t.params.el_type}>;
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
      [1, 2, 3, 4].slice(0, c.rows),
      [5, 6, 7, 8].slice(0, c.rows),
      [9, 10, 11, 12].slice(0, c.rows),
      [13, 14, 15, 16].slice(0, c.rows),
    ].slice(0, c.columns);

    const typeInfo = kWgslScalarTypeInfo[t.params.el_type];

    const buffer = new typeInfo.array(64);

    const view = (binding.type as WGSLSizedType).createView({ buffer: buffer.buffer });
    view.set(matrix);

    let indexed = view;
    for (const index of c.indices) {
      indexed = indexed.index(index);
    }

    if (!t.expectEqual(`indexed === undefined`, indexed === undefined, c.expected === undefined)) {
      return;
    }
    if (indexed !== undefined) {
      t.expectDeepEqual(`indexed.get()`, indexed.get(), c.expected);
    }
  });

const kArrayScalarCases = {
  kArr1Index0: { count: 1, index: 0, expected: 0 },
  kArr1Index1: { count: 1, index: 1, expected: undefined },

  kArr10Index0: { count: 10, index: 0, expected: 0 },
  kArr10Index1: { count: 10, index: 1, expected: 10 },
  kArr10Index5: { count: 10, index: 5, expected: 50 },
  kArr10Index9: { count: 10, index: 9, expected: 90 },
  kArr10Index10: { count: 10, index: 10, expected: undefined },

  kArr100Index0: { count: 100, index: 0, expected: 0 },
  kArr100Index1: { count: 100, index: 1, expected: 10 },
  kArr100Index42: { count: 100, index: 42, expected: 420 },
  kArr100Index99: { count: 100, index: 99, expected: 990 },
  kArr100Index100: { count: 10, index: 100, expected: undefined },
};

g.test('array_scalar')
  .desc(`TODO`)
  .params(u =>
    u //
      .combine('el_type', keysOf(kWgslScalarTypeInfo))
      .combine('case', keysOf(kArrayScalarCases))
  )
  .fn(async t => {
    const c = kArrayScalarCases[t.params.case];

    const wgsl = `
@binding(10) @group(20) var<storage> VARIABLE : array<${t.params.el_type}, ${c.count}>;
@compute @workgroup_size(1)
fn main() {
_ = VARIABLE;
}
`;
    const binding = await compileAndGetBinding(t, wgsl, 20, 10);
    if (binding === undefined) {
      return;
    }

    const array = [...iterRange(c.count, x => x * 10)];

    const typeInfo = kWgslScalarTypeInfo[t.params.el_type];

    const buffer = new typeInfo.array(c.count);

    const view = (binding.type as WGSLSizedType).createView({ buffer: buffer.buffer });
    view.set(array);

    const indexed = view.index(c.index);

    if (!t.expectEqual(`indexed === undefined`, indexed === undefined, c.expected === undefined)) {
      return;
    }
    if (indexed !== undefined) {
      t.expectDeepEqual(`indexed.get()`, indexed.get(), c.expected);
    }
  });

const kStructValue = {
  /* vec3i */ a: [1, 2, 3],
  /* array<f32, 2> */ b: [5.5, 6.5],
  /* struct Y */ c: {
    /* u32 */ a: 42,
    /* mat2x3f */ b: [
      [9, 8, 7],
      [6, 5, 4],
    ],
  },
  /* i32 */ d: 99,
};

const kStructCases = {
  kIndex_a: { indices: ['a'], expected: [1, 2, 3] },
  kIndex_a_0: { indices: ['a', 0], expected: 1 },
  kIndex_a_y: { indices: ['a', 'y'], expected: 2 },
  kIndex_a_2: { indices: ['a', 2], expected: 3 },
  kIndex_b: { indices: ['b'], expected: [5.5, 6.5] },
  kIndex_b_0: { indices: ['b', 0], expected: 5.5 },
  kIndex_b_1: { indices: ['b', 1], expected: 6.5 },
  kIndex_c: {
    indices: ['c'],
    expected: {
      a: 42,
      b: [
        [9, 8, 7],
        [6, 5, 4],
      ],
    },
  },
  kIndex_c_a: { indices: ['c', 'a'], expected: 42 },
  kIndex_c_b: {
    indices: ['c', 'b'],
    expected: [
      [9, 8, 7],
      [6, 5, 4],
    ],
  },
  kIndex_c_b_0: {
    indices: ['c', 'b', 0],
    expected: [9, 8, 7],
  },
  kIndex_c_b_0_x: {
    indices: ['c', 'b', 0, 'x'],
    expected: 9,
  },
  kIndex_c_b_0_1: {
    indices: ['c', 'b', 0, 1],
    expected: 8,
  },
  kIndex_c_b_0_z: {
    indices: ['c', 'b', 0, 'z'],
    expected: 7,
  },
  kIndex_c_b_1: {
    indices: ['c', 'b', 1],
    expected: [6, 5, 4],
  },
  kIndex_d: { indices: ['d'], expected: 99 },
};

g.test('struct')
  .desc(`TODO`)
  .params(u => u.combine('case', keysOf(kStructCases)))
  .fn(async t => {
    const c = kStructCases[t.params.case];

    const wgsl = `
struct Y {
  @size(32) a : u32,
  b : mat2x3f,
}
struct X {
  a : vec3i,
  b : array<f32, 2>,
  c : Y,
  @align(64) d : i32,
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

    const buffer = new Uint32Array(48);

    const view = (binding.type as WGSLSizedType).createView({ buffer: buffer.buffer });
    view.set(kStructValue);

    let indexed = view;
    for (const index of c.indices) {
      indexed = indexed.index(index);
    }

    if (!t.expectEqual(`indexed === undefined`, indexed === undefined, c.expected === undefined)) {
      return;
    }
    if (indexed !== undefined) {
      t.expectDeepEqual(`indexed.get()`, indexed.get(), c.expected);
    }
  });
