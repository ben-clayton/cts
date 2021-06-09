/**
 * AUTO-GENERATED - DO NOT EDIT. Source: https://github.com/gpuweb/cts
 **/ export const description = `
Test uninitialized textures are initialized to zero when read.

TODO:
- 1d
- test by sampling depth/stencil
- test by copying out of stencil
`; // TODO: This is a test file, it probably shouldn't export anything.
// Everything that's exported should be moved to another file.

import { kUnitCaseParamsBuilder } from '../../../../common/framework/params_builder.js';

import { makeTestGroup } from '../../../../common/framework/test_group.js';
import { assert, unreachable } from '../../../../common/framework/util/util.js';
import {
  kAllTextureFormatInfo,
  kEncodableTextureFormatInfo,
  kTextureAspects,
  kUncompressedTextureFormatInfo,
  kUncompressedTextureFormats,
} from '../../../capability_info.js';
import { GPUConst } from '../../../constants.js';
import { GPUTest } from '../../../gpu_test.js';
import {
  createTextureUploadBuffer,
  getMipSizePassthroughLayers,
} from '../../../util/texture/layout.js';
import { SubresourceRange } from '../../../util/texture/subresource.js';
import { kTexelRepresentationInfo } from '../../../util/texture/texel_data.js';

export let UninitializeMethod;
(function (UninitializeMethod) {
  UninitializeMethod['Creation'] = 'Creation';
  UninitializeMethod['StoreOpClear'] = 'StoreOpClear';
})(UninitializeMethod || (UninitializeMethod = {}));

const kUninitializeMethods = Object.keys(UninitializeMethod);

export let ReadMethod;
(function (ReadMethod) {
  ReadMethod['Sample'] = 'Sample';
  ReadMethod['CopyToBuffer'] = 'CopyToBuffer';
  ReadMethod['CopyToTexture'] = 'CopyToTexture';
  ReadMethod['DepthTest'] = 'DepthTest';
  ReadMethod['StencilTest'] = 'StencilTest';
  ReadMethod['ColorBlending'] = 'ColorBlending';
  ReadMethod['Storage'] = 'Storage';
})(ReadMethod || (ReadMethod = {}));

const kMipLevelCounts = [1, 5];

// For each mip level count, define the mip ranges to leave uninitialized.
const kUninitializedMipRangesToTest = {
  1: [{ begin: 0, end: 1 }], // Test the only mip
  5: [
    { begin: 0, end: 2 },
    { begin: 3, end: 4 },
  ],
  // Test a range and a single mip
};

// Test with these sample counts.
const kSampleCounts = [1, 4];

// Test with these layer counts.

// For each layer count, define the layers to leave uninitialized.
const kUninitializedLayerRangesToTest = {
  1: [{ begin: 0, end: 1 }], // Test the only layer
  7: [
    { begin: 2, end: 4 },
    { begin: 6, end: 7 },
  ],
  // Test a range and a single layer
};

// Enums to abstract over color / depth / stencil values in textures. Depending on the texture format,
// the data for each value may have a different representation. These enums are converted to a
// representation such that their values can be compared. ex.) An integer is needed to upload to an
// unsigned normalized format, but its value is read as a float in the shader.
export let InitializedState;
(function (InitializedState) {
  InitializedState[(InitializedState['Canary'] = 0)] = 'Canary';
  InitializedState[(InitializedState['Zero'] = 1)] = 'Zero';
})(InitializedState || (InitializedState = {}));

const initializedStateAsFloat = {
  [InitializedState.Zero]: 0,
  [InitializedState.Canary]: 1,
};

const initializedStateAsUint = {
  [InitializedState.Zero]: 0,
  [InitializedState.Canary]: 1,
};

const initializedStateAsSint = {
  [InitializedState.Zero]: 0,
  [InitializedState.Canary]: -1,
};

function initializedStateAsColor(state, format) {
  let value;
  if (format.indexOf('uint') !== -1) {
    value = initializedStateAsUint[state];
  } else if (format.indexOf('sint') !== -1) {
    value = initializedStateAsSint[state];
  } else {
    value = initializedStateAsFloat[state];
  }
  return [value, value, value, value];
}

