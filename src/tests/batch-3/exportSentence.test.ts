// The main logic is already tested in tests/batch-1/export.test.ts.
// This file only tests one edge case: if the sentence can't be exported.

// Be careful: the test must test the canExportSentence logic too.

import {
  forall,
  startInteractiveSession,
  member,
  and,
  or,
  not,
  equal,
  bound,
  exists,
  free,
  definition,
  imply,
  definitionInScheme,
  parameter,
} from "../../theoremProver";

test("refuses to export sentences that can't be exported", () => {
  const session = startInteractiveSession();
  session.contexts[0].sentences = session.contexts[0].sentences.push({
    exported: false,
    sentence: and(
      forall(member(bound(0n), bound(0n))),
      member(free(0n), free(0n))
    ),
  });
  session.contexts[0].freeVariableCount = 1n;

  expect(session.exportSentence(0n)).toBe("failed");
  expect(session.contexts[0].sentences.get(0)?.exported).toBe(false);
});

test("canExportSentence works correctly", () => {
  {
    const session = startInteractiveSession();
    session.contexts[0].sentences = session.contexts[0].sentences.push({
      exported: false,
      sentence: and(
        exists(member(bound(0n), bound(0n))),
        member(free(0n), free(0n))
      ),
    });
    session.contexts[0].freeVariableCount = 1n;

    expect(session.exportSentence(0n)).toBe("failed");
    expect(session.contexts[0].sentences.get(0)?.exported).toBe(false);
  }

  {
    const session = startInteractiveSession();
    session.contexts[0].sentences = session.contexts[0].sentences.push({
      exported: false,
      sentence: not(exists(member(bound(0n), bound(0n)))),
    });
    session.contexts[0].freeVariableCount = 1n;

    expect(session.exportSentence(0n)).toBe("successful");
    expect(session.contexts[0].sentences.get(0)?.exported).toBe(true);
  }

  {
    const session = startInteractiveSession();
    session.contexts[0].sentences = session.contexts[0].sentences.push({
      exported: false,
      sentence: and(
        not(exists(member(bound(0n), bound(0n)))),
        forall(member(bound(0n), bound(0n)))
      ),
    });
    session.contexts[0].freeVariableCount = 1n;

    expect(session.exportSentence(0n)).toBe("successful");
    expect(session.contexts[0].sentences.get(0)?.exported).toBe(true);
  }

  {
    const session = startInteractiveSession();
    session.contexts[0].sentences = session.contexts[0].sentences.push({
      exported: false,
      sentence: and(
        not(exists(member(bound(0n), free(0n)))),
        forall(member(bound(0n), bound(0n)))
      ),
    });
    session.contexts[0].freeVariableCount = 1n;

    expect(session.exportSentence(0n)).toBe("failed");
    expect(session.contexts[0].sentences.get(0)?.exported).toBe(false);
  }

  {
    const session = startInteractiveSession();
    session.contexts[0].sentences = session.contexts[0].sentences.push({
      exported: false,
      sentence: or(
        not(exists(member(bound(0n), bound(0n)))),
        forall(member(bound(0n), bound(0n)))
      ),
    });
    session.contexts[0].freeVariableCount = 1n;

    expect(session.exportSentence(0n)).toBe("successful");
    expect(session.contexts[0].sentences.get(0)?.exported).toBe(true);
  }

  {
    const session = startInteractiveSession();
    session.contexts[0].sentences = session.contexts[0].sentences.push({
      exported: false,
      sentence: or(
        not(exists(member(bound(0n), bound(0n)))),
        forall(member(free(0n), bound(0n)))
      ),
    });
    session.contexts[0].freeVariableCount = 1n;

    expect(session.exportSentence(0n)).toBe("failed");
    expect(session.contexts[0].sentences.get(0)?.exported).toBe(false);
  }

  {
    const session = startInteractiveSession();
    session.contexts[0].sentences = session.contexts[0].sentences.push({
      exported: false,
      sentence: and(
        not(exists(equal(bound(0n), bound(0n)))),
        forall(member(bound(0n), bound(0n)))
      ),
    });
    session.contexts[0].freeVariableCount = 1n;

    expect(session.exportSentence(0n)).toBe("successful");
    expect(session.contexts[0].sentences.get(0)?.exported).toBe(true);
  }

  {
    const session = startInteractiveSession();
    session.contexts[0].sentences = session.contexts[0].sentences.push({
      exported: false,
      sentence: and(
        not(exists(member(bound(0n), bound(0n)))),
        forall(equal(bound(0n), bound(0n)))
      ),
    });
    session.contexts[0].freeVariableCount = 1n;

    expect(session.exportSentence(0n)).toBe("successful");
    expect(session.contexts[0].sentences.get(0)?.exported).toBe(true);
  }

  {
    const session = startInteractiveSession();
    session.contexts[0].sentences = session.contexts[0].sentences.push({
      exported: false,
      sentence: imply(
        not(exists(member(bound(0n), bound(0n)))),
        forall(equal(bound(0n), bound(0n)))
      ),
    });
    session.contexts[0].freeVariableCount = 1n;

    expect(session.exportSentence(0n)).toBe("successful");
    expect(session.contexts[0].sentences.get(0)?.exported).toBe(true);
  }

  {
    const session = startInteractiveSession();
    session.contexts[0].sentences = session.contexts[0].sentences.push({
      exported: false,
      sentence: imply(
        not(exists(equal(free(0n), bound(0n)))),
        forall(member(bound(0n), bound(0n)))
      ),
    });
    session.contexts[0].freeVariableCount = 1n;

    expect(session.exportSentence(0n)).toBe("failed");
    expect(session.contexts[0].sentences.get(0)?.exported).toBe(false);
  }

  {
    const session = startInteractiveSession();

    session.contexts[0].definitions = session.contexts[0].definitions.push({
      parameterCount: 3n,
      sentence: forall(forall(member(bound(0n), bound(1n)))),
      exported: false,
    });

    session.contexts[0].sentences = session.contexts[0].sentences.push({
      exported: false,
      sentence: and(
        not(definition(0n, [free(0n), free(0n), free(0n)])),
        forall(member(bound(0n), bound(0n)))
      ),
    });
    session.contexts[0].freeVariableCount = 1n;

    expect(session.exportSentence(0n)).toBe("failed");
    expect(session.contexts[0].sentences.get(0)?.exported).toBe(false);
  }

  {
    const session = startInteractiveSession();

    session.contexts[0].definitions = session.contexts[0].definitions.push({
      parameterCount: 3n,
      sentence: forall(forall(member(bound(0n), bound(1n)))),
      exported: false,
    });

    session.contexts[0].sentences = session.contexts[0].sentences.push({
      exported: false,
      sentence: forall(
        and(
          not(definition(0n, [bound(0n), bound(0n), bound(0n)])),
          forall(member(bound(0n), bound(0n)))
        )
      ),
    });
    session.contexts[0].freeVariableCount = 1n;

    expect(session.exportSentence(0n)).toBe("failed");
    expect(session.contexts[0].sentences.get(0)?.exported).toBe(false);
  }

  {
    const session = startInteractiveSession();

    session.contexts[0].definitions = session.contexts[0].definitions.push({
      parameterCount: 3n,
      sentence: forall(forall(member(bound(0n), bound(1n)))),
      exported: true,
    });

    session.contexts[0].sentences = session.contexts[0].sentences.push({
      exported: false,
      sentence: forall(
        and(
          not(definition(0n, [bound(0n), bound(0n), bound(0n)])),
          forall(member(bound(0n), bound(0n)))
        )
      ),
    });
    session.contexts[0].freeVariableCount = 1n;

    expect(session.exportSentence(0n)).toBe("successful");
    expect(session.contexts[0].sentences.get(0)?.exported).toBe(true);
  }

  {
    const session = startInteractiveSession();

    session.contexts[0].sentences = session.contexts[0].sentences.push({
      exported: false,
      sentence: {
        type: "sentence scheme",
        parameterCounts: [3n],
        content: forall(
          and(
            not(definitionInScheme(0n, [bound(0n), bound(0n), bound(0n)])),
            forall(member(bound(0n), bound(0n)))
          )
        ),
      },
    });
    session.contexts[0].freeVariableCount = 1n;

    expect(session.exportSentence(0n)).toBe("successful");
    expect(session.contexts[0].sentences.get(0)?.exported).toBe(true);
  }

  {
    const session = startInteractiveSession();

    session.contexts[0].sentences = session.contexts[0].sentences.push({
      exported: false,
      sentence: {
        type: "sentence scheme",
        parameterCounts: [3n],
        content: forall(
          and(
            not(definitionInScheme(0n, [free(0n), bound(0n), bound(0n)])),
            forall(member(bound(0n), bound(0n)))
          )
        ),
      },
    });
    session.contexts[0].freeVariableCount = 1n;

    expect(session.exportSentence(0n)).toBe("failed");
    expect(session.contexts[0].sentences.get(0)?.exported).toBe(false);
  }

  {
    const session = startInteractiveSession();
    session.define(
      3n,
      and(
        member(parameter(0n), parameter(1n)),
        member(parameter(1n), parameter(2n))
      )
    );
    expect(session.exportDefinition(0n)).toBe("successful");
    expect(session.contexts[0].definitions.get(0)?.exported).toBe(true);
  }

  {
    const session = startInteractiveSession();
    session.contexts[0].freeVariableCount = 1n;
    session.define(
      3n,
      and(member(free(0n), parameter(1n)), member(parameter(1n), parameter(2n)))
    );
    expect(session.exportDefinition(0n)).toBe("failed");
    expect(session.contexts[0].definitions.get(0)?.exported).toBe(false);
  }
});
