export const description = `Shader module reflection tests`;

import { makeTestGroup } from '../../../common/framework/test_group.js';
import { GPUTest } from '../../gpu_test.js';

import { compile } from './harness.js';

export const g = makeTestGroup(GPUTest);

g.test('entrypoints')
  .desc(`Test GPUCompilationInfo.entrypoints.has()`)
  .fn(async t => {
    const info = await compile(
      t.device,
      `
@compute @workgroup_size(1)
fn cs_main() {}

@fragment
fn fs_main() {}

@vertex
fn vs_main() -> @builtin(position) vec4f {
  return vec4f();
}
`
    );
    const keys = new Set(info.entrypoints.keys());
    t.expect(keys.has('cs_main'), `keys.has('cs_main')`);
    t.expect(keys.has('fs_main'), `keys.has('fs_main')`);
    t.expect(keys.has('vs_main'), `keys.has('vs_main')`);

    t.expect(info.entrypoints.has('cs_main'), `info.entrypoints.has('cs_main')`);
    t.expect(info.entrypoints.has('fs_main'), `info.entrypoints.has('fs_main')`);
    t.expect(info.entrypoints.has('vs_main'), `info.entrypoints.has('vs_main')`);
    t.expect(!info.entrypoints.has('missing'), `!info.entrypoints.has('missing')`);

    const cs_main = info.entrypoints.get('cs_main');
    const fs_main = info.entrypoints.get('fs_main');
    const vs_main = info.entrypoints.get('vs_main');
    t.expect(cs_main !== undefined, 'cs_main !== undefined');
    t.expect(fs_main !== undefined, 'fs_main !== undefined');
    t.expect(vs_main !== undefined, 'vs_main !== undefined');

    t.expectDeepEqual('cs_main.name', cs_main?.name, 'cs_main');
    t.expectDeepEqual('fs_main.name', fs_main?.name, 'fs_main');
    t.expectDeepEqual('vs_main.name', vs_main?.name, 'vs_main');

    t.expectDeepEqual('cs_main.stage', cs_main?.stage, 'compute');
    t.expectDeepEqual('fs_main.stage', fs_main?.stage, 'fragment');
    t.expectDeepEqual('vs_main.stage', vs_main?.stage, 'vertex');
  });

g.test('no_bindings')
  .desc(`Test GPUCompilationInfo.entrypoints.has()`)
  .fn(async t => {
    const info = await compile(
      t.device,
      `
@compute @workgroup_size(1)
fn main() {}
`
    );
    const bindgroups = info.entrypoints.get('main')?.bindgroups;
    if (bindgroups === undefined) {
      t.fail('bindgroups is undefined');
      return;
    }
    t.expectDeepEqual('[...bindgroups.keys()].length', [...bindgroups.keys()].length, 0);
    t.expectDeepEqual('[...bindgroups.values()].length', [...bindgroups.values()].length, 0);
  });

g.test('single')
  .desc(`Test reflection of single storage buffer binding`)
  .params(u => u.combine('reference', ['direct', 'indirect']))
  .fn(async t => {
    const wgsl = (() => {
      switch (t.params.reference) {
        case 'direct':
          return `
@binding(10) @group(20) var<storage> VARIABLE : i32;
@compute @workgroup_size(1)
fn main() {
_ = VARIABLE;
}
`;
        case 'indirect':
          return `
@binding(10) @group(20) var<storage> VARIABLE : i32;
fn f() {
  _ = VARIABLE;
}
@compute @workgroup_size(1)
fn main() {
  f();
}
`;
        default:
          throw new Error(`unhandled 'reference' type: ${t.params.reference}`);
      }
    })();
    const info = await compile(t.device, wgsl);
    const bindgroups = info.entrypoints.get('main')?.bindgroups;
    if (bindgroups === undefined) {
      t.fail('bindgroups is undefined');
      return;
    }
    t.expectDeepEqual('[...bindgroups.keys()].length', [...bindgroups.keys()].length, 1);
    t.expectDeepEqual('[...bindgroups.values()].length', [...bindgroups.values()].length, 1);

    const bindgroup = bindgroups.get(20);
    if (bindgroup === undefined) {
      t.fail('bindgroup is undefined');
      return;
    }

    t.expectDeepEqual('[...bindgroup.keys()].length', [...bindgroup.keys()].length, 1);
    t.expectDeepEqual('[...bindgroup.values()].length', [...bindgroup.values()].length, 1);
    t.expectDeepEqual('bindgroup.group', bindgroup.group, 20);

    const binding = bindgroup.get(10);
    if (binding === undefined) {
      t.fail('binding is undefined');
      return;
    }

    t.expectDeepEqual('binding.group', binding.group, 20);
    t.expectDeepEqual('binding.binding', binding.binding, 10);
    t.expectDeepEqual('binding.name', binding.name, 'VARIABLE');
    t.expectDeepEqual('binding.type.kind', binding.type.kind, 'i32');
  });