const initializedStateAsDepth = {
  [InitializedState.Zero]: 0,
  [InitializedState.Canary]: 0.8,
};

const initializedStateAsStencil = {
  [InitializedState.Zero]: 0,
  [InitializedState.Canary]: 42,
};

function getRequiredTextureUsage(format, sampleCount, uninitializeMethod, readMethod) {
  let usage = GPUConst.TextureUsage.COPY_DST;

  switch (uninitializeMethod) {
    case UninitializeMethod.Creation:
      break;
    case UninitializeMethod.StoreOpClear:
      usage |= GPUConst.TextureUsage.RENDER_ATTACHMENT;
      break;
    default:
      unreachable();
  }

  switch (readMethod) {
    case ReadMethod.CopyToBuffer:
    case ReadMethod.CopyToTexture:
      usage |= GPUConst.TextureUsage.COPY_SRC;
      break;
    case ReadMethod.Sample:
      usage |= GPUConst.TextureUsage.SAMPLED;
      break;
    case ReadMethod.Storage:
      usage |= GPUConst.TextureUsage.STORAGE;
      break;
    case ReadMethod.DepthTest:
    case ReadMethod.StencilTest:
    case ReadMethod.ColorBlending:
      usage |= GPUConst.TextureUsage.RENDER_ATTACHMENT;
      break;
    default:
      unreachable();
  }

  if (sampleCount > 1) {
    // Copies to multisampled textures are not allowed. We need OutputAttachment to initialize
    // canary data in multisampled textures.
    usage |= GPUConst.TextureUsage.RENDER_ATTACHMENT;
  }

  if (!kUncompressedTextureFormatInfo[format].copyDst) {
    // Copies are not possible. We need OutputAttachment to initialize
    // canary data.
    assert(kUncompressedTextureFormatInfo[format].renderable);
    usage |= GPUConst.TextureUsage.RENDER_ATTACHMENT;
  }

  return usage;
}

export class TextureZeroInitTest extends GPUTest {
  constructor(rec, params) {
    super(rec, params);
    this.p = params;

    const stateToTexelComponents = state => {
      const [R, G, B, A] = initializedStateAsColor(state, this.p.format);
      return {
        R,
        G,
        B,
        A,
        Depth: initializedStateAsDepth[state],
        Stencil: initializedStateAsStencil[state],
      };
    };

    this.stateToTexelComponents = {
      [InitializedState.Zero]: stateToTexelComponents(InitializedState.Zero),
      [InitializedState.Canary]: stateToTexelComponents(InitializedState.Canary),
    };
  }

  get textureWidth() {
    let width = 1 << this.p.mipLevelCount;
    if (this.p.nonPowerOfTwo) {
      width = 2 * width - 1;
    }
    return width;
  }

  get textureHeight() {
    let height = 1 << this.p.mipLevelCount;
    if (this.p.nonPowerOfTwo) {
      height = 2 * height - 1;
    }
    return height;
  }

  get textureDepth() {
    return this.p.dimension === '3d' ? 11 : 1;
  }

  get textureDepthOrArrayLayers() {
    return this.p.dimension === '2d' ? this.p.layerCount : this.textureDepth;
  }

  // Used to iterate subresources and check that their uninitialized contents are zero when accessed
  *iterateUninitializedSubresources() {
    for (const mipRange of kUninitializedMipRangesToTest[this.p.mipLevelCount]) {
      for (const layerRange of kUninitializedLayerRangesToTest[this.p.layerCount]) {
        yield new SubresourceRange({ mipRange, layerRange });
      }
    }
  }

