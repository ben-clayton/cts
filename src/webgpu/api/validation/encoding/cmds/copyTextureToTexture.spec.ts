export const description = `
copyTextureToTexture tests.

Test Plan: (TODO(jiawei.shao@intel.com): add tests on 1D/3D textures)
* the source and destination texture
  - the {source, destination} texture is {invalid, valid}.
  - mipLevel {>, =, <} the mipmap level count of the {source, destination} texture.
  - the source texture is created {with, without} GPUTextureUsage::CopySrc.
  - the destination texture is created {with, without} GPUTextureUsage::CopyDst.
* sample count
  - the sample count of the source texture {is, isn't} equal to the one of the destination texture
  - when the sample count is greater than 1:
    - it {is, isn't} a copy of the whole subresource of the source texture.
    - it {is, isn't} a copy of the whole subresource of the destination texture.
* texture format
  - the format of the source texture {is, isn't} equal to the one of the destination texture.
    - including: depth24plus-stencil8 to/from {depth24plus, stencil8}.
  - for each depth and/or stencil format: a copy between two textures with same format:
    - it {is, isn't} a copy of the whole subresource of the {source, destination} texture.
* copy ranges
  - if the texture dimension is 2D:
    - (srcOrigin.x + copyExtent.width) {>, =, <} the width of the subresource size of source
      textureCopyView.
    - (srcOrigin.y + copyExtent.height) {>, =, <} the height of the subresource size of source
      textureCopyView.
    - (srcOrigin.z + copyExtent.depthOrArrayLayers) {>, =, <} the depthOrArrayLayers of the subresource size of source
      textureCopyView.
    - (dstOrigin.x + copyExtent.width) {>, =, <} the width of the subresource size of destination
      textureCopyView.
    - (dstOrigin.y + copyExtent.height) {>, =, <} the height of the subresource size of destination
      textureCopyView.
    - (dstOrigin.z + copyExtent.depthOrArrayLayers) {>, =, <} the depthOrArrayLayers of the subresource size of destination
      textureCopyView.
* when the source and destination texture are the same one:
  - the set of source texture subresources {has, doesn't have} overlaps with the one of destination
    texture subresources.
`;

import { makeTestGroup } from '../../../../../common/framework/test_group.js';
import {
  kAllTextureFormatInfo,
  kAllTextureFormats,
  kCompressedTextureFormats,
  kDepthStencilFormats,
  kTextureUsages,
} from '../../../../capability_info.js';
import { align } from '../../../../util/math.js';
import { ValidationTest } from '../../validation_test.js';

class F extends ValidationTest {
  TestCopyTextureToTexture(
    source: GPUImageCopyTexture,
    destination: GPUImageCopyTexture,
    copySize: GPUExtent3D,
    isSuccess: boolean
  ): void {
    const commandEncoder = this.device.createCommandEncoder();
    commandEncoder.copyTextureToTexture(source, destination, copySize);

    this.expectValidationError(() => {
      commandEncoder.finish();
    }, !isSuccess);
  }

  GetPhysicalSubresourceSize(
    textureSize: Required<GPUExtent3DDict>,
    format: GPUTextureFormat,
    mipLevel: number
  ): Required<GPUExtent3DDict> {
    const virtualWidthAtLevel = Math.max(textureSize.width >> mipLevel, 1);
    const virtualHeightAtLevel = Math.max(textureSize.height >> mipLevel, 1);
    const physicalWidthAtLevel = align(
      virtualWidthAtLevel,
      kAllTextureFormatInfo[format].blockWidth
    );
    const physicalHeightAtLevel = align(
      virtualHeightAtLevel,
      kAllTextureFormatInfo[format].blockHeight
    );
    return {
      width: physicalWidthAtLevel,
      height: physicalHeightAtLevel,
      depthOrArrayLayers: textureSize.depthOrArrayLayers,
    };
  }
}

export const g = makeTestGroup(F);

