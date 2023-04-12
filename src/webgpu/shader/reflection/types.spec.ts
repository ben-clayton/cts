export const description = `Shader module reflection type tests`;

import { makeTestGroup } from '../../../common/framework/test_group.js';
import { keysOf } from '../../../common/util/data_tables.js';
import { GPUTest } from '../../gpu_test.js';

import {
  compile,
  compileAndGetBinding,
  kWgslScalarTypeInfo,
  kWgslScalarTypeNames as kWgslScalarType,
  kWgslScalarTypeNames,
} from './harness.js';
import {
  WGSLArrayType,
  WGSLAtomicType,
  WGSLDepthTextureType,
  WGSLMatrixType,
  WGSLMultisampledDepthTextureType,
  WGSLMultisampledTextureType,
  WGSLSampledTextureType,
  WGSLSizedType,
  WGSLStructType,
  WGSLVectorType,
} from './wgsl_types.js';

export const g = makeTestGroup(GPUTest);

g.test('scalar')
  .desc(`Test reflection scalar types`)
  .params(u => u.combine('type', keysOf(kWgslScalarTypeInfo)))
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

    t.expectDeepEqual('binding.group', binding.group, 20);
    t.expectDeepEqual('binding.binding', binding.binding, 10);
    t.expectDeepEqual('binding.name', binding.name, 'VARIABLE');
    const type = binding.type as WGSLSizedType;
    t.expectDeepEqual('type.kind', type.kind, kWgslScalarTypeInfo[t.params.type].kind);
    t.expectDeepEqual('type.size', type.size, kWgslScalarTypeInfo[t.params.type].size);
    t.expectDeepEqual('type.align', type.align, kWgslScalarTypeInfo[t.params.type].align);
  });

g.test('atomic')
  .desc(`Test reflection of an atomic storage buffer binding`)
  .params(u => u.combine('el_type', ['i32', 'u32'] as kWgslScalarType[]))
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
    t.expectDeepEqual('binding.group', binding.group, 20);
    t.expectDeepEqual('binding.binding', binding.binding, 10);
    t.expectDeepEqual('binding.name', binding.name, 'VARIABLE');
    const expectedElTy = kWgslScalarTypeInfo[t.params.el_type];
    const type = binding.type as WGSLAtomicType;
    t.expectDeepEqual('type.kind', type.kind, 'atomic');
    t.expectDeepEqual('type.size', type.size, expectedElTy.size);
    t.expectDeepEqual('type.align', type.align, expectedElTy.align);
    t.expectDeepEqual('type.elementType.kind', type.elementType.kind, expectedElTy.kind);
    t.expectDeepEqual('type.elementType.size', type.elementType.size, expectedElTy.size);
    t.expectDeepEqual('type.elementType.align', type.elementType.align, expectedElTy.align);
  });

g.test('vector')
  .desc(`Test reflection of a vector storage buffer binding`)
  .params(u =>
    u //
      .combine('el_type', keysOf(kWgslScalarTypeInfo))
      .combine('el_count', [2, 3, 4])
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
    t.expectDeepEqual('binding.group', binding.group, 20);
    t.expectDeepEqual('binding.binding', binding.binding, 10);
    t.expectDeepEqual('binding.name', binding.name, 'VARIABLE');
    const expectedElTy = kWgslScalarTypeInfo[t.params.el_type];
    const type = binding.type as WGSLVectorType;
    t.expectDeepEqual('type.kind', type.kind, 'vector');
    t.expectDeepEqual('type.size', type.size, expectedElTy.size * t.params.el_count);
    t.expectDeepEqual('type.align', type.align, t.params.el_count === 2 ? 8 : 16);
    t.expectDeepEqual('type.elementCount', type.elementCount, t.params.el_count);
    t.expectDeepEqual('type.elementType.kind', type.elementType.kind, expectedElTy.kind);
    t.expectDeepEqual('type.elementType.size', type.elementType.size, expectedElTy.size);
    t.expectDeepEqual('type.elementType.align', type.elementType.align, expectedElTy.align);
  });