  // Used to iterate and initialize other subresources not checked for zero-initialization.
  // Zero-initialization of uninitialized subresources should not have side effects on already
  // initialized subresources.
  *iterateInitializedSubresources() {
    const uninitialized = new Array(this.p.mipLevelCount);
    for (let level = 0; level < uninitialized.length; ++level) {
      uninitialized[level] = new Array(this.p.layerCount);
    }
    for (const subresources of this.iterateUninitializedSubresources()) {
      for (const { level, layer } of subresources.each()) {
        uninitialized[level][layer] = true;
      }
    }
    for (let level = 0; level < uninitialized.length; ++level) {
      for (let layer = 0; layer < uninitialized[level].length; ++layer) {
        if (!uninitialized[level][layer]) {
          yield new SubresourceRange({
            mipRange: { begin: level, count: 1 },
            layerRange: { begin: layer, count: 1 },
          });
        }
      }
    }
  }

  *generateTextureViewDescriptorsForRendering(aspect, subresourceRange) {
    const viewDescriptor = {
      dimension: '2d',
      aspect,
    };

    if (subresourceRange === undefined) {
      return viewDescriptor;
    }

    for (const { level, layer } of subresourceRange.each()) {
      yield {
        ...viewDescriptor,
        baseMipLevel: level,
        mipLevelCount: 1,
        baseArrayLayer: layer,
        arrayLayerCount: 1,
      };
    }
  }

  initializeWithStoreOp(state, texture, subresourceRange) {
    const commandEncoder = this.device.createCommandEncoder();
    for (const viewDescriptor of this.generateTextureViewDescriptorsForRendering(
      this.p.aspect,
      subresourceRange
    )) {
      if (kUncompressedTextureFormatInfo[this.p.format].color) {
        commandEncoder
          .beginRenderPass({
            colorAttachments: [
              {
                view: texture.createView(viewDescriptor),
                storeOp: 'store',
                loadValue: initializedStateAsColor(state, this.p.format),
              },
            ],
          })
          .endPass();
      } else {
        commandEncoder
          .beginRenderPass({
            colorAttachments: [],
            depthStencilAttachment: {
              view: texture.createView(viewDescriptor),
              depthStoreOp: 'store',
              depthLoadValue: initializedStateAsDepth[state],
              stencilStoreOp: 'store',
              stencilLoadValue: initializedStateAsStencil[state],
            },
          })
          .endPass();
      }
    }
    this.queue.submit([commandEncoder.finish()]);
  }

  initializeWithCopy(texture, state, subresourceRange) {
    // TODO: 1D texture
    assert(this.p.dimension !== '1d');

    assert(this.p.format in kEncodableTextureFormatInfo);
    const format = this.p.format;

    const firstSubresource = subresourceRange.each().next().value;
    assert(typeof firstSubresource !== 'undefined');

    const [largestWidth, largestHeight, largestDepth] = getMipSizePassthroughLayers(
      this.p.dimension,
      [this.textureWidth, this.textureHeight, this.textureDepth],
      firstSubresource.level
    );

    const rep = kTexelRepresentationInfo[format];
    const texelData = new Uint8Array(rep.pack(rep.encode(this.stateToTexelComponents[state])));
    const { buffer, bytesPerRow, rowsPerImage } = createTextureUploadBuffer(
      texelData,
      this.device,
      format,
      this.p.dimension,
      [largestWidth, largestHeight, largestDepth]
    );

    const commandEncoder = this.device.createCommandEncoder();

    for (const { level, layer } of subresourceRange.each()) {
      const [width, height, depth] = getMipSizePassthroughLayers(
        this.p.dimension,
        [this.textureWidth, this.textureHeight, this.textureDepth],
        level
      );

      commandEncoder.copyBufferToTexture(
        {
          buffer,
          bytesPerRow,
          rowsPerImage,
        },

        { texture, mipLevel: level, origin: { x: 0, y: 0, z: layer } },
        { width, height, depthOrArrayLayers: depth }
      );
    }
    this.queue.submit([commandEncoder.finish()]);
    buffer.destroy();
  }

  initializeTexture(texture, state, subresourceRange) {
    if (this.p.sampleCount > 1 || !kUncompressedTextureFormatInfo[this.p.format].copyDst) {
      // Copies to multisampled textures not yet specified.
      // Use a storeOp for now.
      assert(kUncompressedTextureFormatInfo[this.p.format].renderable);
      this.initializeWithStoreOp(state, texture, subresourceRange);
    } else {
      this.initializeWithCopy(texture, state, subresourceRange);
    }
  }