g.test('copy_with_invalid_texture').fn(async t => {
  const validTexture = t.device.createTexture({
    size: { width: 4, height: 4, depthOrArrayLayers: 1 },
    format: 'rgba8unorm',
    usage: GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST,
  });

  const errorTexture = t.getErrorTexture();

  t.TestCopyTextureToTexture(
    { texture: errorTexture },
    { texture: validTexture },
    { width: 1, height: 1, depthOrArrayLayers: 1 },
    false
  );
  t.TestCopyTextureToTexture(
    { texture: validTexture },
    { texture: errorTexture },
    { width: 1, height: 1, depthOrArrayLayers: 1 },
    false
  );
});

g.test('mipmap_level')
  .paramsSubcasesOnly([
    { srcLevelCount: 1, dstLevelCount: 1, srcCopyLevel: 0, dstCopyLevel: 0 },
    { srcLevelCount: 1, dstLevelCount: 1, srcCopyLevel: 1, dstCopyLevel: 0 },
    { srcLevelCount: 1, dstLevelCount: 1, srcCopyLevel: 0, dstCopyLevel: 1 },
    { srcLevelCount: 3, dstLevelCount: 3, srcCopyLevel: 0, dstCopyLevel: 0 },
    { srcLevelCount: 3, dstLevelCount: 3, srcCopyLevel: 2, dstCopyLevel: 0 },
    { srcLevelCount: 3, dstLevelCount: 3, srcCopyLevel: 3, dstCopyLevel: 0 },
    { srcLevelCount: 3, dstLevelCount: 3, srcCopyLevel: 0, dstCopyLevel: 2 },
    { srcLevelCount: 3, dstLevelCount: 3, srcCopyLevel: 0, dstCopyLevel: 3 },
  ] as const)

  .fn(async t => {
    const { srcLevelCount, dstLevelCount, srcCopyLevel, dstCopyLevel } = t.params;

    const srcTexture = t.device.createTexture({
      size: { width: 32, height: 32, depthOrArrayLayers: 1 },
      format: 'rgba8unorm',
      usage: GPUTextureUsage.COPY_SRC,
      mipLevelCount: srcLevelCount,
    });
    const dstTexture = t.device.createTexture({
      size: { width: 32, height: 32, depthOrArrayLayers: 1 },
      format: 'rgba8unorm',
      usage: GPUTextureUsage.COPY_DST,
      mipLevelCount: dstLevelCount,
    });

    const isSuccess = srcCopyLevel < srcLevelCount && dstCopyLevel < dstLevelCount;
    t.TestCopyTextureToTexture(
      { texture: srcTexture, mipLevel: srcCopyLevel },
      { texture: dstTexture, mipLevel: dstCopyLevel },
      { width: 1, height: 1, depthOrArrayLayers: 1 },
      isSuccess
    );
  });

g.test('texture_usage')
  .paramsSubcasesOnly(u =>
    u //
      .combine('srcUsage', kTextureUsages)
      .combine('dstUsage', kTextureUsages)
  )
  .fn(async t => {
    const { srcUsage, dstUsage } = t.params;

    const srcTexture = t.device.createTexture({
      size: { width: 4, height: 4, depthOrArrayLayers: 1 },
      format: 'rgba8unorm',
      usage: srcUsage,
    });
    const dstTexture = t.device.createTexture({
      size: { width: 4, height: 4, depthOrArrayLayers: 1 },
      format: 'rgba8unorm',
      usage: dstUsage,
    });

    const isSuccess =
      srcUsage === GPUTextureUsage.COPY_SRC && dstUsage === GPUTextureUsage.COPY_DST;

    t.TestCopyTextureToTexture(
      { texture: srcTexture },
      { texture: dstTexture },
      { width: 1, height: 1, depthOrArrayLayers: 1 },
      isSuccess
    );
  });

g.test('sample_count')
  .paramsSubcasesOnly(u =>
    u //
      .combine('srcSampleCount', [1, 4])
      .combine('dstSampleCount', [1, 4])
  )
  .fn(async t => {
    const { srcSampleCount, dstSampleCount } = t.params;

    const srcTexture = t.device.createTexture({
      size: { width: 4, height: 4, depthOrArrayLayers: 1 },
      format: 'rgba8unorm',
      usage: GPUTextureUsage.COPY_SRC,
      sampleCount: srcSampleCount,
    });
    const dstTexture = t.device.createTexture({
      size: { width: 4, height: 4, depthOrArrayLayers: 1 },
      format: 'rgba8unorm',
      usage: GPUTextureUsage.COPY_DST,
      sampleCount: dstSampleCount,
    });

    const isSuccess = srcSampleCount === dstSampleCount;
    t.TestCopyTextureToTexture(
      { texture: srcTexture },
      { texture: dstTexture },
      { width: 4, height: 4, depthOrArrayLayers: 1 },
      isSuccess
    );
  });

