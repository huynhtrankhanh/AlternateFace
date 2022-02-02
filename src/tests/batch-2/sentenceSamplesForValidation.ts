import {
  Context,
  Sentence,
  Definition,
  forall,
  exists,
  and,
  or,
  not,
  member,
  bound,
  free,
  parameter,
  definition,
} from "../../theoremProver";
import { List } from "immutable";

// Shorthand constructors.

const A = (freeVariableCount: bigint): Context => ({
  sentences: List(),
  goal: undefined,
  freeVariableCount,
  definitions: List(),
});

const B = (definitions: Definition[]): Context => ({
  sentences: List(),
  goal: undefined,
  freeVariableCount: 0n,
  definitions: List(definitions),
});

const C = (definitions: Definition[], freeVariableCount: bigint): Context => ({
  sentences: List(),
  goal: undefined,
  freeVariableCount,
  definitions: List(definitions),
});

const D: Context = {
  sentences: List(),
  goal: undefined,
  freeVariableCount: 0n,
  definitions: List(),
};

// Last field: true if valid, false otherwise.
export type TestCase = [Context, Sentence, boolean];

const tests: TestCase[] = [
  [D, forall(member(bound(0n), bound(0n))), true],
  [D, forall(member(bound(0n), bound(1n))), false],
  [A(2n), not(not(not(not(not(not(member(free(0n), free(1n)))))))), true],
  [D, definition(0n, []), false],
  [
    B([
      {
        parameterCount: 2n,
        sentence: member(parameter(0n), parameter(1n)),
        exported: false,
      },
    ]),
    definition(0n, [bound(0n), bound(1n)]),
    false,
  ],
  [
    C(
      [
        {
          parameterCount: 2n,
          sentence: member(parameter(0n), parameter(1n)),
          exported: false,
        },
      ],
      2n
    ),
    definition(0n, [free(0n), free(1n)]),
    true,
  ],
  [
    C(
      [
        {
          parameterCount: 2n,
          sentence: and(
            not(member(parameter(0n), parameter(1n))),
            exists(member(bound(0n), parameter(1n)))
          ),
          exported: false,
        },
        {
          parameterCount: 5n,
          sentence: exists(
            and(
              member(bound(0n), parameter(4n)),
              definition(0n, [parameter(2n), parameter(3n)])
            )
          ),
          exported: false,
        },
      ],
      100000n
    ),
    or(
      definition(0n, [free(0n), free(0n)]),
      definition(1n, [free(0n), free(1n), free(1n), free(0n), free(0n)])
    ),
    true,
  ],
  [
    C(
      [
        {
          parameterCount: 2n,
          sentence: and(
            not(member(parameter(0n), parameter(1n))),
            exists(member(bound(0n), parameter(1n)))
          ),
          exported: false,
        },
        {
          parameterCount: 5n,
          sentence: exists(
            and(
              member(bound(0n), parameter(4n)),
              definition(0n, [parameter(2n), parameter(3n)])
            )
          ),
          exported: false,
        },
      ],
      100000n
    ),
    or(
      definition(0n, [free(0n), free(0n)]),
      definition(1n, [free(0n), free(1n), free(1n), free(0n), free(0n)])
    ),
    true,
  ],
  [
    C(
      [
        {
          parameterCount: 2n,
          sentence: and(
            not(member(parameter(0n), parameter(1n))),
            exists(member(bound(0n), parameter(1n)))
          ),
          exported: false,
        },
        {
          parameterCount: 5n,
          sentence: exists(
            and(
              member(bound(0n), parameter(4n)),
              definition(0n, [parameter(2n), parameter(3n)])
            )
          ),
          exported: false,
        },
      ],
      100000n
    ),
    or(
      definition(0n, [free(0n), free(0n)]),
      definition(1n, [
        free(1283749123492178943n),
        free(1n),
        free(1n),
        free(0n),
        free(0n),
      ])
    ),
    false,
  ],
  [
    C(
      [
        {
          parameterCount: 2n,
          sentence: and(
            not(member(parameter(0n), parameter(1n))),
            exists(member(bound(0n), parameter(1n)))
          ),
          exported: false,
        },
        {
          parameterCount: 5n,
          sentence: exists(
            and(
              member(bound(0n), parameter(4n)),
              definition(0n, [parameter(2n), parameter(3n)])
            )
          ),
          exported: false,
        },
      ],
      100000n
    ),
    or(definition(0n, [free(0n), free(0n)]), definition(1n, [free(0n)])),
    false,
  ],
];

export default tests;