g.test('matrix')
  .desc(`Test reflection of a matrix storage buffer binding`)
  .params(u =>
    u //
      .combine('el_type', ['f32'] as readonly kWgslScalarTypeNames[])
      .combine('columns', [2, 3, 4])
      .combine('rows', [2, 3, 4])
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
    t.expectDeepEqual('binding.group', binding.group, 20);
    t.expectDeepEqual('binding.binding', binding.binding, 10);
    t.expectDeepEqual('binding.name', binding.name, 'VARIABLE');
    const expectedElTy = kWgslScalarTypeInfo[t.params.el_type];
    const expectedColumnStride = t.params.rows === 2 ? 8 : 16;
    const type = binding.type as WGSLMatrixType;
    t.expectDeepEqual('type.kind', type.kind, 'matrix');
    t.expectDeepEqual('type.size', type.size, t.params.columns * expectedColumnStride);
    t.expectDeepEqual('type.align', type.align, expectedColumnStride);
    t.expectDeepEqual('type.columnCount', type.columnCount, t.params.columns);
    t.expectDeepEqual('type.rowCount', type.rowCount, t.params.rows);
    t.expectDeepEqual('type.elementType.kind', type.elementType.kind, expectedElTy.kind);
    t.expectDeepEqual('type.elementType.size', type.elementType.size, expectedElTy.size);
    t.expectDeepEqual('type.elementType.align', type.elementType.align, expectedElTy.align);
    t.expectDeepEqual('type.columnType.kind', type.columnType.kind, 'vector');
    t.expectDeepEqual(
      'type.columnType.size',
      type.columnType.size,
      t.params.rows * expectedElTy.size
    );
    t.expectDeepEqual('type.columnType.align', type.columnType.align, expectedColumnStride);
  });

g.test('fixed_sized_array')
  .desc(`Test reflection of a fixed-size array storage buffer binding`)
  .params(u =>
    u //
      .combine('el_type', keysOf(kWgslScalarTypeInfo))
      .combine('count', [1, 2, 5, 100])
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
    t.expectDeepEqual('binding.group', binding.group, 20);
    t.expectDeepEqual('binding.binding', binding.binding, 10);
    t.expectDeepEqual('binding.name', binding.name, 'VARIABLE');
    const expectedElTy = kWgslScalarTypeInfo[t.params.el_type];
    const type = binding.type as WGSLArrayType;
    t.expectDeepEqual('type.kind', type.kind, 'array');
    t.expectDeepEqual('type.size', type.size, t.params.count * expectedElTy.align);
    t.expectDeepEqual('type.align', type.align, expectedElTy.align);
    t.expectDeepEqual('type.elementCount', type.elementCount, t.params.count);
    t.expectDeepEqual('type.elementType.kind', type.elementType.kind, expectedElTy.kind);
    t.expectDeepEqual('type.elementType.size', type.elementType.size, expectedElTy.size);
    t.expectDeepEqual('type.elementType.align', type.elementType.align, expectedElTy.align);
  });