g.test('multisampled_copy_restrictions')
  .paramsSubcasesOnly(u =>
    u //
      .combine('srcCopyOrigin', [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 1, y: 1, z: 0 },
      ])
      .combine('dstCopyOrigin', [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 1, y: 1, z: 0 },
      ])
      .expand('copyWidth', p => [32 - Math.max(p.srcCopyOrigin.x, p.dstCopyOrigin.x), 16])
      .expand('copyHeight', p => [16 - Math.max(p.srcCopyOrigin.y, p.dstCopyOrigin.y), 8])
  )
  .fn(async t => {
    const { srcCopyOrigin, dstCopyOrigin, copyWidth, copyHeight } = t.params;

    const kWidth = 32;
    const kHeight = 16;

    // Currently we don't support multisampled 2D array textures and the mipmap level count of the
    // multisampled textures must be 1.
    const srcTexture = t.device.createTexture({
      size: { width: kWidth, height: kHeight, depthOrArrayLayers: 1 },
      format: 'rgba8unorm',
      usage: GPUTextureUsage.COPY_SRC,
      sampleCount: 4,
    });
    const dstTexture = t.device.createTexture({
      size: { width: kWidth, height: kHeight, depthOrArrayLayers: 1 },
      format: 'rgba8unorm',
      usage: GPUTextureUsage.COPY_DST,
      sampleCount: 4,
    });

    const isSuccess = copyWidth === kWidth && copyHeight === kHeight;
    t.TestCopyTextureToTexture(
      { texture: srcTexture, origin: srcCopyOrigin },
      { texture: dstTexture, origin: dstCopyOrigin },
      { width: copyWidth, height: copyHeight, depthOrArrayLayers: 1 },
      isSuccess
    );
  });

g.test('texture_format_equality')
  .paramsSubcasesOnly(u =>
    u //
      .combine('srcFormat', kAllTextureFormats)
      .combine('dstFormat', kAllTextureFormats)
  )
  .fn(async t => {
    const { srcFormat, dstFormat } = t.params;
    const srcFormatInfo = kAllTextureFormatInfo[srcFormat];
    const dstFormatInfo = kAllTextureFormatInfo[dstFormat];
    await t.selectDeviceOrSkipTestCase([srcFormatInfo.feature, dstFormatInfo.feature]);

    const kTextureSize = { width: 16, height: 16, depthOrArrayLayers: 1 };

    const srcTexture = t.device.createTexture({
      size: kTextureSize,
      format: srcFormat,
      usage: GPUTextureUsage.COPY_SRC,
    });

    const dstTexture = t.device.createTexture({
      size: kTextureSize,
      format: dstFormat,
      usage: GPUTextureUsage.COPY_DST,
    });

    const isSuccess = srcFormat === dstFormat;
    t.TestCopyTextureToTexture(
      { texture: srcTexture },
      { texture: dstTexture },
      kTextureSize,
      isSuccess
    );
  });

