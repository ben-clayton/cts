export const description = `
Unit tests for parameterization helpers.
`;

import {
  kUnitCaseParamsBuilder,
  CaseSubcaseIterable,
  ParamsBuilderBase,
  builderIterateCasesWithSubcases,
} from '../common/framework/params_builder.js';
import { mergeParams, publicParamsEquals } from '../common/framework/params_utils.js';
import { makeTestGroup } from '../common/framework/test_group.js';
import { assert, objectEquals } from '../common/framework/util/util.js';

import { UnitTest } from './unit_test.js';

class ParamsTest extends UnitTest {
  expectParams<CaseP, SubcaseP>(
    act: ParamsBuilderBase<CaseP, SubcaseP>,
    exp: CaseSubcaseIterable<{}, {}>
  ): void {
    const a = Array.from(builderIterateCasesWithSubcases(act)).map(([caseP, subcases]) => [
      caseP,
      subcases ? Array.from(subcases) : undefined,
    ]);
    const e = Array.from(exp);
    this.expect(
      objectEquals(a, e),
      `
got      ${JSON.stringify(a)}
expected ${JSON.stringify(e)}`
    );
  }
}

export const g = makeTestGroup(ParamsTest);

const u = kUnitCaseParamsBuilder;

g.test('combine').fn(t => {
  t.expectParams<{ hello: number }, {}>(u.combine('hello', [1, 2, 3]), [
    [{ hello: 1 }, undefined],
    [{ hello: 2 }, undefined],
    [{ hello: 3 }, undefined],
  ]);
  t.expectParams<{ hello: 1 | 2 | 3 }, {}>(u.combine('hello', [1, 2, 3] as const), [
    [{ hello: 1 }, undefined],
    [{ hello: 2 }, undefined],
    [{ hello: 3 }, undefined],
  ]);
  t.expectParams<{}, { hello: number }>(u.beginSubcases().combine('hello', [1, 2, 3]), [
    [{}, [{ hello: 1 }, { hello: 2 }, { hello: 3 }]],
  ]);
  t.expectParams<{}, { hello: 1 | 2 | 3 }>(u.beginSubcases().combine('hello', [1, 2, 3] as const), [
    [{}, [{ hello: 1 }, { hello: 2 }, { hello: 3 }]],
  ]);
});

g.test('empty').fn(t => {
  t.expectParams<{}, {}>(u, [
    [{}, undefined], //
  ]);
  t.expectParams<{}, {}>(u.beginSubcases(), [
    [{}, [{}]], //
  ]);
});

g.test('combine,zeroes_and_ones').fn(t => {
  t.expectParams<{}, {}>(u.combineP([]).combineP([]), []);
  t.expectParams<{}, {}>(u.combineP([]).combineP([{}]), []);
  t.expectParams<{}, {}>(u.combineP([{}]).combineP([]), []);
  t.expectParams<{}, {}>(u.combineP([{}]).combineP([{}]), [
    [{}, undefined], //
  ]);
});

g.test('combine,mixed').fn(t => {
  t.expectParams<{ x: number; y: string; p: number | undefined; q: number | undefined }, {}>(
    u
      .combine('x', [1, 2])
      .combine('y', ['a', 'b'])
      .combineP([{ p: 4 }, { q: 5 }])
      .combineP([{}]),
    [
      [{ x: 1, y: 'a', p: 4 }, undefined],
      [{ x: 1, y: 'a', q: 5 }, undefined],
      [{ x: 1, y: 'b', p: 4 }, undefined],
      [{ x: 1, y: 'b', q: 5 }, undefined],
      [{ x: 2, y: 'a', p: 4 }, undefined],
      [{ x: 2, y: 'a', q: 5 }, undefined],
      [{ x: 2, y: 'b', p: 4 }, undefined],
      [{ x: 2, y: 'b', q: 5 }, undefined],
    ]
  );
});

g.test('filter').fn(t => {
  t.expectParams<{ a: boolean; x: number | undefined; y: number | undefined }, {}>(
    u
      .combineP([
        { a: true, x: 1 },
        { a: false, y: 2 },
      ])
      .filter(p => p.a),
    [
      [{ a: true, x: 1 }, undefined], //
    ]
  );

  t.expectParams<{ a: boolean; x: number | undefined; y: number | undefined }, {}>(
    u
      .combineP([
        { a: true, x: 1 },
        { a: false, y: 2 },
      ])
      .beginSubcases()
      .filter(p => p.a),
    [
      [{ a: true, x: 1 }, [{}]], //
      [{ a: false, y: 2 }, []], //
    ]
  );

  t.expectParams<{}, { a: boolean; x: number | undefined; y: number | undefined }>(
    u
      .beginSubcases()
      .combineP([
        { a: true, x: 1 },
        { a: false, y: 2 },
      ])
      .filter(p => p.a),
    [
      [{}, [{ a: true, x: 1 }]], //
    ]
  );
});

