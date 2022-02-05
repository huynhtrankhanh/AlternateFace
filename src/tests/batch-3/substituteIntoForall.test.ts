import {
  forall,
  free,
  startInteractiveSession,
  member,
  bound,
  parameter,
  exported,
  exists,
} from "../../theoremProver";

test("substituteIntoForall fails if sentence doesn't exist", () => {
  {
    const session = startInteractiveSession();
    session.contexts[0].freeVariableCount = 1n;
    expect(session.substituteIntoForall(0n, free(0n))).toBe("failed");
  }
  {
    const session = startInteractiveSession();
    session.contexts[0].freeVariableCount = 1n;
    session.contexts[0].sentences = session.contexts[0].sentences.push({
      sentence: forall(member(bound(0n), bound(0n))),
      exported: false,
    });
    expect(session.substituteIntoForall(1n, free(0n))).toBe("failed");
  }
});

test("substituteIntoForall fails if sentence is not a forall", () => {
  const session = startInteractiveSession();
  session.contexts[0].freeVariableCount = 1n;
  session.contexts[0].sentences = session.contexts[0].sentences.push({
    sentence: exists(member(bound(0n), bound(0n))),
    exported: false,
  });
  expect(session.substituteIntoForall(0n, free(0n))).toBe("failed");
});

test("substituteIntoForall correctly substitutes the variable", () => {
  const session = startInteractiveSession();
  session.contexts[0].freeVariableCount = 1n;
  session.contexts[0].sentences = session.contexts[0].sentences.push({
    sentence: forall(member(bound(0n), bound(0n))),
    exported: false,
  });

  const sentence = session.substituteIntoForall(0n, free(0n));

  expect(sentence).toBe(1n);

  expect(session.contexts[0].sentences.get(1)?.sentence).toStrictEqual(
    member(free(0n), free(0n))
  );

  expect(session.contexts[0].sentences.get(1)?.exported).toBe(false);

  session.contexts[0].sentences = session.contexts[0].sentences.push({
    sentence: exists(member(bound(0n), bound(0n))),
    exported: true,
  });

  const sentence2 = session.substituteIntoForall(0n, exported(2n));

  expect(sentence2).toBe(3n);

  expect(session.contexts[0].sentences.get(3)?.sentence).toStrictEqual(
    member(exported(2n), exported(2n))
  );

  expect(session.contexts[0].sentences.get(3)?.exported).toBe(false);
});

test("substituteIntoForall rejects invalid variables", () => {
  const session = startInteractiveSession();
  session.contexts[0].freeVariableCount = 1n;
  session.contexts[0].sentences = session.contexts[0].sentences.push({
    sentence: forall(member(bound(0n), bound(0n))),
    exported: false,
  });

  expect(session.substituteIntoForall(0n, free(1n))).toBe("failed");
  expect(session.substituteIntoForall(0n, free(-1n))).toBe("failed");
  expect(session.substituteIntoForall(0n, free(-2n))).toBe("failed");
  expect(session.substituteIntoForall(0n, bound(1n))).toBe("failed");
  expect(session.substituteIntoForall(0n, bound(0n))).toBe("failed");
  expect(session.substituteIntoForall(0n, bound(-1n))).toBe("failed");
  expect(session.substituteIntoForall(0n, parameter(-1n))).toBe("failed");
  expect(session.substituteIntoForall(0n, parameter(0n))).toBe("failed");
  expect(session.substituteIntoForall(0n, exported(0n))).toBe("failed");
  expect(session.substituteIntoForall(0n, exported(-1n))).toBe("failed");
  (session.contexts[0].sentences.get(0) as any).exported = true;
  expect(session.substituteIntoForall(0n, exported(0n))).toBe("failed");
  (session.contexts[0].sentences.get(0) as any).sentence = exists(
    member(bound(0n), bound(0n))
  );
  (session.contexts[0].sentences.get(0) as any).exported = false;
  expect(session.substituteIntoForall(0n, exported(0n))).toBe("failed");
});
