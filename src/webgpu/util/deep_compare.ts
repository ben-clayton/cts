/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export function deepCompare(a: any, b: any, aName?: string, bName?: string): string[] {
  aName = aName ?? 'got';
  bName = bName ?? 'expect';

  const diffs: string[] = [];
  const stack = [{ a, b, path: '' }];
  while (stack.length > 0) {
    const cmp = stack.pop()!;
    if (typeof cmp.a !== typeof cmp.b) {
      diffs.push(
        `${aName}${cmp.path} is of type ${typeof cmp.a}, ${bName}${
          cmp.path
        } is of type ${typeof cmp.b}`
      );
    }

    if (cmp.a instanceof Array) {
      const arrA = cmp.a;
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      const arrB = cmp.b as any[];
      if (arrA.length !== arrB.length) {
        diffs.push(
          `${aName}${cmp.path} has length ${arrA.length}, ${bName}${cmp.path} has length ${arrB.length}`
        );
      }
      const len = Math.min(arrA.length, arrB.length);
      for (let i = 0; i < len; i++) {
        stack.push({ a: arrA[i], b: arrB[i], path: cmp.path + `[${i}]` });
      }
      continue;
    }

    if (cmp.a instanceof Object) {
      const keysA = Object.keys(cmp.a);
      const keysB = Object.keys(cmp.b);
      const setA = new Set(keysA);
      const setB = new Set(keysB);
      for (const key of keysA) {
        const path = cmp.path + `.${key}`;
        if (setB.has(key)) {
          stack.push({ a: cmp.a[key], b: cmp.b[key], path });
        } else {
          diffs.push(`${aName}${path} is ${cmp.a[key]}, ${bName}${path} does not exist`);
        }
      }
      for (const key of keysB) {
        const path = cmp.path + `.${key}`;
        if (setA.has(key)) {
          stack.push({ a: cmp.a[key], b: cmp.b[key], path });
        } else {
          diffs.push(`${aName}${path} does not exist, ${bName}${path} is ${cmp.b[key]}`);
        }
      }
      continue;
    }

    if (cmp.a !== cmp.b) {
      diffs.push(`${aName}${cmp.path} is ${cmp.a}, ${bName}${cmp.path} is ${cmp.b}`);
    }
  }

  return diffs;
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export function checkDeepEqual(a: any, b: any, aName?: string, bName?: string): Error | undefined {
  const diffs = deepCompare(a, b, aName, bName);
  if (diffs.length > 0) {
    return new Error(diffs.join('\n'));
  }
  return undefined;
}