g.test('unless').fn(t => {
  t.expectParams<{ a: boolean; x: number | undefined; y: number | undefined }, {}>(
    u
      .combineP([
        { a: true, x: 1 },
        { a: false, y: 2 },
      ])
      .unless(p => p.a),
    [
      [{ a: false, y: 2 }, undefined], //
    ]
  );

  t.expectParams<{ a: boolean; x: number | undefined; y: number | undefined }, {}>(
    u
      .combineP([
        { a: true, x: 1 },
        { a: false, y: 2 },
      ])
      .beginSubcases()
      .unless(p => p.a),
    [
      [{ a: true, x: 1 }, []], //
      [{ a: false, y: 2 }, [{}]], //
    ]
  );

  t.expectParams<{}, { a: boolean; x: number | undefined; y: number | undefined }>(
    u
      .beginSubcases()
      .combineP([
        { a: true, x: 1 },
        { a: false, y: 2 },
      ])
      .unless(p => p.a),
    [
      [{}, [{ a: false, y: 2 }]], //
    ]
  );
});

g.test('expand').fn(t => {
  // simple
  t.expectParams<{}, {}>(
    u.expandP(function* () {}),
    []
  );
  t.expectParams<{}, {}>(
    u.expandP(function* () {
      yield {};
    }),
    [[{}, undefined]]
  );
  t.expectParams<{ z: number | undefined; w: number | undefined }, {}>(
    u.expandP(function* () {
      yield* kUnitCaseParamsBuilder.combine('z', [3, 4]);
      yield { w: 5 };
    }),
    [
      [{ z: 3 }, undefined],
      [{ z: 4 }, undefined],
      [{ w: 5 }, undefined],
    ]
  );
  t.expectParams<{}, { z: number | undefined; w: number | undefined }>(
    u.beginSubcases().expandP(function* () {
      yield* kUnitCaseParamsBuilder.combine('z', [3, 4]);
      yield { w: 5 };
    }),
    [[{}, [{ z: 3 }, { z: 4 }, { w: 5 }]]]
  );

  // more complex
  t.expectParams<
    {
      a: boolean;
      x: number | undefined;
      y: number | undefined;
      z: number | undefined;
      w: number | undefined;
    },
    {}
  >(
    u
      .combineP([
        { a: true, x: 1 },
        { a: false, y: 2 },
      ])
      .expandP(function* (p) {
        if (p.a) {
          yield { z: 3 };
          yield { z: 4 };
        } else {
          yield { w: 5 };
        }
      }),
    [
      [{ a: true, x: 1, z: 3 }, undefined],
      [{ a: true, x: 1, z: 4 }, undefined],
      [{ a: false, y: 2, w: 5 }, undefined],
    ]
  );
  t.expectParams<
    { a: boolean; x: number | undefined; y: number | undefined },
    { z: number | undefined; w: number | undefined }
  >(
    u
      .combineP([
        { a: true, x: 1 },
        { a: false, y: 2 },
      ])
      .beginSubcases()
      .expandP(function* (p) {
        if (p.a) {
          yield { z: 3 };
          yield { z: 4 };
        } else {
          yield { w: 5 };
        }
      }),
    [
      [{ a: true, x: 1 }, [{ z: 3 }, { z: 4 }]],
      [{ a: false, y: 2 }, [{ w: 5 }]],
    ]
  );
});

