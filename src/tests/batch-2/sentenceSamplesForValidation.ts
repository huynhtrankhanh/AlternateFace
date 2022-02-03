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
  SentenceScheme,
  definitionInScheme,
  equal,
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
export type TestCase = [Context, Sentence | SentenceScheme, boolean];

// To help you locate the test case, all of them are numbered.

const tests: TestCase[] = [
  [D, forall(member(bound(0n), bound(0n))), true],
  [D, forall(member(bound(0n), bound(-5n))), false],
  [D, forall(member(free(0n), bound(0n))), false],
  [D, forall(member(bound(0n), bound(1n))), false],
  [A(1n), member(free(-1923n), free(-293493n)), false],
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
  [
    D,
    {
      type: "sentence scheme",
      parameterCounts: [],
      content: and(definition(-1n, []), definition(-2n, [])),
    },
    false,
  ],
  [
    D,
    {
      type: "sentence scheme",
      parameterCounts: [1n, 2n, 3n],
      content: forall(
        and(
          or(
            definition(0n, [bound(0n)]),
            definition(1n, [bound(0n), bound(0n)])
          ),
          definition(2n, [bound(0n), bound(0n), bound(0n)])
        )
      ),
    },
    false,
  ],
  [
    D,
    {
      type: "sentence scheme",
      parameterCounts: [1n, 2n, 3n],
      content: forall(
        and(
          or(
            definition(0n, [bound(0n)]),
            definition(1n, [bound(1n), bound(1n)])
          ),
          definition(2n, [bound(0n), bound(0n), bound(0n)])
        )
      ),
    },
    false,
  ],
  [
    D,
    {
      type: "sentence scheme",
      parameterCounts: [1n, 2n, 3n],
      content: forall(
        forall(
          and(
            exists(
              or(
                definition(0n, [bound(0n)]),
                definition(1n, [bound(2n), bound(2n)])
              )
            ),
            definition(2n, [bound(0n), bound(0n), bound(0n)])
          )
        )
      ),
    },
    false,
  ],
  [
    D,
    {
      type: "sentence scheme",
      parameterCounts: [1n, 2n, 3n],
      content: forall(
        and(
          or(
            definitionInScheme(0n, [bound(0n)]),
            definitionInScheme(1n, [bound(0n), bound(0n)])
          ),
          definitionInScheme(2n, [bound(0n), bound(0n), bound(0n)])
        )
      ),
    },
    true,
  ],
  [
    D,
    {
      type: "sentence scheme",
      parameterCounts: [1n, 2n, 3n],
      content: forall(
        and(
          or(
            definitionInScheme(0n, [bound(0n)]),
            definitionInScheme(1n, [bound(1n), bound(1n)])
          ),
          definitionInScheme(2n, [bound(0n), bound(0n), bound(0n)])
        )
      ),
    },
    false,
  ],
  [
    D,
    {
      type: "sentence scheme",
      parameterCounts: [1n, 2n, 3n],
      content: forall(
        forall(
          and(
            exists(
              or(
                definitionInScheme(0n, [bound(0n)]),
                definitionInScheme(1n, [bound(2n), bound(2n)])
              )
            ),
            definitionInScheme(2n, [bound(0n), bound(0n), bound(0n)])
          )
        )
      ),
    },
    true,
  ],
  [
    D,
    {
      type: "sentence scheme",
      parameterCounts: [],
      content: and(definitionInScheme(-1n, []), definition(-2n, [])),
    },
    false,
  ],
  [
    D,
    {
      type: "sentence scheme",
      parameterCounts: [1n, 2n, 3n],
      content: forall(
        and(
          or(
            definitionInScheme(0n, [bound(0n)]),
            definition(1n, [bound(0n), bound(0n)])
          ),
          definition(2n, [bound(0n), bound(0n), bound(0n)])
        )
      ),
    },
    false,
  ],
  [
    D,
    {
      type: "sentence scheme",
      parameterCounts: [1n, 2n, 3n],
      content: forall(
        and(
          or(
            definition(0n, [bound(0n)]),
            definitionInScheme(1n, [bound(1n), bound(1n)])
          ),
          definition(2n, [bound(0n), bound(0n), bound(0n)])
        )
      ),
    },
    false,
  ],
  [
    D,
    {
      type: "sentence scheme",
      parameterCounts: [1n, 2n, 3n],
      content: forall(
        forall(
          and(
            exists(
              or(
                definitionInScheme(0n, [bound(0n)]),
                definition(1n, [bound(2n), bound(2n)])
              )
            ),
            definitionInScheme(2n, [bound(0n), bound(0n), bound(0n)])
          )
        )
      ),
    },
    false,
  ],
  [D, forall(equal(bound(0n), bound(0n))), true],
  [D, forall(equal(bound(0n), bound(-5n))), false],
  [D, forall(equal(free(0n), bound(0n))), false],
  [D, forall(equal(bound(0n), bound(1n))), false],
  [A(1n), equal(free(-1923n), free(-293493n)), false],
  [A(2n), not(not(not(not(not(not(equal(free(0n), free(1n)))))))), true],
  [D, definition(0n, []), false],
  [
    B([
      {
        parameterCount: 2n,
        sentence: equal(parameter(0n), parameter(1n)),
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
          sentence: equal(parameter(0n), parameter(1n)),
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
            not(equal(parameter(0n), parameter(1n))),
            exists(equal(bound(0n), parameter(1n)))
          ),
          exported: false,
        },
        {
          parameterCount: 5n,
          sentence: exists(
            and(
              equal(bound(0n), parameter(4n)),
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
            not(equal(parameter(0n), parameter(1n))),
            exists(equal(bound(0n), parameter(1n)))
          ),
          exported: false,
        },
        {
          parameterCount: 5n,
          sentence: exists(
            and(
              equal(bound(0n), parameter(4n)),
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
            not(equal(parameter(0n), parameter(1n))),
            exists(equal(bound(0n), parameter(1n)))
          ),
          exported: false,
        },
        {
          parameterCount: 5n,
          sentence: exists(
            and(
              equal(bound(0n), parameter(4n)),
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
            not(equal(parameter(0n), parameter(1n))),
            exists(equal(bound(0n), parameter(1n)))
          ),
          exported: false,
        },
        {
          parameterCount: 5n,
          sentence: exists(
            and(
              equal(bound(0n), parameter(4n)),
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
  [
    D,
    {
      type: "sentence scheme",
      parameterCounts: [],
      content: and(definition(-1n, []), definition(-2n, [])),
    },
    false,
  ],
  [
    D,
    {
      type: "sentence scheme",
      parameterCounts: [1n, 2n, 3n],
      content: forall(
        and(
          or(
            definition(0n, [bound(0n)]),
            definition(1n, [bound(0n), bound(0n)])
          ),
          definition(2n, [bound(0n), bound(0n), bound(0n)])
        )
      ),
    },
    false,
  ],
  [
    D,
    {
      type: "sentence scheme",
      parameterCounts: [1n, 2n, 3n],
      content: forall(
        and(
          or(
            definition(0n, [bound(0n)]),
            definition(1n, [bound(1n), bound(1n)])
          ),
          definition(2n, [bound(0n), bound(0n), bound(0n)])
        )
      ),
    },
    false,
  ],
  [
    D,
    {
      type: "sentence scheme",
      parameterCounts: [],
      content: definitionInScheme(-982348023n, []),
    },
    false,
  ],
  [
    D,
    {
      type: "sentence scheme",
      parameterCounts: [],
      content: and(definitionInScheme(-1n, []), definitionInScheme(-2n, [])),
    },
    false,
  ],
  [
    D,
    {
      type: "sentence scheme",
      parameterCounts: [1n, 2n, 3n],
      content: forall(
        and(
          or(
            definition(0n, [bound(0n)]),
            definitionInScheme(1n, [bound(1n), free(-1n)])
          ),
          definition(2n, [bound(-132411423123n), bound(0n), bound(0n)])
        )
      ),
    },
    false,
  ],
  [
    D,
    {
      type: "sentence scheme",
      parameterCounts: [1n, 2n, 3n],
      content: forall(
        forall(
          and(
            exists(
              or(
                definitionInScheme(-9239234n, [bound(0n)]),
                definition(-1111n, [bound(0n), bound(0n)])
              )
            ),
            definitionInScheme(-23847172n, [bound(0n), bound(0n), bound(0n)])
          )
        )
      ),
    },
    false,
  ],
  [
    D,
    {
      type: "sentence scheme",
      parameterCounts: [-189234012384901823904n, -1n],
      content: forall(member(bound(0n), bound(0n))),
    },
    false,
  ],
  [
    D,
    {
      type: "sentence scheme",
      parameterCounts: [1n, 2n, 3n],
      content: forall(
        forall(
          and(
            exists(definitionInScheme(-9239234n, [bound(0n)])),
            definitionInScheme(-23847172n, [bound(0n), bound(0n), bound(0n)])
          )
        )
      ),
    },
    false,
  ],
];

export default tests;