  discardTexture(texture, subresourceRange) {
    const commandEncoder = this.device.createCommandEncoder();

    for (const desc of this.generateTextureViewDescriptorsForRendering(
      this.p.aspect,
      subresourceRange
    )) {
      if (kUncompressedTextureFormatInfo[this.p.format].color) {
        commandEncoder
          .beginRenderPass({
            colorAttachments: [
              {
                view: texture.createView(desc),
                storeOp: 'clear',
                loadValue: 'load',
              },
            ],
          })
          .endPass();
      } else {
        commandEncoder
          .beginRenderPass({
            colorAttachments: [],
            depthStencilAttachment: {
              view: texture.createView(desc),
              depthStoreOp: 'clear',
              depthLoadValue: 'load',
              stencilStoreOp: 'clear',
              stencilLoadValue: 'load',
            },
          })
          .endPass();
      }
    }
    this.queue.submit([commandEncoder.finish()]);
  }
}

const kTestParams = kUnitCaseParamsBuilder
  // TODO: 1d textures
  .combine('dimension', ['2d', '3d'])
  .combine('readMethod', [
    ReadMethod.CopyToBuffer,
    ReadMethod.CopyToTexture,
    ReadMethod.Sample,
    ReadMethod.DepthTest,
    ReadMethod.StencilTest,
  ])
  .combine('format', kUncompressedTextureFormats)
  .beginSubcases()
  .combine('aspect', kTextureAspects)
  .unless(({ readMethod, format, aspect }) => {
    const info = kUncompressedTextureFormatInfo[format];
    return (
      (readMethod === ReadMethod.DepthTest && (!info.depth || aspect === 'stencil-only')) ||
      (readMethod === ReadMethod.StencilTest && (!info.stencil || aspect === 'depth-only')) ||
      (readMethod === ReadMethod.ColorBlending && !info.color) ||
      // TODO: Test with depth/stencil sampling
      (readMethod === ReadMethod.Sample && (info.depth || info.stencil)) ||
      (aspect === 'depth-only' && !info.depth) ||
      (aspect === 'stencil-only' && !info.stencil) ||
      (aspect === 'all' && info.depth && info.stencil) ||
      // Cannot copy from a packed depth format.
      // TODO: Test copying out of the stencil aspect.
      ((readMethod === ReadMethod.CopyToBuffer || readMethod === ReadMethod.CopyToTexture) &&
        (format === 'depth24plus' || format === 'depth24plus-stencil8'))
    );
  })
  .combine('mipLevelCount', kMipLevelCounts)
  .combine('sampleCount', kSampleCounts)
  .unless(
    ({ readMethod, sampleCount }) =>
      // We can only read from multisampled textures by sampling.
      sampleCount > 1 &&
      (readMethod === ReadMethod.CopyToBuffer || readMethod === ReadMethod.CopyToTexture)
  )

  // Multisampled textures may only have one mip
  .unless(({ sampleCount, mipLevelCount }) => sampleCount > 1 && mipLevelCount > 1)
  .combine('uninitializeMethod', kUninitializeMethods)
  .unless(({ dimension, readMethod, uninitializeMethod, format, sampleCount }) => {
    const formatInfo = kUncompressedTextureFormatInfo[format];
    return (
      dimension === '3d' &&
      (sampleCount > 1 ||
        formatInfo.depth ||
        formatInfo.stencil ||
        readMethod === ReadMethod.DepthTest ||
        readMethod === ReadMethod.StencilTest ||
        readMethod === ReadMethod.ColorBlending ||
        uninitializeMethod === UninitializeMethod.StoreOpClear)
    );
  })
  .expandWithParams(function* ({ dimension }) {
    switch (dimension) {
      case '2d':
        yield { layerCount: 1 };
        yield { layerCount: 7 };
        break;
      case '3d':
        yield { layerCount: 1 };
        break;
      default:
        unreachable();
    }
  })
  // Multisampled 3D / 2D array textures not supported.
  .unless(({ sampleCount, layerCount }) => sampleCount > 1 && layerCount > 1)
  .unless(({ format, sampleCount, uninitializeMethod, readMethod }) => {
    const usage = getRequiredTextureUsage(format, sampleCount, uninitializeMethod, readMethod);
    const info = kUncompressedTextureFormatInfo[format];

    return (
      ((usage & GPUConst.TextureUsage.RENDER_ATTACHMENT) !== 0 && !info.renderable) ||
      ((usage & GPUConst.TextureUsage.STORAGE) !== 0 && !info.storage)
    );
  })
  .combine('nonPowerOfTwo', [false, true])
  .combine('canaryOnCreation', [false, true])
  .filter(({ canaryOnCreation, format }) => {
    // We can only initialize the texture if it's encodable or renderable.
    const canInitialize =
      format in kEncodableTextureFormatInfo || kAllTextureFormatInfo[format].renderable;

    // Filter out cases where we want canary values but can't initialize.
    return !canaryOnCreation || canInitialize;
  });