g.test('expand').fn(t => {
  // simple
  t.expectParams<{}, {}>(
    u.expand('x', function* () {}),
    []
  );
  t.expectParams<{ z: number }, {}>(
    u.expand('z', function* () {
      yield 3;
      yield 4;
    }),
    [
      [{ z: 3 }, undefined],
      [{ z: 4 }, undefined],
    ]
  );
  t.expectParams<{}, { z: number }>(
    u.beginSubcases().expand('z', function* () {
      yield 3;
      yield 4;
    }),
    [[{}, [{ z: 3 }, { z: 4 }]]]
  );

  // more complex
  t.expectParams<{ a: boolean; x: number | undefined; y: number | undefined; z: number }, {}>(
    u
      .combineP([
        { a: true, x: 1 },
        { a: false, y: 2 },
      ])
      .expand('z', function* (p) {
        if (p.a) {
          yield 3;
        } else {
          yield 5;
        }
      }),
    [
      [{ a: true, x: 1, z: 3 }, undefined],
      [{ a: false, y: 2, z: 5 }, undefined],
    ]
  );
  t.expectParams<{ a: boolean; x: number | undefined; y: number | undefined }, { z: number }>(
    u
      .combineP([
        { a: true, x: 1 },
        { a: false, y: 2 },
      ])
      .beginSubcases()
      .expand('z', function* (p) {
        if (p.a) {
          yield 3;
        } else {
          yield 5;
        }
      }),
    [
      [{ a: true, x: 1 }, [{ z: 3 }]],
      [{ a: false, y: 2 }, [{ z: 5 }]],
    ]
  );
});

g.test('invalid,shadowing').fn(t => {
  // Existing CaseP is shadowed by a new CaseP.
  {
    const p = u
      .combineP([
        { a: true, x: 1 },
        { a: false, x: 2 },
      ])
      .expandP(function* (p) {
        if (p.a) {
          yield { x: 3 };
        } else {
          yield { w: 5 };
        }
      });
    // Iterating causes e.g. mergeParams({x:1}, {x:3}), which fails.
    t.shouldThrow('Error', () => {
      Array.from(p.iterateCasesWithSubcases());
    });
  }
  // Existing SubcaseP is shadowed by a new SubcaseP.
  {
    const p = u
      .beginSubcases()
      .combineP([
        { a: true, x: 1 },
        { a: false, x: 2 },
      ])
      .expandP(function* (p) {
        if (p.a) {
          yield { x: 3 };
        } else {
          yield { w: 5 };
        }
      });
    // Iterating cases is fine...
    for (const [, subcases] of p.iterateCasesWithSubcases()) {
      assert(subcases !== undefined);
      // Iterating causes e.g. mergeParams({x:1}, {x:3}), which fails.
      t.shouldThrow('Error', () => {
        Array.from(subcases);
      });
    }
  }
  // Existing CaseP is shadowed by a new SubcaseP.
  {
    const p = u
      .combineP([
        { a: true, x: 1 },
        { a: false, x: 2 },
      ])
      .beginSubcases()
      .expandP(function* (p) {
        if (p.a) {
          yield { x: 3 };
        } else {
          yield { w: 5 };
        }
      });
    const cases = Array.from(p.iterateCasesWithSubcases());
    // Iterating cases is fine...
    for (const [caseP, subcases] of cases) {
      assert(subcases !== undefined);
      // Iterating subcases is fine...
      for (const subcaseP of subcases) {
        if (caseP.a) {
          assert(subcases !== undefined);
          // Only errors once we try to e.g. mergeParams({x:1}, {x:3}).
          t.shouldThrow('Error', () => {
            mergeParams(caseP, subcaseP);
          });
        } else {
          mergeParams(caseP, subcaseP);
        }
      }
    }
  }
});

g.test('undefined').fn(t => {
  t.expect(!publicParamsEquals({ a: undefined }, {}));
  t.expect(!publicParamsEquals({}, { a: undefined }));
});

g.test('private').fn(t => {
  t.expect(publicParamsEquals({ _a: 0 }, {}));
  t.expect(publicParamsEquals({}, { _a: 0 }));
});

g.test('value,array').fn(t => {
  t.expectParams<{ a: number[] }, {}>(u.combineP([{ a: [1, 2] }]), [
    [{ a: [1, 2] }, undefined], //
  ]);
  t.expectParams<{}, { a: number[] }>(u.beginSubcases().combineP([{ a: [1, 2] }]), [
    [{}, [{ a: [1, 2] }]], //
  ]);
});

g.test('value,object').fn(t => {
  t.expectParams<{ a: { [k: string]: number } }, {}>(u.combineP([{ a: { x: 1 } }]), [
    [{ a: { x: 1 } }, undefined], //
  ]);
  t.expectParams<{}, { a: { [k: string]: number } }>(
    u.beginSubcases().combineP([{ a: { x: 1 } }]),
    [
      [{}, [{ a: { x: 1 } }]], //
    ]
  );
});
