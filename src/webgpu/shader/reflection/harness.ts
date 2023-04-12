import { GPUTest } from '../../gpu_test';

import { WGSLEntryPoints } from './wgsl_types';

export const kWgslScalarTypeInfo = {
  i32: {
    kind: 'i32',
    size: 4,
    align: 4,
    array: Int32Array,
  },
  u32: {
    kind: 'u32',
    size: 4,
    align: 4,
    array: Uint32Array,
  },
  f32: {
    kind: 'f32',
    size: 4,
    align: 4,
    array: Float32Array,
  },
};
export type kWgslScalarTypeNames = keyof typeof kWgslScalarTypeInfo;

export interface GPUCompilationInfoExt extends GPUCompilationInfo {
  readonly entrypoints: WGSLEntryPoints;
}

export async function compile(device: GPUDevice, wgsl: string) {
  const module = device.createShaderModule({ code: wgsl });
  const info = await module.getCompilationInfo();
  return info as GPUCompilationInfoExt;
}

export async function compileAndGetBinding(
  t: GPUTest,
  wgsl: string,
  groupIndex: number,
  bindingIndex: number
) {
  const info = await compile(t.device, wgsl);
  const errors = info.messages.filter(m => m.type === 'error');
  if (errors.length) {
    t.fail(`failed to compile shader:
${wgsl}

${errors}
`);
  }
  const bindgroups = info.entrypoints.get('main')?.bindgroups;
  if (bindgroups === undefined) {
    t.fail('bindgroups is undefined');
    return;
  }
  const bindgroup = bindgroups.get(groupIndex);
  if (bindgroup === undefined) {
    t.fail('bindgroup is undefined');
    return;
  }
  const binding = bindgroup.get(bindingIndex);
  if (binding === undefined) {
    t.fail('binding is undefined');
    return;
  }
  return binding;
}