import { checkContentsByBufferCopy, checkContentsByTextureCopy } from './check_texture/by_copy.js';
import {
  checkContentsByDepthTest,
  checkContentsByStencilTest,
} from './check_texture/by_ds_test.js';
import { checkContentsBySampling } from './check_texture/by_sampling.js';

const checkContentsImpl = {
  Sample: checkContentsBySampling,
  CopyToBuffer: checkContentsByBufferCopy,
  CopyToTexture: checkContentsByTextureCopy,
  DepthTest: checkContentsByDepthTest,
  StencilTest: checkContentsByStencilTest,
  ColorBlending: t => t.skip('Not implemented'),
  Storage: t => t.skip('Not implemented'),
};

export const g = makeTestGroup(TextureZeroInitTest);

g.test('uninitialized_texture_is_zero')
  .params(kTestParams)
  .fn(async t => {
    await t.selectDeviceOrSkipTestCase(kUncompressedTextureFormatInfo[t.params.format].feature);

    const usage = getRequiredTextureUsage(
      t.params.format,
      t.params.sampleCount,
      t.params.uninitializeMethod,
      t.params.readMethod
    );

    const texture = t.device.createTexture({
      size: [t.textureWidth, t.textureHeight, t.textureDepthOrArrayLayers],
      format: t.params.format,
      dimension: t.params.dimension,
      usage,
      mipLevelCount: t.params.mipLevelCount,
      sampleCount: t.params.sampleCount,
    });

    if (t.params.canaryOnCreation) {
      // Initialize some subresources with canary values
      for (const subresourceRange of t.iterateInitializedSubresources()) {
        t.initializeTexture(texture, InitializedState.Canary, subresourceRange);
      }
    }

    switch (t.params.uninitializeMethod) {
      case UninitializeMethod.Creation:
        break;
      case UninitializeMethod.StoreOpClear:
        // Initialize the rest of the resources.
        for (const subresourceRange of t.iterateUninitializedSubresources()) {
          t.initializeTexture(texture, InitializedState.Canary, subresourceRange);
        }
        // Then use a store op to discard their contents.
        for (const subresourceRange of t.iterateUninitializedSubresources()) {
          t.discardTexture(texture, subresourceRange);
        }
        break;
      default:
        unreachable();
    }

    // Check that all uninitialized resources are zero.
    for (const subresourceRange of t.iterateUninitializedSubresources()) {
      checkContentsImpl[t.params.readMethod](
        t,
        t.params,
        texture,
        InitializedState.Zero,
        subresourceRange
      );
    }

    if (t.params.canaryOnCreation) {
      // Check the all other resources are unchanged.
      for (const subresourceRange of t.iterateInitializedSubresources()) {
        checkContentsImpl[t.params.readMethod](
          t,
          t.params,
          texture,
          InitializedState.Canary,
          subresourceRange
        );
      }
    }
  });
