import { standardizeExtent3D } from '../../util/unions.js';

/**
 * Compute the maximum mip level count allowed for a given texture size and texture dimension.
 */
export function maxMipLevelCount({
  size,
  dimension = '2d',
}: {
  readonly size: Readonly<GPUExtent3DDict> | readonly number[];
  readonly dimension?: GPUTextureDimension;
}): number {
  const sizeDict = standardizeExtent3D(size);

  let maxMippedDimension = sizeDict.width;
  if (dimension !== '1d') maxMippedDimension = Math.max(maxMippedDimension, sizeDict.height);
  if (dimension === '3d')
    maxMippedDimension = Math.max(maxMippedDimension, sizeDict.depthOrArrayLayers);
  return Math.floor(Math.log2(maxMippedDimension)) + 1;
}
