/**
* AUTO-GENERATED - DO NOT EDIT. Source: https://github.com/gpuweb/cts
**/import { comparePublicParamsPaths, Ordering } from './query/compare.js';import { kWildcard, kParamSeparator, kParamKVSeparator } from './query/separators.js';
import { assert } from './util/util.js';



















export function paramKeyIsPublic(key) {
  return !key.startsWith('_');
}

export function extractPublicParams(params) {
  const publicParams = {};
  for (const k of Object.keys(params)) {
    if (paramKeyIsPublic(k)) {
      publicParams[k] = params[k];
    }
  }
  return publicParams;
}

export const badParamValueChars = new RegExp(
'[' + kParamKVSeparator + kParamSeparator + kWildcard + ']');


export function publicParamsEquals(x, y) {
  return comparePublicParamsPaths(x, y) === Ordering.Equal;
}








































// (keyof A & keyof B) is not empty, so they overlapped

export function mergeParams(a, b) {
  for (const key of Object.keys(a)) {
    assert(!(key in b), 'Duplicate key: ' + key);
  }
  return { ...a, ...b };
}
//# sourceMappingURL=params_utils.js.map