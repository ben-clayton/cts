export const description = `
Utilities for the 'ufloat' helper.
`;

import { makeTestGroup } from '../common/internal/test_group.js';
import { ufloat10, ufloat11 } from '../webgpu/util/ufloat.js';

import { UnitTest } from './unit_test.js';

export const g = makeTestGroup(UnitTest);

function equal<T>(name: string, got: T, expected: T): Error | undefined {
  if (Number.isNaN(got) && Number.isNaN(expected)) {
    return undefined;
  }
  if (got !== expected) {
    return new Error(`${name} was not as expected
expected: ${expected}
got:      ${got}`);
  }
  return undefined;
}

g.test('ufloat10_constants').fn(t => {
  t.expectOK(equal('numExponentBits', ufloat10.numExponentBits, 5));
  t.expectOK(equal('numMantissaBits', ufloat10.numMantissaBits, 5));
  t.expectOK(equal('mantissaMask', ufloat10.mantissaMask, 0b00000_11111));
  t.expectOK(equal('exponentMask', ufloat10.exponentMask, 0b11111_00000));
  t.expectOK(equal('exponentBias', ufloat10.exponentBias, 15));
  t.expectOK(equal('highestEncoded', ufloat10.highestEncoded, 0b11110_11111));
  t.expectOK(equal('highest', ufloat10.highest, 64512));
  t.expectOK(equal('lowest', ufloat10.lowest, 0));
  t.expectOK(equal('smallest', ufloat10.smallest, 0.00006103515625));
  t.expectOK(equal('smallestSubnormal', ufloat10.smallestSubnormal, 0.00003147125244140625));
});

interface Case {
  float: number;
  bits: number;
}

const ufloat10Cases: Case[] = [
  { float: 0, bits: 0b00000_00000 },
  { float: 0.125, bits: 0b01100_00000 },
  { float: 0.25, bits: 0b01101_00000 },
  { float: 0.5, bits: 0b01110_00000 },
  { float: 1, bits: 0b01111_00000 },
  { float: 2, bits: 0b10000_00000 },
  { float: 4, bits: 0b10001_00000 },
  { float: 8, bits: 0b10010_00000 },
  { float: 16, bits: 0b10011_00000 },
  { float: 32, bits: 0b10100_00000 },

  { float: ufloat10.smallestSubnormal, bits: 0b00000_00001 },
  { float: ufloat10.smallest, bits: 0b00001_00000 },
  { float: 1.03125, bits: 0b01111_00001 },
  { float: 1.0625, bits: 0b01111_00010 },
  { float: 1.09375, bits: 0b01111_00011 },
  { float: 1.125, bits: 0b01111_00100 },
  { float: 1.15625, bits: 0b01111_00101 },
  { float: 1.1875, bits: 0b01111_00110 },
  { float: 1.21875, bits: 0b01111_00111 },
  { float: ufloat10.highest, bits: 0b11110_11111 },

  { float: Number.POSITIVE_INFINITY, bits: 0b11111_00000 },
  { float: Number.NaN, bits: 0b11111_11111 },
];

g.test('ufloat10_fromBits')
  .paramsSimple<Case>(ufloat10Cases)
  .fn(t => {
    t.expectOK(equal(`fromBits`, ufloat10.fromBits(t.params.bits), t.params.float));
  });

g.test('ufloat10_toBits')
  .paramsSimple<Case>(ufloat10Cases)
  .fn(t => {
    t.expectOK(equal(`toBits`, ufloat10.toBits(t.params.float), t.params.bits));
  });

g.test('ufloat10_quantize')
  .params(u => u.combineWithParams(ufloat10Cases).combine('epsilon', [0, 1e-20]))
  .fn(t => {
    t.expectOK(
      equal(`quantize`, ufloat10.quantize(t.params.float + t.params.epsilon), t.params.float)
    );
  });

const ufloat11Cases: Case[] = [
  { float: 0, bits: 0b00000_000000 },
  { float: 0.125, bits: 0b01100_000000 },
  { float: 0.25, bits: 0b01101_000000 },
  { float: 0.5, bits: 0b01110_000000 },
  { float: 1, bits: 0b01111_000000 },
  { float: 2, bits: 0b10000_000000 },
  { float: 4, bits: 0b10001_000000 },
  { float: 8, bits: 0b10010_000000 },
  { float: 16, bits: 0b10011_000000 },
  { float: 32, bits: 0b10100_000000 },

  { float: ufloat11.smallestSubnormal, bits: 0b00000_000001 },
  { float: ufloat11.smallest, bits: 0b00001_000000 },
  { float: 1.015625, bits: 0b01111_000001 },
  { float: 1.03125, bits: 0b01111_000010 },
  { float: 1.046875, bits: 0b01111_000011 },
  { float: 1.0625, bits: 0b01111_000100 },
  { float: 1.078125, bits: 0b01111_000101 },
  { float: 1.09375, bits: 0b01111_000110 },
  { float: 1.109375, bits: 0b01111_000111 },
  { float: ufloat11.highest, bits: 0b11110_111111 },

  { float: Number.POSITIVE_INFINITY, bits: 0b11111_000000 },
  { float: Number.NaN, bits: 0b11111_111111 },
];

g.test('ufloat11_fromBits')
  .paramsSimple<Case>(ufloat11Cases)
  .fn(t => {
    t.expectOK(equal(`fromBits`, ufloat11.fromBits(t.params.bits), t.params.float));
  });

g.test('ufloat11_toBits')
  .paramsSimple<Case>(ufloat11Cases)
  .fn(t => {
    t.expectOK(equal(`toBits`, ufloat11.toBits(t.params.float), t.params.bits));
  });

g.test('ufloat11_quantize')
  .params(u => u.combineWithParams(ufloat11Cases).combine('epsilon', [0, 1e-20]))
  .fn(t => {
    t.expectOK(
      equal(`quantize`, ufloat11.quantize(t.params.float + t.params.epsilon), t.params.float)
    );
  });
