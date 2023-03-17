// Implements utilities for dealing with small float datatypes
// https://www.khronos.org/opengl/wiki/Small_Float_Formats

export class UFloat {
  constructor(numExponentBits: number, numMantissaBits: number) {
    this.numExponentBits = numExponentBits;
    this.numMantissaBits = numMantissaBits;
    this.mantissaMask = (1 << numMantissaBits) - 1;
    this.exponentMask = ((1 << numExponentBits) - 1) << numMantissaBits;
    this.exponentBias = (1 << (numExponentBits - 1)) - 1;
    this.highestEncoded = (((1 << numExponentBits) - 2) << numMantissaBits) | this.mantissaMask;
    this.highest = this.fromBits(this.highestEncoded);
    this.smallest = this.fromBits(1 << numMantissaBits);
    this.smallestSubnormal = this.fromBits(1);
    this.lowest = 0;
  }

  public fromBits(bits: number): number {
    if (bits === 0) {
      return 0;
    }
    const mantissa = bits & this.mantissaMask;
    if ((bits & this.exponentMask) === this.exponentMask) {
      return mantissa === 0 ? Number.POSITIVE_INFINITY : Number.NaN;
    }
    const unbiasedExponent = (bits & this.exponentMask) >>> this.numMantissaBits;
    const exponent = unbiasedExponent - this.exponentBias;
    return Math.pow(2, exponent) * (1 + mantissa / (1 << this.numMantissaBits));
  }

  public toBits(number: number): number {
    if (!Number.isFinite(number)) {
      if (number === Number.POSITIVE_INFINITY) {
        return this.exponentMask;
      }
      if (number === Number.NEGATIVE_INFINITY) {
        return 0;
      }
      return this.exponentMask | this.mantissaMask; // NaN
    }
    if (number < this.smallestSubnormal) {
      return 0;
    }
    if (number > this.highest) {
      return this.highest;
    }
    const exponent = Math.floor(Math.log2(number));
    const mantissa = (number / Math.pow(2, exponent) - 1) * (1 << this.numMantissaBits);
    return ((exponent + this.exponentBias) << this.numMantissaBits) | mantissa;
  }

  public quantize(number: number): number {
    return this.fromBits(this.toBits(number));
  }

  public readonly numExponentBits: number;
  public readonly numMantissaBits: number;
  public readonly mantissaMask: number;
  public readonly exponentMask: number;
  public readonly exponentBias: number;
  public readonly highestEncoded: number;
  public readonly highest: number;
  public readonly lowest: number;
  public readonly smallest: number;
  public readonly smallestSubnormal: number;
}

export const ufloat10 = new UFloat(5, 5);

export const ufloat11 = new UFloat(5, 6);