g.test('depth_stencil_copy_restrictions')
  .params(u =>
    u
      .combine('format', kDepthStencilFormats)
      .beginSubcases()
      .combine('copyBoxOffsets', [
        { x: 0, y: 0, width: 0, height: 0 },
        { x: 1, y: 0, width: 0, height: 0 },
        { x: 0, y: 1, width: 0, height: 0 },
        { x: 0, y: 0, width: -1, height: 0 },
        { x: 0, y: 0, width: 0, height: -1 },
      ])
      .combine('srcTextureSize', [
        { width: 64, height: 64, depthOrArrayLayers: 1 },
        { width: 64, height: 32, depthOrArrayLayers: 1 },
        { width: 32, height: 32, depthOrArrayLayers: 1 },
      ])
      .combine('dstTextureSize', [
        { width: 64, height: 64, depthOrArrayLayers: 1 },
        { width: 64, height: 32, depthOrArrayLayers: 1 },
        { width: 32, height: 32, depthOrArrayLayers: 1 },
      ])
      .combine('srcCopyLevel', [1, 2])
      .combine('dstCopyLevel', [0, 1])
  )
  .fn(async t => {
    const {
      format,
      copyBoxOffsets,
      srcTextureSize,
      dstTextureSize,
      srcCopyLevel,
      dstCopyLevel,
    } = t.params;
    await t.selectDeviceOrSkipTestCase(kAllTextureFormatInfo[format].feature);

    const kMipLevelCount = 3;

    const srcTexture = t.device.createTexture({
      size: { width: srcTextureSize.width, height: srcTextureSize.height, depthOrArrayLayers: 1 },
      format,
      mipLevelCount: kMipLevelCount,
      usage: GPUTextureUsage.COPY_SRC,
    });
    const dstTexture = t.device.createTexture({
      size: { width: dstTextureSize.width, height: dstTextureSize.height, depthOrArrayLayers: 1 },
      format,
      mipLevelCount: kMipLevelCount,
      usage: GPUTextureUsage.COPY_DST,
    });

    const srcSizeAtLevel = t.GetPhysicalSubresourceSize(srcTextureSize, format, srcCopyLevel);
    const dstSizeAtLevel = t.GetPhysicalSubresourceSize(dstTextureSize, format, dstCopyLevel);

    const copyOrigin = { x: copyBoxOffsets.x, y: copyBoxOffsets.y, z: 0 };

    const copyWidth =
      Math.min(srcSizeAtLevel.width, dstSizeAtLevel.width) + copyBoxOffsets.width - copyOrigin.x;
    const copyHeight =
      Math.min(srcSizeAtLevel.height, dstSizeAtLevel.height) + copyBoxOffsets.height - copyOrigin.y;

    // Depth/stencil copies must copy whole subresources.
    const isSuccess =
      copyOrigin.x === 0 &&
      copyOrigin.y === 0 &&
      copyWidth === srcSizeAtLevel.width &&
      copyHeight === srcSizeAtLevel.height &&
      copyWidth === dstSizeAtLevel.width &&
      copyHeight === dstSizeAtLevel.height;
    t.TestCopyTextureToTexture(
      { texture: srcTexture, origin: { x: 0, y: 0, z: 0 }, mipLevel: srcCopyLevel },
      { texture: dstTexture, origin: copyOrigin, mipLevel: dstCopyLevel },
      { width: copyWidth, height: copyHeight, depthOrArrayLayers: 1 },
      isSuccess
    );
    t.TestCopyTextureToTexture(
      { texture: srcTexture, origin: copyOrigin, mipLevel: srcCopyLevel },
      { texture: dstTexture, origin: { x: 0, y: 0, z: 0 }, mipLevel: dstCopyLevel },
      { width: copyWidth, height: copyHeight, depthOrArrayLayers: 1 },
      isSuccess
    );
  });

