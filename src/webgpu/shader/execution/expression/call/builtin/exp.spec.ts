export const description = `
Execution tests for the 'exp' builtin function

S is AbstractFloat, f32, f16
T is S or vecN<S>
@const fn exp(e1: T ) -> T
Returns the natural exponentiation of e1 (e.g. e^e1). Component-wise when T is a vector.
`;

import { makeTestGroup } from '../../../../../../common/framework/test_group.js';
import { GPUTest } from '../../../../../gpu_test.js';
import { kValue } from '../../../../../util/constants.js';
import { TypeF32, TypeF16 } from '../../../../../util/conversion.js';
import { FP } from '../../../../../util/floating_point.js';
import { biasedRange, linearRange } from '../../../../../util/math.js';
import { makeCaseCache } from '../../case_cache.js';
import { allInputSources, run } from '../../expression.js';

import { builtin } from './builtin.js';

export const g = makeTestGroup(GPUTest);

// floor(ln(max f32 value)) = 88, so exp(88) will be within range of a f32, but exp(89) will not
// floor(ln(max f64 value)) = 709, so exp(709) can be handled by the testing framework, but exp(710) will misbehave
const f32_inputs = [
  0, // Returns 1 by definition
  -89, // Returns subnormal value
  kValue.f32.negative.min, // Closest to returning 0 as possible
  ...biasedRange(kValue.f32.negative.max, -88, 100),
  ...biasedRange(kValue.f32.positive.min, 88, 100),
  ...linearRange(89, 709, 10), // Overflows f32, but not f64
];

// floor(ln(max f16 value)) = 11, so exp(11) will be within range of a f16, but exp(12) will not
const f16_inputs = [
  0, // Returns 1 by definition
  -12, // Returns subnormal value
  kValue.f16.negative.min, // Closest to returning 0 as possible
  ...biasedRange(kValue.f16.negative.max, -11, 100),
  ...biasedRange(kValue.f16.positive.min, 11, 100),
  ...linearRange(12, 709, 10), // Overflows f16, but not f64
];

export const d = makeCaseCache('exp', {
  f32_const: () => {
    return FP.f32.generateScalarToIntervalCases(f32_inputs, 'finite', FP.f32.expInterval);
  },
  f32_non_const: () => {
    return FP.f32.generateScalarToIntervalCases(f32_inputs, 'unfiltered', FP.f32.expInterval);
  },
  f16_const: () => {
    return FP.f16.generateScalarToIntervalCases(f16_inputs, 'finite', FP.f16.expInterval);
  },
  f16_non_const: () => {
    return FP.f16.generateScalarToIntervalCases(f16_inputs, 'unfiltered', FP.f16.expInterval);
  },
});

g.test('abstract_float')
  .specURL('https://www.w3.org/TR/WGSL/#float-builtin-functions')
  .desc(`abstract float tests`)
  .params(u =>
    u.combine('inputSource', allInputSources).combine('vectorize', [undefined, 2, 3, 4] as const)
  )
  .unimplemented();

g.test('f32')
  .specURL('https://www.w3.org/TR/WGSL/#float-builtin-functions')
  .desc(`f32 tests`)
  .params(u =>
    u.combine('inputSource', allInputSources).combine('vectorize', [undefined, 2, 3, 4] as const)
  )
  .fn(async t => {
    const cases = await d.get(t.params.inputSource === 'const' ? 'f32_const' : 'f32_non_const');
    await run(t, builtin('exp'), [TypeF32], TypeF32, t.params, cases);
  });

g.test('f16')
  .specURL('https://www.w3.org/TR/WGSL/#float-builtin-functions')
  .desc(`f16 tests`)
  .params(u =>
    u.combine('inputSource', allInputSources).combine('vectorize', [undefined, 2, 3, 4] as const)
  )
  .beforeAllSubcases(t => {
    t.selectDeviceOrSkipTestCase('shader-f16');
  })
  .fn(async t => {
    const cases = await d.get(t.params.inputSource === 'const' ? 'f16_const' : 'f16_non_const');
    await run(t, builtin('exp'), [TypeF16], TypeF16, t.params, cases);
  });
