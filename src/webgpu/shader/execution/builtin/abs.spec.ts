export const description = `
Execution Tests for the 'abs' builtin function
`;

import { makeTestGroup } from '../../../../common/framework/test_group.js';
import { assert } from '../../../../common/util/util.js';
import { GPUTest } from '../../../gpu_test.js';
import { Scalar } from '../../../util/conversion.js';
import { generateTypes } from '../../types.js';

import { kBit, kValue, runShaderTest } from './builtin.js';

export const g = makeTestGroup(GPUTest);

g.test('integer_builtin_functions,abs_unsigned')
  .uniqueId('59ff84968a839124')
  .specURL('https://www.w3.org/TR/2021/WD-WGSL-20210929/#integer-builtin-functions')
  .desc(
    `
scalar case, unsigned abs:
abs(e: T ) -> T
T is u32 or vecN<u32>. Result is e.
This is provided for symmetry with abs for signed integers.
Component-wise when T is a vector.
`
  )
  .params(u =>
    u
      .combineWithParams([{ storageClass: 'storage', storageMode: 'read_write' }] as const)
      .combine('containerType', ['scalar', 'vector'] as const)
      .combine('isAtomic', [false])
      .combine('baseType', ['u32'] as const)
      .expandWithParams(generateTypes)
  )
  .fn(async t => {
    assert(t.params._kTypeInfo !== undefined, 'generated type is undefined');
    runShaderTest(
      t,
      t.params.storageClass,
      t.params.storageMode,
      t.params.type,
      t.params._kTypeInfo.arrayLength,
      'abs',
      Uint32Array,
      /* prettier-ignore */ [
        // Min and Max u32
        {input: Scalar.fromU32Bits(kBit.u32.min), expected: [Scalar.fromU32Bits(kBit.u32.min)] },
        {input: Scalar.fromU32Bits(kBit.u32.max), expected: [Scalar.fromU32Bits(kBit.u32.max)] },
        // Powers of 2: -2^i: 0 =< i =< 31
        {input: Scalar.fromU32Bits(kBit.powTwo.to0), expected: [Scalar.fromU32Bits(kBit.powTwo.to0)] },
        {input: Scalar.fromU32Bits(kBit.powTwo.to1), expected: [Scalar.fromU32Bits(kBit.powTwo.to1)] },
        {input: Scalar.fromU32Bits(kBit.powTwo.to2), expected: [Scalar.fromU32Bits(kBit.powTwo.to2)] },
        {input: Scalar.fromU32Bits(kBit.powTwo.to3), expected: [Scalar.fromU32Bits(kBit.powTwo.to3)] },
        {input: Scalar.fromU32Bits(kBit.powTwo.to4), expected: [Scalar.fromU32Bits(kBit.powTwo.to4)] },
        {input: Scalar.fromU32Bits(kBit.powTwo.to5), expected: [Scalar.fromU32Bits(kBit.powTwo.to5)] },
        {input: Scalar.fromU32Bits(kBit.powTwo.to6), expected: [Scalar.fromU32Bits(kBit.powTwo.to6)] },
        {input: Scalar.fromU32Bits(kBit.powTwo.to7), expected: [Scalar.fromU32Bits(kBit.powTwo.to7)] },
        {input: Scalar.fromU32Bits(kBit.powTwo.to8), expected: [Scalar.fromU32Bits(kBit.powTwo.to8)] },
        {input: Scalar.fromU32Bits(kBit.powTwo.to9), expected: [Scalar.fromU32Bits(kBit.powTwo.to9)] },
        {input: Scalar.fromU32Bits(kBit.powTwo.to10), expected: [Scalar.fromU32Bits(kBit.powTwo.to10)] },
        {input: Scalar.fromU32Bits(kBit.powTwo.to11), expected: [Scalar.fromU32Bits(kBit.powTwo.to11)] },
        {input: Scalar.fromU32Bits(kBit.powTwo.to12), expected: [Scalar.fromU32Bits(kBit.powTwo.to12)] },
        {input: Scalar.fromU32Bits(kBit.powTwo.to13), expected: [Scalar.fromU32Bits(kBit.powTwo.to13)] },
        {input: Scalar.fromU32Bits(kBit.powTwo.to14), expected: [Scalar.fromU32Bits(kBit.powTwo.to14)] },
        {input: Scalar.fromU32Bits(kBit.powTwo.to15), expected: [Scalar.fromU32Bits(kBit.powTwo.to15)] },
        {input: Scalar.fromU32Bits(kBit.powTwo.to16), expected: [Scalar.fromU32Bits(kBit.powTwo.to16)] },
        {input: Scalar.fromU32Bits(kBit.powTwo.to17), expected: [Scalar.fromU32Bits(kBit.powTwo.to17)] },
        {input: Scalar.fromU32Bits(kBit.powTwo.to18), expected: [Scalar.fromU32Bits(kBit.powTwo.to18)] },
        {input: Scalar.fromU32Bits(kBit.powTwo.to19), expected: [Scalar.fromU32Bits(kBit.powTwo.to19)] },
        {input: Scalar.fromU32Bits(kBit.powTwo.to20), expected: [Scalar.fromU32Bits(kBit.powTwo.to20)] },
        {input: Scalar.fromU32Bits(kBit.powTwo.to21), expected: [Scalar.fromU32Bits(kBit.powTwo.to21)] },
        {input: Scalar.fromU32Bits(kBit.powTwo.to22), expected: [Scalar.fromU32Bits(kBit.powTwo.to22)] },
        {input: Scalar.fromU32Bits(kBit.powTwo.to23), expected: [Scalar.fromU32Bits(kBit.powTwo.to23)] },
        {input: Scalar.fromU32Bits(kBit.powTwo.to24), expected: [Scalar.fromU32Bits(kBit.powTwo.to24)] },
        {input: Scalar.fromU32Bits(kBit.powTwo.to25), expected: [Scalar.fromU32Bits(kBit.powTwo.to25)] },
        {input: Scalar.fromU32Bits(kBit.powTwo.to26), expected: [Scalar.fromU32Bits(kBit.powTwo.to26)] },
        {input: Scalar.fromU32Bits(kBit.powTwo.to27), expected: [Scalar.fromU32Bits(kBit.powTwo.to27)] },
        {input: Scalar.fromU32Bits(kBit.powTwo.to28), expected: [Scalar.fromU32Bits(kBit.powTwo.to28)] },
        {input: Scalar.fromU32Bits(kBit.powTwo.to29), expected: [Scalar.fromU32Bits(kBit.powTwo.to29)] },
        {input: Scalar.fromU32Bits(kBit.powTwo.to30), expected: [Scalar.fromU32Bits(kBit.powTwo.to30)] },
        {input: Scalar.fromU32Bits(kBit.powTwo.to31), expected: [Scalar.fromU32Bits(kBit.powTwo.to31)] },
      ]
    );
  });