g.test('runtime_sized_array')
  .desc(`Test reflection of a fixed-size array storage buffer binding`)
  .params(u =>
    u //
      .combine('el_type', keysOf(kWgslScalarTypeInfo))
  )
  .fn(async t => {
    const wgsl = `
@binding(10) @group(20) var<storage> VARIABLE : array<${t.params.el_type}>;
@compute @workgroup_size(1)
fn main() {
_ = &VARIABLE;
}
`;
    const binding = await compileAndGetBinding(t, wgsl, 20, 10);
    if (binding === undefined) {
      return;
    }
    t.expectDeepEqual('binding.group', binding.group, 20);
    t.expectDeepEqual('binding.binding', binding.binding, 10);
    t.expectDeepEqual('binding.name', binding.name, 'VARIABLE');
    const expectedElTy = kWgslScalarTypeInfo[t.params.el_type];
    const type = binding.type as WGSLArrayType;
    t.expectDeepEqual('type.kind', type.kind, 'array');
    t.expectDeepEqual('type.size', type.size, expectedElTy.size);
    t.expectDeepEqual('type.align', type.align, expectedElTy.align);
    t.expectDeepEqual('type.elementCount', type.elementCount, 'runtime-sized');
    t.expectDeepEqual('type.elementType.kind', type.elementType.kind, expectedElTy.kind);
    t.expectDeepEqual('type.elementType.size', type.elementType.size, expectedElTy.size);
    t.expectDeepEqual('type.elementType.align', type.elementType.align, expectedElTy.align);
  });