g.test('copy_ranges')
  .paramsSubcasesOnly(u =>
    u //
      .combine('copyBoxOffsets', [
        { x: 0, y: 0, z: 0, width: 0, height: 0, depthOrArrayLayers: -2 },
        { x: 1, y: 0, z: 0, width: 0, height: 0, depthOrArrayLayers: -2 },
        { x: 1, y: 0, z: 0, width: -1, height: 0, depthOrArrayLayers: -2 },
        { x: 0, y: 1, z: 0, width: 0, height: 0, depthOrArrayLayers: -2 },
        { x: 0, y: 1, z: 0, width: 0, height: -1, depthOrArrayLayers: -2 },
        { x: 0, y: 0, z: 1, width: 0, height: 1, depthOrArrayLayers: -2 },
        { x: 0, y: 0, z: 2, width: 0, height: 1, depthOrArrayLayers: 0 },
        { x: 0, y: 0, z: 0, width: 1, height: 0, depthOrArrayLayers: -2 },
        { x: 0, y: 0, z: 0, width: 0, height: 1, depthOrArrayLayers: -2 },
        { x: 0, y: 0, z: 0, width: 0, height: 0, depthOrArrayLayers: 1 },
        { x: 0, y: 0, z: 0, width: 0, height: 0, depthOrArrayLayers: 0 },
        { x: 0, y: 0, z: 1, width: 0, height: 0, depthOrArrayLayers: -1 },
        { x: 0, y: 0, z: 2, width: 0, height: 0, depthOrArrayLayers: -1 },
      ])
      .combine('srcCopyLevel', [0, 1, 3])
      .combine('dstCopyLevel', [0, 1, 3])
  )
  .fn(async t => {
    const { copyBoxOffsets, srcCopyLevel, dstCopyLevel } = t.params;

    const kTextureSize = { width: 16, height: 8, depthOrArrayLayers: 3 };
    const kMipLevelCount = 4;
    const kFormat = 'rgba8unorm';

    const srcTexture = t.device.createTexture({
      size: kTextureSize,
      format: kFormat,
      mipLevelCount: kMipLevelCount,
      usage: GPUTextureUsage.COPY_SRC,
    });
    const dstTexture = t.device.createTexture({
      size: kTextureSize,
      format: kFormat,
      mipLevelCount: kMipLevelCount,
      usage: GPUTextureUsage.COPY_DST,
    });

    const srcSizeAtLevel = t.GetPhysicalSubresourceSize(kTextureSize, kFormat, srcCopyLevel);
    const dstSizeAtLevel = t.GetPhysicalSubresourceSize(kTextureSize, kFormat, dstCopyLevel);

    const copyOrigin = { x: copyBoxOffsets.x, y: copyBoxOffsets.y, z: copyBoxOffsets.z };

    const copyWidth = Math.max(
      Math.min(srcSizeAtLevel.width, dstSizeAtLevel.width) + copyBoxOffsets.width - copyOrigin.x,
      0
    );
    const copyHeight = Math.max(
      Math.min(srcSizeAtLevel.height, dstSizeAtLevel.height) + copyBoxOffsets.height - copyOrigin.y,
      0
    );
    const copyDepth =
      kTextureSize.depthOrArrayLayers + copyBoxOffsets.depthOrArrayLayers - copyOrigin.z;

    {
      const isSuccess =
        copyWidth <= srcSizeAtLevel.width &&
        copyHeight <= srcSizeAtLevel.height &&
        copyOrigin.x + copyWidth <= dstSizeAtLevel.width &&
        copyOrigin.y + copyHeight <= dstSizeAtLevel.height &&
        copyOrigin.z + copyDepth <= kTextureSize.depthOrArrayLayers;

      t.TestCopyTextureToTexture(
        { texture: srcTexture, origin: { x: 0, y: 0, z: 0 }, mipLevel: srcCopyLevel },
        { texture: dstTexture, origin: copyOrigin, mipLevel: dstCopyLevel },
        { width: copyWidth, height: copyHeight, depthOrArrayLayers: copyDepth },
        isSuccess
      );
    }

    {
      const isSuccess =
        copyOrigin.x + copyWidth <= srcSizeAtLevel.width &&
        copyOrigin.y + copyHeight <= srcSizeAtLevel.height &&
        copyWidth <= dstSizeAtLevel.width &&
        copyHeight <= dstSizeAtLevel.height &&
        copyOrigin.z + copyDepth <= kTextureSize.depthOrArrayLayers;

      t.TestCopyTextureToTexture(
        { texture: srcTexture, origin: copyOrigin, mipLevel: srcCopyLevel },
        { texture: dstTexture, origin: { x: 0, y: 0, z: 0 }, mipLevel: dstCopyLevel },
        { width: copyWidth, height: copyHeight, depthOrArrayLayers: copyDepth },
        isSuccess
      );
    }
  });

