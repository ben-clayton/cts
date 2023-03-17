import { memcpy, TypedArrayBufferView } from '../../common/util/util.js';

import { align } from './math.js';

/**
 * Creates a buffer with the contents of some TypedArray.
 * The buffer size will always be aligned to 4 as we set mappedAtCreation === true when creating the
 * buffer.
 */
export function makeBufferWithContents(
  device: GPUDevice,
  dataArray: TypedArrayBufferView,
  usage: GPUBufferUsageFlags
): GPUBuffer {
  const buffer = device.createBuffer({
    mappedAtCreation: true,
    size: align(dataArray.byteLength, 4),
    usage,
  });
  memcpy({ src: dataArray }, { dst: buffer.getMappedRange() });
  buffer.unmap();
  return buffer;
}

export function insertBits(
  value: number,
  buffer: ArrayBufferLike,
  bitOffset: number,
  bitCount: number
) {
  const arr = new Uint32Array(buffer);
  while (bitCount > 0) {
    const wordIndex = Math.floor(bitOffset / 32);
    const wordBitOffset = bitOffset & 31;
    const wordBitCount = Math.min(bitCount, 32 - wordBitOffset);
    const wordMaskHigh =
      wordBitOffset + wordBitCount < 32 ? (1 << (wordBitOffset + wordBitCount)) - 1 : 0xffff_ffff;
    const wordMaskLow = (1 << wordBitOffset) - 1;
    const wordMask = wordMaskLow ^ wordMaskHigh;
    arr[wordIndex] = (arr[wordIndex] & ~wordMask) | ((value << wordBitOffset) & wordMask);
    bitCount -= wordBitCount;
    value >>> wordBitCount;
  }
}