g.test('struct')
  .desc(`Test reflection of a fixed-size array storage buffer binding`)
  .fn(async t => {
    const wgsl = `
struct Y {
  @size(64) y_a : u32,
  y_b : mat2x3f,
}
struct X {
  x_a : vec3f,
  x_b : array<f32, 2>,
  x_c : Y,
  @align(128) x_d : i32,
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
    t.expectDeepEqual('binding.group', binding.group, 20);
    t.expectDeepEqual('binding.binding', binding.binding, 10);
    t.expectDeepEqual('binding.name', binding.name, 'VARIABLE');
    const X = binding.type as WGSLStructType;
    t.expectDeepEqual('X.kind', X.kind, 'struct');
    t.expectDeepEqual('X.size', X.size, 256);
    t.expectDeepEqual('X.align', X.align, 128);
    t.expectDeepEqual('X.members.length', X.members.length, 4);

    t.expectDeepEqual('X.members[0].name', X.members[0].name, 'x_a');
    t.expectDeepEqual('X.members[0].index', X.members[0].index, 0);
    t.expectDeepEqual('X.members[0].offset', X.members[0].offset, 0);
    t.expectDeepEqual('X.members[0].size', X.members[0].size, 12);
    t.expectDeepEqual('X.members[0].align', X.members[0].align, 16);
    t.expectDeepEqual('X.members[0].type.kind', X.members[0].type.kind, 'vector');
    t.expectDeepEqual('X.members[0].type.size', X.members[0].type.size, 12);
    t.expectDeepEqual('X.members[0].type.align', X.members[0].type.align, 16);

    t.expectDeepEqual('X.members[1].name', X.members[1].name, 'x_b');
    t.expectDeepEqual('X.members[1].index', X.members[1].index, 1);
    t.expectDeepEqual('X.members[1].offset', X.members[1].offset, 12);
    t.expectDeepEqual('X.members[1].size', X.members[1].size, 8);
    t.expectDeepEqual('X.members[1].align', X.members[1].align, 4);
    t.expectDeepEqual('X.members[1].type.kind', X.members[1].type.kind, 'array');
    t.expectDeepEqual('X.members[1].type.size', X.members[1].type.size, 8);
    t.expectDeepEqual('X.members[1].type.align', X.members[1].type.align, 4);

    t.expectDeepEqual('X.members[2].name', X.members[2].name, 'x_c');
    t.expectDeepEqual('X.members[2].index', X.members[2].index, 2);
    t.expectDeepEqual('X.members[2].offset', X.members[2].offset, 32);
    t.expectDeepEqual('X.members[2].size', X.members[2].size, 96);
    t.expectDeepEqual('X.members[2].align', X.members[2].align, 16);
    t.expectDeepEqual('X.members[2].type.kind', X.members[2].type.kind, 'struct');
    t.expectDeepEqual('X.members[2].type.size', X.members[2].type.size, 96);
    t.expectDeepEqual('X.members[2].type.align', X.members[2].type.align, 16);

    t.expectDeepEqual('X.members[3].name', X.members[3].name, 'x_d');
    t.expectDeepEqual('X.members[3].index', X.members[3].index, 3);
    t.expectDeepEqual('X.members[3].offset', X.members[3].offset, 128);
    t.expectDeepEqual('X.members[3].size', X.members[3].size, 4);
    t.expectDeepEqual('X.members[3].align', X.members[3].align, 128);
    t.expectDeepEqual('X.members[3].type.kind', X.members[3].type.kind, 'i32');
    t.expectDeepEqual('X.members[3].type.size', X.members[3].type.size, 4);
    t.expectDeepEqual('X.members[3].type.align', X.members[3].type.align, 4);

    const Y = X.members[2].type as WGSLStructType;
    t.expectDeepEqual('Y.members.length', Y.members.length, 2);

    t.expectDeepEqual('Y.members[0].name', Y.members[0].name, 'y_a');
    t.expectDeepEqual('Y.members[0].index', Y.members[0].index, 0);
    t.expectDeepEqual('Y.members[0].offset', Y.members[0].offset, 0);
    t.expectDeepEqual('Y.members[0].size', Y.members[0].size, 64);
    t.expectDeepEqual('Y.members[0].align', Y.members[0].align, 4);
    t.expectDeepEqual('Y.members[0].type.kind', Y.members[0].type.kind, 'u32');
    t.expectDeepEqual('Y.members[0].type.size', Y.members[0].type.size, 4);
    t.expectDeepEqual('Y.members[0].type.align', Y.members[0].type.align, 4);

    t.expectDeepEqual('Y.members[1].name', Y.members[1].name, 'y_b');
    t.expectDeepEqual('Y.members[1].index', Y.members[1].index, 1);
    t.expectDeepEqual('Y.members[1].offset', Y.members[1].offset, 64);
    t.expectDeepEqual('Y.members[1].size', Y.members[1].size, 32);
    t.expectDeepEqual('Y.members[1].align', Y.members[1].align, 16);
    t.expectDeepEqual('Y.members[1].type.kind', Y.members[1].type.kind, 'matrix');
    t.expectDeepEqual('Y.members[1].type.size', Y.members[1].type.size, 32);
    t.expectDeepEqual('Y.members[1].type.align', Y.members[1].type.align, 16);
  });

g.test('sampler')
  .desc(`Test reflection of a sampler binding`)
  .fn(async t => {
    const wgsl = `
@binding(10) @group(20) var VARIABLE : sampler;
@compute @workgroup_size(1)
fn main() {
_ = VARIABLE;
}
`;
    const binding = await compileAndGetBinding(t, wgsl, 20, 10);
    if (binding === undefined) {
      return;
    }
    t.expectDeepEqual('binding.group', binding.group, 20);
    t.expectDeepEqual('binding.binding', binding.binding, 10);
    t.expectDeepEqual('binding.name', binding.name, 'VARIABLE');
    t.expectDeepEqual('binding.type.kind', binding.type.kind, 'sampler');
  });

g.test('sampler_comparison')
  .desc(`Test reflection of a sampler binding`)
  .fn(async t => {
    const wgsl = `
@binding(10) @group(20) var VARIABLE : sampler_comparison;
@compute @workgroup_size(1)
fn main() {
_ = VARIABLE;
}
`;
    const binding = await compileAndGetBinding(t, wgsl, 20, 10);
    if (binding === undefined) {
      return;
    }
    t.expectDeepEqual('binding.group', binding.group, 20);
    t.expectDeepEqual('binding.binding', binding.binding, 10);
    t.expectDeepEqual('binding.name', binding.name, 'VARIABLE');
    t.expectDeepEqual('binding.type.kind', binding.type.kind, 'sampler-comparison');
  });

g.test('sampled_texture')
  .desc(`Test reflection of a sampled texture`)
  .params(u =>
    u //
      .combine('dims', ['1d', '2d', '2d-array', '3d', 'cube', 'cube-array'])
      .combine('ty', ['f32', 'i32', 'u32'])
  )
  .fn(async t => {
    const wgsl = `
@binding(10) @group(20) var VARIABLE : texture_${t.params.dims.replace('-', '_')}<${t.params.ty}>;
@compute @workgroup_size(1)
fn main() {
_ = VARIABLE;
}
`;
    const binding = await compileAndGetBinding(t, wgsl, 20, 10);
    if (binding === undefined) {
      return;
    }
    t.expectDeepEqual('binding.group', binding.group, 20);
    t.expectDeepEqual('binding.binding', binding.binding, 10);
    t.expectDeepEqual('binding.name', binding.name, 'VARIABLE');
    const type = binding.type as WGSLSampledTextureType;
    t.expectDeepEqual('type.kind', type.kind, 'sampled-texture');
    t.expectDeepEqual('type.dimensions', type.dimensions, t.params.dims);
    t.expectDeepEqual('type.sampledType.kind', type.sampledType.kind, t.params.ty);
  });

g.test('multisampled_texture')
  .desc(`Test reflection of a sampled texture`)
  .params(u =>
    u //
      .combine('ty', ['f32', 'i32', 'u32'])
  )
  .fn(async t => {
    const wgsl = `
@binding(10) @group(20) var VARIABLE : texture_multisampled_2d<${t.params.ty}>;
@compute @workgroup_size(1)
fn main() {
_ = VARIABLE;
}
`;
    const binding = await compileAndGetBinding(t, wgsl, 20, 10);
    if (binding === undefined) {
      return;
    }
    t.expectDeepEqual('binding.group', binding.group, 20);
    t.expectDeepEqual('binding.binding', binding.binding, 10);
    t.expectDeepEqual('binding.name', binding.name, 'VARIABLE');
    const type = binding.type as WGSLMultisampledTextureType;
    t.expectDeepEqual('type.kind', type.kind, 'multisampled-texture');
    t.expectDeepEqual('type.sampledType.kind', type.sampledType.kind, t.params.ty);
  });

g.test('depth_texture')
  .desc(`Test reflection of a sampled texture`)
  .params(u =>
    u //
      .combine('dims', ['2d', '2d-array', 'cube', 'cube-array'])
  )
  .fn(async t => {
    const wgsl = `
@binding(10) @group(20) var VARIABLE : texture_depth_${t.params.dims.replace('-', '_')};
@compute @workgroup_size(1)
fn main() {
_ = VARIABLE;
}
`;
    const binding = await compileAndGetBinding(t, wgsl, 20, 10);
    if (binding === undefined) {
      return;
    }
    t.expectDeepEqual('binding.group', binding.group, 20);
    t.expectDeepEqual('binding.binding', binding.binding, 10);
    t.expectDeepEqual('binding.name', binding.name, 'VARIABLE');
    const type = binding.type as WGSLDepthTextureType;
    t.expectDeepEqual('type.kind', type.kind, 'depth-texture');
    t.expectDeepEqual('type.dimensions', type.dimensions, t.params.dims);
  });

g.test('multisampled_depth_texture')
  .desc(`Test reflection of a sampled texture`)
  .fn(async t => {
    const wgsl = `
@binding(10) @group(20) var VARIABLE : texture_depth_multisampled_2d;
@compute @workgroup_size(1)
fn main() {
_ = VARIABLE;
}
`;
    const binding = await compileAndGetBinding(t, wgsl, 20, 10);
    if (binding === undefined) {
      return;
    }
    t.expectDeepEqual('binding.group', binding.group, 20);
    t.expectDeepEqual('binding.binding', binding.binding, 10);
    t.expectDeepEqual('binding.name', binding.name, 'VARIABLE');
    const type = binding.type as WGSLMultisampledDepthTextureType;
    t.expectDeepEqual('type.kind', type.kind, 'depth-multisampled-texture');
  });