g.test('copy_within_same_texture')
  .paramsSubcasesOnly(u =>
    u //
      .combine('srcCopyOriginZ', [0, 2, 4])
      .combine('dstCopyOriginZ', [0, 2, 4])
      .combine('copyExtentDepth', [1, 2, 3])
  )
  .fn(async t => {
    const { srcCopyOriginZ, dstCopyOriginZ, copyExtentDepth } = t.params;

    const kArrayLayerCount = 7;

    const testTexture = t.device.createTexture({
      size: { width: 16, height: 16, depthOrArrayLayers: kArrayLayerCount },
      format: 'rgba8unorm',
      usage: GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST,
    });

    const isSuccess =
      Math.min(srcCopyOriginZ, dstCopyOriginZ) + copyExtentDepth <=
      Math.max(srcCopyOriginZ, dstCopyOriginZ);
    t.TestCopyTextureToTexture(
      { texture: testTexture, origin: { x: 0, y: 0, z: srcCopyOriginZ } },
      { texture: testTexture, origin: { x: 0, y: 0, z: dstCopyOriginZ } },
      { width: 16, height: 16, depthOrArrayLayers: copyExtentDepth },
      isSuccess
    );
  });

g.test('copy_aspects')
  .desc(
    `
Test the validations on the member 'aspect' of GPUImageCopyTexture in CopyTextureToTexture().
- for all the color and depth-stencil formats: the texture copy aspects must be both 'all'.
- for all the depth-only formats: the texture copy aspects must be either 'all' or 'depth-only'.
- for all the stencil-only formats: the texture copy aspects must be either 'all' or 'stencil-only'.
`
  )
  .params(u =>
    u
      .combine('format', ['rgba8unorm', ...kDepthStencilFormats] as const)
      .beginSubcases()
      .combine('sourceAspect', ['all', 'depth-only', 'stencil-only'] as const)
      .combine('destinationAspect', ['all', 'depth-only', 'stencil-only'] as const)
  )
  .fn(async t => {
    const { format, sourceAspect, destinationAspect } = t.params;
    await t.selectDeviceOrSkipTestCase(kAllTextureFormatInfo[format].feature);

    const kTextureSize = { width: 16, height: 8, depthOrArrayLayers: 1 };

    const srcTexture = t.device.createTexture({
      size: kTextureSize,
      format,
      usage: GPUTextureUsage.COPY_SRC,
    });
    const dstTexture = t.device.createTexture({
      size: kTextureSize,
      format,
      usage: GPUTextureUsage.COPY_DST,
    });

    // TODO(jiawei.shao@intel.com): get the valid aspects from capability_info.ts.
    const kValidAspectsForFormat = {
      rgba8unorm: ['all'],

      // kUnsizedDepthStencilFormats
      depth24plus: ['all', 'depth-only'],
      'depth24plus-stencil8': ['all'],
      'depth24unorm-stencil8': ['all'],
      'depth32float-stencil8': ['all'],

      // kSizedDepthStencilFormats
      depth32float: ['all', 'depth-only'],
      stencil8: ['all', 'stencil-only'],
      depth16unorm: ['all', 'depth-only'],
    };

    const isSourceAspectValid = kValidAspectsForFormat[format].includes(sourceAspect);
    const isDestinationAspectValid = kValidAspectsForFormat[format].includes(destinationAspect);

    t.TestCopyTextureToTexture(
      { texture: srcTexture, origin: { x: 0, y: 0, z: 0 }, aspect: sourceAspect },
      { texture: dstTexture, origin: { x: 0, y: 0, z: 0 }, aspect: destinationAspect },
      kTextureSize,
      isSourceAspectValid && isDestinationAspectValid
    );
  });

