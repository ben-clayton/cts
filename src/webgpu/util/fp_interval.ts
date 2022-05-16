import { assert } from '../../common/util/util.js';

import { kValue } from './constants.js';
import { flushSubnormalNumber, nextAfter, oneULP } from './math.js';

export class FPInterval {
  public readonly begin: number;
  public readonly end: number;

  public constructor(begin: number, end: number) {
    assert(begin <= end, `begin (${begin}) must be equal or before end (${end})`);
    assert(!Number.isNaN(begin), `begin must not be NaN`);
    assert(!Number.isNaN(end), `end must not be NaN`);

    if (begin === Number.NEGATIVE_INFINITY || begin < kValue.f32.negative.min) {
      this.begin = Number.NEGATIVE_INFINITY;
    } else if (begin === Number.POSITIVE_INFINITY || begin > kValue.f32.positive.max) {
      this.begin = kValue.f32.positive.max;
    } else {
      this.begin = begin;
    }

    if (end === Number.POSITIVE_INFINITY || end > kValue.f32.positive.max) {
      this.end = Number.POSITIVE_INFINITY;
    } else if (end === Number.NEGATIVE_INFINITY || end < kValue.f32.negative.min) {
      this.end = kValue.f32.negative.min;
    } else {
      this.end = end;
    }
  }

  public contains(x: number): boolean {
    return this.begin <= x && x <= this.end;
  }

  static span(...intervals: FPInterval[]): FPInterval {
    assert(intervals.length > 0, `span of an empty list of FPIntervals is not allowed`);
    const mins = new Set<number>();
    const maxs = new Set<number>();
    intervals.forEach(i => {
      mins.add(i.begin);
      maxs.add(i.end);
    });
    return new FPInterval(Math.min(...mins), Math.max(...maxs));
  }

  public toString(): string {
    return `[${this.begin}, ${this.end}]`;
  }
}

function begin(n: number | FPInterval): number {
  const i = n as FPInterval;
  return i.begin !== undefined ? i.begin : (n as number);
}

function end(n: number | FPInterval): number {
  const i = n as FPInterval;
  return i.end !== undefined ? i.end : (n as number);
}

export interface NumberToInterval {
  (x: number): FPInterval;
}

export function flushInterval(n: number, fn: NumberToInterval) {
  return FPInterval.span(fn(n), fn(flushSubnormalNumber(n)));
}

export function absoluteInterval(n: number, rng: number): FPInterval {
  rng = Math.abs(rng);
  return flushInterval(n, (n: number) => {
    assert(!Number.isNaN(n), `absolute not defined for NaN`);
    return new FPInterval(n - rng, n + rng);
  });
}

export function correctlyRoundedFPInterval(n: number): NumberToInterval {
  return (x: number) => {
    if (x === Number.POSITIVE_INFINITY || x > kValue.f32.positive.max) {
      return new FPInterval(kValue.f32.positive.max, Number.POSITIVE_INFINITY);
    }

    if (x === Number.NEGATIVE_INFINITY || x < kValue.f32.negative.min) {
      return new FPInterval(Number.NEGATIVE_INFINITY, kValue.f32.negative.min);
    }

    const x_32 = new Float32Array([x])[0];
    const converted: number = x_32;
    if (x === converted) {
      // x is precisely expressible as a f32, so correctly rounding degrades to exactly matching
      return new FPInterval(x, x);
    }

    if (converted > x) {
      // x_32 rounded towards +inf, so is after x
      const otherside = nextAfter(x_32, false, false).value as number;
      return new FPInterval(otherside, converted);
    } else {
      // x_32 rounded towards -inf, so is before x
      const otherside = nextAfter(x_32, false, false).value as number;
      return new FPInterval(converted, otherside);
    }
  };
}

export function ulpInterval(n: number, numULP: number): FPInterval {
  numULP = Math.abs(numULP);
  const ulp_flush = oneULP(n, true);
  const ulp_noflush = oneULP(n, false);
  const ulp = Math.max(ulp_flush, ulp_noflush);
  return new FPInterval(n - numULP * ulp, n + numULP * ulp);
}

export function divInterval(x: number | FPInterval, y: number | FPInterval): FPInterval {
  const numULP = 2.5;

  const div = (x: number, y: number): FPInterval => {
    assert(y !== 0, `division by 0 is not defined`);
    return FPInterval.span(
      ulpInterval(x / y, numULP),
      ulpInterval(flushSubnormalNumber(x) / y, numULP)
    );
  };

  const x_b = begin(x);
  const x_e = end(x);
  const y_b = begin(y);
  const y_e = end(y);

  if (x_b === x_e && y_b === y_e) {
    return div(x_b, y_b);
  }
  return FPInterval.span(div(x_b, y_b), div(x_b, y_e), div(x_e, y_b), div(x_e, y_e));
}

export function cosInterval(n: number): FPInterval {
  return flushInterval(n, (n: number) => absoluteInterval(Math.cos(n), 2 ** -11));
}

export function sinInterval(n: number): FPInterval {
  return flushInterval(n, (n: number) => absoluteInterval(Math.sin(n), 2 ** -11));
}

export function tanInterval(n: number): FPInterval {
  return flushInterval(n, (n: number) => divInterval(sinInterval(n), cosInterval(n)));
}