g.test('integer_builtin_functions,abs_signed')
  .uniqueId('d8fc581d17db6ae8')
  .specURL('https://www.w3.org/TR/2021/WD-WGSL-20210929/#integer-builtin-functions')
  .desc(
    `
signed abs:
abs(e: T ) -> T
T is i32 or vecN<i32>. The result is the absolute value of e.
Component-wise when T is a vector.
If e evaluates to the largest negative value, then the result is e.
(GLSLstd450SAbs)
`
  )
  .params(u =>
    u
      .combineWithParams([{ storageClass: 'storage', storageMode: 'read_write' }] as const)
      .combine('containerType', ['scalar', 'vector'] as const)
      .combine('isAtomic', [false])
      .combine('baseType', ['i32'] as const)
      .expandWithParams(generateTypes)
  )
  .fn(async t => {
    assert(t.params._kTypeInfo !== undefined, 'generated type is undefined');
    runShaderTest(
      t,
      t.params.storageClass,
      t.params.storageMode,
      t.params.type,
      t.params._kTypeInfo.arrayLength,
      'abs',
      Int32Array,
      /* prettier-ignore */ [
        // Min and max i32
        // If e evaluates to the largest negative value, then the result is e.
        {input: Scalar.fromI32Bits(kBit.i32.negative.min), expected: [Scalar.fromI32Bits(kBit.i32.negative.min)] },
        {input: Scalar.fromI32Bits(kBit.i32.negative.max), expected: [Scalar.fromI32Bits(kBit.i32.positive.min)] },
        {input: Scalar.fromI32Bits(kBit.i32.positive.max), expected: [Scalar.fromI32Bits(kBit.i32.positive.max)] },
        {input: Scalar.fromI32Bits(kBit.i32.positive.min), expected: [Scalar.fromI32Bits(kBit.i32.positive.min)] },
        // input: -1 * pow(2, n), n = {-31, ..., 0 }, expected: [pow(2, n), n = {-31, ..., 0}]
        {input: Scalar.fromI32Bits(kBit.negPowTwo.to0), expected: [Scalar.fromI32Bits(kBit.powTwo.to0)] },
        {input: Scalar.fromI32Bits(kBit.negPowTwo.to1), expected: [Scalar.fromI32Bits(kBit.powTwo.to1)] },
        {input: Scalar.fromI32Bits(kBit.negPowTwo.to2), expected: [Scalar.fromI32Bits(kBit.powTwo.to2)] },
        {input: Scalar.fromI32Bits(kBit.negPowTwo.to3), expected: [Scalar.fromI32Bits(kBit.powTwo.to3)] },
        {input: Scalar.fromI32Bits(kBit.negPowTwo.to4), expected: [Scalar.fromI32Bits(kBit.powTwo.to4)] },
        {input: Scalar.fromI32Bits(kBit.negPowTwo.to5), expected: [Scalar.fromI32Bits(kBit.powTwo.to5)] },
        {input: Scalar.fromI32Bits(kBit.negPowTwo.to6), expected: [Scalar.fromI32Bits(kBit.powTwo.to6)] },
        {input: Scalar.fromI32Bits(kBit.negPowTwo.to7), expected: [Scalar.fromI32Bits(kBit.powTwo.to7)] },
        {input: Scalar.fromI32Bits(kBit.negPowTwo.to8), expected: [Scalar.fromI32Bits(kBit.powTwo.to8)] },
        {input: Scalar.fromI32Bits(kBit.negPowTwo.to9), expected: [Scalar.fromI32Bits(kBit.powTwo.to9)] },
        {input: Scalar.fromI32Bits(kBit.negPowTwo.to10), expected: [Scalar.fromI32Bits(kBit.powTwo.to10)] },
        {input: Scalar.fromI32Bits(kBit.negPowTwo.to11), expected: [Scalar.fromI32Bits(kBit.powTwo.to11)] },
        {input: Scalar.fromI32Bits(kBit.negPowTwo.to12), expected: [Scalar.fromI32Bits(kBit.powTwo.to12)] },
        {input: Scalar.fromI32Bits(kBit.negPowTwo.to13), expected: [Scalar.fromI32Bits(kBit.powTwo.to13)] },
        {input: Scalar.fromI32Bits(kBit.negPowTwo.to14), expected: [Scalar.fromI32Bits(kBit.powTwo.to14)] },
        {input: Scalar.fromI32Bits(kBit.negPowTwo.to15), expected: [Scalar.fromI32Bits(kBit.powTwo.to15)] },
        {input: Scalar.fromI32Bits(kBit.negPowTwo.to16), expected: [Scalar.fromI32Bits(kBit.powTwo.to16)] },
        {input: Scalar.fromI32Bits(kBit.negPowTwo.to17), expected: [Scalar.fromI32Bits(kBit.powTwo.to17)] },
        {input: Scalar.fromI32Bits(kBit.negPowTwo.to18), expected: [Scalar.fromI32Bits(kBit.powTwo.to18)] },
        {input: Scalar.fromI32Bits(kBit.negPowTwo.to19), expected: [Scalar.fromI32Bits(kBit.powTwo.to19)] },
        {input: Scalar.fromI32Bits(kBit.negPowTwo.to20), expected: [Scalar.fromI32Bits(kBit.powTwo.to20)] },
        {input: Scalar.fromI32Bits(kBit.negPowTwo.to21), expected: [Scalar.fromI32Bits(kBit.powTwo.to21)] },
        {input: Scalar.fromI32Bits(kBit.negPowTwo.to22), expected: [Scalar.fromI32Bits(kBit.powTwo.to22)] },
        {input: Scalar.fromI32Bits(kBit.negPowTwo.to23), expected: [Scalar.fromI32Bits(kBit.powTwo.to23)] },
        {input: Scalar.fromI32Bits(kBit.negPowTwo.to24), expected: [Scalar.fromI32Bits(kBit.powTwo.to24)] },
        {input: Scalar.fromI32Bits(kBit.negPowTwo.to25), expected: [Scalar.fromI32Bits(kBit.powTwo.to25)] },
        {input: Scalar.fromI32Bits(kBit.negPowTwo.to26), expected: [Scalar.fromI32Bits(kBit.powTwo.to26)] },
        {input: Scalar.fromI32Bits(kBit.negPowTwo.to27), expected: [Scalar.fromI32Bits(kBit.powTwo.to27)] },
        {input: Scalar.fromI32Bits(kBit.negPowTwo.to28), expected: [Scalar.fromI32Bits(kBit.powTwo.to28)] },
        {input: Scalar.fromI32Bits(kBit.negPowTwo.to29), expected: [Scalar.fromI32Bits(kBit.powTwo.to29)] },
        {input: Scalar.fromI32Bits(kBit.negPowTwo.to30), expected: [Scalar.fromI32Bits(kBit.powTwo.to30)] },
        {input: Scalar.fromI32Bits(kBit.negPowTwo.to31), expected: [Scalar.fromI32Bits(kBit.powTwo.to31)] },
      ]
    );
  });