g.test('copy_ranges_with_compressed_texture_formats')
  .params(u =>
    u
      .combine('format', kCompressedTextureFormats)
      .beginSubcases()
      .combine('copyBoxOffsets', [
        { x: 0, y: 0, z: 0, width: 0, height: 0, depthOrArrayLayers: -2 },
        { x: 1, y: 0, z: 0, width: 0, height: 0, depthOrArrayLayers: -2 },
        { x: 4, y: 0, z: 0, width: 0, height: 0, depthOrArrayLayers: -2 },
        { x: 0, y: 0, z: 0, width: -1, height: 0, depthOrArrayLayers: -2 },
        { x: 0, y: 0, z: 0, width: -4, height: 0, depthOrArrayLayers: -2 },
        { x: 0, y: 1, z: 0, width: 0, height: 0, depthOrArrayLayers: -2 },
        { x: 0, y: 4, z: 0, width: 0, height: 0, depthOrArrayLayers: -2 },
        { x: 0, y: 0, z: 0, width: 0, height: -1, depthOrArrayLayers: -2 },
        { x: 0, y: 0, z: 0, width: 0, height: -4, depthOrArrayLayers: -2 },
        { x: 0, y: 0, z: 0, width: 0, height: 0, depthOrArrayLayers: 0 },
        { x: 0, y: 0, z: 1, width: 0, height: 0, depthOrArrayLayers: -1 },
      ])
      .combine('srcCopyLevel', [0, 1, 2])
      .combine('dstCopyLevel', [0, 1, 2])
  )
  .fn(async t => {
    const { format, copyBoxOffsets, srcCopyLevel, dstCopyLevel } = t.params;
    await t.selectDeviceOrSkipTestCase(kAllTextureFormatInfo[format].feature);

    const kTextureSize = { width: 60, height: 48, depthOrArrayLayers: 3 };
    const kMipLevelCount = 4;

    const srcTexture = t.device.createTexture({
      size: kTextureSize,
      format,
      mipLevelCount: kMipLevelCount,
      usage: GPUTextureUsage.COPY_SRC,
    });
    const dstTexture = t.device.createTexture({
      size: kTextureSize,
      format,
      mipLevelCount: kMipLevelCount,
      usage: GPUTextureUsage.COPY_DST,
    });

    const srcSizeAtLevel = t.GetPhysicalSubresourceSize(kTextureSize, format, srcCopyLevel);
    const dstSizeAtLevel = t.GetPhysicalSubresourceSize(kTextureSize, format, dstCopyLevel);

    const copyOrigin = { x: copyBoxOffsets.x, y: copyBoxOffsets.y, z: copyBoxOffsets.z };

    const copyWidth = Math.max(
      Math.min(srcSizeAtLevel.width, dstSizeAtLevel.width) + copyBoxOffsets.width - copyOrigin.x,
      0
    );
    const copyHeight = Math.max(
      Math.min(srcSizeAtLevel.height, dstSizeAtLevel.height) + copyBoxOffsets.height - copyOrigin.y,
      0
    );
    const copyDepth =
      kTextureSize.depthOrArrayLayers + copyBoxOffsets.depthOrArrayLayers - copyOrigin.z;

    const texelBlockWidth = kAllTextureFormatInfo[format].blockWidth;
    const texelBlockHeight = kAllTextureFormatInfo[format].blockHeight;

    const isSuccessForCompressedFormats =
      copyOrigin.x % texelBlockWidth === 0 &&
      copyOrigin.y % texelBlockHeight === 0 &&
      copyWidth % texelBlockWidth === 0 &&
      copyHeight % texelBlockHeight === 0;

    {
      const isSuccess =
        isSuccessForCompressedFormats &&
        copyWidth <= srcSizeAtLevel.width &&
        copyHeight <= srcSizeAtLevel.height &&
        copyOrigin.x + copyWidth <= dstSizeAtLevel.width &&
        copyOrigin.y + copyHeight <= dstSizeAtLevel.height &&
        copyOrigin.z + copyDepth <= kTextureSize.depthOrArrayLayers;

      t.TestCopyTextureToTexture(
        { texture: srcTexture, origin: { x: 0, y: 0, z: 0 }, mipLevel: srcCopyLevel },
        { texture: dstTexture, origin: copyOrigin, mipLevel: dstCopyLevel },
        { width: copyWidth, height: copyHeight, depthOrArrayLayers: copyDepth },
        isSuccess
      );
    }

    {
      const isSuccess =
        isSuccessForCompressedFormats &&
        copyOrigin.x + copyWidth <= srcSizeAtLevel.width &&
        copyOrigin.y + copyHeight <= srcSizeAtLevel.height &&
        copyWidth <= dstSizeAtLevel.width &&
        copyHeight <= dstSizeAtLevel.height &&
        copyOrigin.z + copyDepth <= kTextureSize.depthOrArrayLayers;

      t.TestCopyTextureToTexture(
        { texture: srcTexture, origin: copyOrigin, mipLevel: srcCopyLevel },
        { texture: dstTexture, origin: { x: 0, y: 0, z: 0 }, mipLevel: dstCopyLevel },
        { width: copyWidth, height: copyHeight, depthOrArrayLayers: copyDepth },
        isSuccess
      );
    }
  });