g.test('float_builtin_functions,abs_float')
  .uniqueId('2c1782b6a8dec8cb')
  .specURL('https://www.w3.org/TR/2021/WD-WGSL-20210929/#float-builtin-functions')
  .desc(
    `
float abs:
abs(e: T ) -> T
T is f32 or vecN<f32>
Returns the absolute value of e (e.g. e with a positive sign bit).
Component-wise when T is a vector. (GLSLstd450Fabs)
`
  )
  .params(u =>
    u
      .combineWithParams([{ storageClass: 'storage', storageMode: 'read_write' }] as const)
      .combine('containerType', ['scalar', 'vector'] as const)
      .combine('isAtomic', [false])
      .combine('baseType', ['f32'] as const)
      .expandWithParams(generateTypes)
  )
  .fn(async t => {
    assert(t.params._kTypeInfo !== undefined, 'generated type is undefined');
    runShaderTest(
      t,
      t.params.storageClass,
      t.params.storageMode,
      t.params.type,
      t.params._kTypeInfo.arrayLength,
      'abs',
      Float32Array,
      /* prettier-ignore */ [
        // Min and Max f32
        {input: Scalar.fromF32Bits(kBit.f32.negative.max), expected: [Scalar.fromF32Bits(0x0080_0000)] },
        {input: Scalar.fromF32Bits(kBit.f32.negative.min), expected: [Scalar.fromF32Bits(0x7f7f_ffff)] },
        {input: Scalar.fromF32Bits(kBit.f32.positive.min), expected: [Scalar.fromF32Bits(kBit.f32.positive.min)] },
        {input: Scalar.fromF32Bits(kBit.f32.positive.max), expected: [Scalar.fromF32Bits(kBit.f32.positive.max)] },

        // Subnormal f32
        // TODO(sarahM0): Check if this is needed (or if it has to fail). If yes add other values.
        {input: Scalar.fromF32Bits(kBit.f32.subnormal.positive.max), expected: [Scalar.fromF32Bits(kBit.f32.subnormal.positive.max), Scalar.fromF32(0)] },
        {input: Scalar.fromF32Bits(kBit.f32.subnormal.positive.min), expected: [Scalar.fromF32Bits(kBit.f32.subnormal.positive.min), Scalar.fromF32(0)] },

        // Infinity f32
        {input: Scalar.fromF32Bits(kBit.f32.infinity.negative), expected: [Scalar.fromF32Bits(kBit.f32.infinity.positive)] },
        {input: Scalar.fromF32Bits(kBit.f32.infinity.positive), expected: [Scalar.fromF32Bits(kBit.f32.infinity.positive)] },

        // Powers of 2.0: -2.0^i: -1 >= i >= -31
        {input: Scalar.fromF32(kValue.negPowTwo.toMinus1), expected: [Scalar.fromF32(kValue.powTwo.toMinus1)] },
        {input: Scalar.fromF32(kValue.negPowTwo.toMinus2), expected: [Scalar.fromF32(kValue.powTwo.toMinus2)] },
        {input: Scalar.fromF32(kValue.negPowTwo.toMinus3), expected: [Scalar.fromF32(kValue.powTwo.toMinus3)] },
        {input: Scalar.fromF32(kValue.negPowTwo.toMinus4), expected: [Scalar.fromF32(kValue.powTwo.toMinus4)] },
        {input: Scalar.fromF32(kValue.negPowTwo.toMinus5), expected: [Scalar.fromF32(kValue.powTwo.toMinus5)] },
        {input: Scalar.fromF32(kValue.negPowTwo.toMinus6), expected: [Scalar.fromF32(kValue.powTwo.toMinus6)] },
        {input: Scalar.fromF32(kValue.negPowTwo.toMinus7), expected: [Scalar.fromF32(kValue.powTwo.toMinus7)] },
        {input: Scalar.fromF32(kValue.negPowTwo.toMinus8), expected: [Scalar.fromF32(kValue.powTwo.toMinus8)] },
        {input: Scalar.fromF32(kValue.negPowTwo.toMinus9), expected: [Scalar.fromF32(kValue.powTwo.toMinus9)] },
        {input: Scalar.fromF32(kValue.negPowTwo.toMinus10), expected: [Scalar.fromF32(kValue.powTwo.toMinus10)] },
        {input: Scalar.fromF32(kValue.negPowTwo.toMinus11), expected: [Scalar.fromF32(kValue.powTwo.toMinus11)] },
        {input: Scalar.fromF32(kValue.negPowTwo.toMinus12), expected: [Scalar.fromF32(kValue.powTwo.toMinus12)] },
        {input: Scalar.fromF32(kValue.negPowTwo.toMinus13), expected: [Scalar.fromF32(kValue.powTwo.toMinus13)] },
        {input: Scalar.fromF32(kValue.negPowTwo.toMinus14), expected: [Scalar.fromF32(kValue.powTwo.toMinus14)] },
        {input: Scalar.fromF32(kValue.negPowTwo.toMinus15), expected: [Scalar.fromF32(kValue.powTwo.toMinus15)] },
        {input: Scalar.fromF32(kValue.negPowTwo.toMinus16), expected: [Scalar.fromF32(kValue.powTwo.toMinus16)] },
        {input: Scalar.fromF32(kValue.negPowTwo.toMinus17), expected: [Scalar.fromF32(kValue.powTwo.toMinus17)] },
        {input: Scalar.fromF32(kValue.negPowTwo.toMinus18), expected: [Scalar.fromF32(kValue.powTwo.toMinus18)] },
        {input: Scalar.fromF32(kValue.negPowTwo.toMinus19), expected: [Scalar.fromF32(kValue.powTwo.toMinus19)] },
        {input: Scalar.fromF32(kValue.negPowTwo.toMinus20), expected: [Scalar.fromF32(kValue.powTwo.toMinus20)] },
        {input: Scalar.fromF32(kValue.negPowTwo.toMinus21), expected: [Scalar.fromF32(kValue.powTwo.toMinus21)] },
        {input: Scalar.fromF32(kValue.negPowTwo.toMinus22), expected: [Scalar.fromF32(kValue.powTwo.toMinus22)] },
        {input: Scalar.fromF32(kValue.negPowTwo.toMinus23), expected: [Scalar.fromF32(kValue.powTwo.toMinus23)] },
        {input: Scalar.fromF32(kValue.negPowTwo.toMinus24), expected: [Scalar.fromF32(kValue.powTwo.toMinus24)] },
        {input: Scalar.fromF32(kValue.negPowTwo.toMinus25), expected: [Scalar.fromF32(kValue.powTwo.toMinus25)] },
        {input: Scalar.fromF32(kValue.negPowTwo.toMinus26), expected: [Scalar.fromF32(kValue.powTwo.toMinus26)] },
        {input: Scalar.fromF32(kValue.negPowTwo.toMinus27), expected: [Scalar.fromF32(kValue.powTwo.toMinus27)] },
        {input: Scalar.fromF32(kValue.negPowTwo.toMinus28), expected: [Scalar.fromF32(kValue.powTwo.toMinus28)] },
        {input: Scalar.fromF32(kValue.negPowTwo.toMinus29), expected: [Scalar.fromF32(kValue.powTwo.toMinus29)] },
        {input: Scalar.fromF32(kValue.negPowTwo.toMinus30), expected: [Scalar.fromF32(kValue.powTwo.toMinus30)] },
        {input: Scalar.fromF32(kValue.negPowTwo.toMinus31), expected: [Scalar.fromF32(kValue.powTwo.toMinus31)] },

        // Powers of 2.0: -2.0^i: 1 <= i <= 31
        {input: Scalar.fromF32(kValue.negPowTwo.to1), expected: [Scalar.fromF32(kValue.powTwo.to1)] },
        {input: Scalar.fromF32(kValue.negPowTwo.to2), expected: [Scalar.fromF32(kValue.powTwo.to2)] },
        {input: Scalar.fromF32(kValue.negPowTwo.to3), expected: [Scalar.fromF32(kValue.powTwo.to3)] },
        {input: Scalar.fromF32(kValue.negPowTwo.to4), expected: [Scalar.fromF32(kValue.powTwo.to4)] },
        {input: Scalar.fromF32(kValue.negPowTwo.to5), expected: [Scalar.fromF32(kValue.powTwo.to5)] },
        {input: Scalar.fromF32(kValue.negPowTwo.to6), expected: [Scalar.fromF32(kValue.powTwo.to6)] },
        {input: Scalar.fromF32(kValue.negPowTwo.to7), expected: [Scalar.fromF32(kValue.powTwo.to7)] },
        {input: Scalar.fromF32(kValue.negPowTwo.to8), expected: [Scalar.fromF32(kValue.powTwo.to8)] },
        {input: Scalar.fromF32(kValue.negPowTwo.to9), expected: [Scalar.fromF32(kValue.powTwo.to9)] },
        {input: Scalar.fromF32(kValue.negPowTwo.to10), expected: [Scalar.fromF32(kValue.powTwo.to10)] },
        {input: Scalar.fromF32(kValue.negPowTwo.to11), expected: [Scalar.fromF32(kValue.powTwo.to11)] },
        {input: Scalar.fromF32(kValue.negPowTwo.to12), expected: [Scalar.fromF32(kValue.powTwo.to12)] },
        {input: Scalar.fromF32(kValue.negPowTwo.to13), expected: [Scalar.fromF32(kValue.powTwo.to13)] },
        {input: Scalar.fromF32(kValue.negPowTwo.to14), expected: [Scalar.fromF32(kValue.powTwo.to14)] },
        {input: Scalar.fromF32(kValue.negPowTwo.to15), expected: [Scalar.fromF32(kValue.powTwo.to15)] },
        {input: Scalar.fromF32(kValue.negPowTwo.to16), expected: [Scalar.fromF32(kValue.powTwo.to16)] },
        {input: Scalar.fromF32(kValue.negPowTwo.to17), expected: [Scalar.fromF32(kValue.powTwo.to17)] },
        {input: Scalar.fromF32(kValue.negPowTwo.to18), expected: [Scalar.fromF32(kValue.powTwo.to18)] },
        {input: Scalar.fromF32(kValue.negPowTwo.to19), expected: [Scalar.fromF32(kValue.powTwo.to19)] },
        {input: Scalar.fromF32(kValue.negPowTwo.to20), expected: [Scalar.fromF32(kValue.powTwo.to20)] },
        {input: Scalar.fromF32(kValue.negPowTwo.to21), expected: [Scalar.fromF32(kValue.powTwo.to21)] },
        {input: Scalar.fromF32(kValue.negPowTwo.to22), expected: [Scalar.fromF32(kValue.powTwo.to22)] },
        {input: Scalar.fromF32(kValue.negPowTwo.to23), expected: [Scalar.fromF32(kValue.powTwo.to23)] },
        {input: Scalar.fromF32(kValue.negPowTwo.to24), expected: [Scalar.fromF32(kValue.powTwo.to24)] },
        {input: Scalar.fromF32(kValue.negPowTwo.to25), expected: [Scalar.fromF32(kValue.powTwo.to25)] },
        {input: Scalar.fromF32(kValue.negPowTwo.to26), expected: [Scalar.fromF32(kValue.powTwo.to26)] },
        {input: Scalar.fromF32(kValue.negPowTwo.to27), expected: [Scalar.fromF32(kValue.powTwo.to27)] },
        {input: Scalar.fromF32(kValue.negPowTwo.to28), expected: [Scalar.fromF32(kValue.powTwo.to28)] },
        {input: Scalar.fromF32(kValue.negPowTwo.to29), expected: [Scalar.fromF32(kValue.powTwo.to29)] },
        {input: Scalar.fromF32(kValue.negPowTwo.to30), expected: [Scalar.fromF32(kValue.powTwo.to30)] },
        {input: Scalar.fromF32(kValue.negPowTwo.to31), expected: [Scalar.fromF32(kValue.powTwo.to31)] },
      ]
    );
  });
