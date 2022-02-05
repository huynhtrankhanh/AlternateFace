import {
  bound,
  forall,
  member,
  not,
  startInteractiveSession,
  free,
  exists,
  parameter,
  exported,
} from "../../theoremProver";

test("exists rejects everything else", () => {
  const session = startInteractiveSession();
  session.contexts[0].freeVariableCount = 1n;
  expect(session.exists(forall(member(bound(0n), bound(0n))), free(0n))).toBe(
    "failed"
  );
  expect(
    session.exists(not(forall(member(bound(0n), bound(0n)))), free(0n))
  ).toBe("failed");
});

test("exists rejects invalid sentences", () => {
  const session = startInteractiveSession();
  session.contexts[0].freeVariableCount = 1n;
  expect(session.exists(exists(member(bound(0n), bound(1n))), free(0n))).toBe(
    "failed"
  );
  expect(
    session.exists(exists(exists(member(bound(0n), free(1n)))), free(0n))
  ).toBe("failed");
});

test("when exists accepts a sentence, it correctly creates a subgoal", () => {
  const session = startInteractiveSession();
  session.contexts[0].freeVariableCount = 1n;
  expect(session.exists(exists(member(bound(0n), bound(0n))), free(0n))).toBe(
    "successful"
  );
  expect(session.contexts.length).toBe(2);
  expect(session.contexts[1].goal?.onExit).toStrictEqual(
    exists(member(bound(0n), bound(0n)))
  );
  expect(session.contexts[1].goal?.inContext).toStrictEqual(
    member(free(0n), free(0n))
  );
});

test("exists rejects invalid variables", () => {
  const session = startInteractiveSession();
  session.contexts[0].freeVariableCount = 1n;
  session.contexts[0].sentences = session.contexts[0].sentences.push({
    sentence: forall(member(bound(0n), bound(0n))),
    exported: false,
  });

  expect(session.exists(exists(member(bound(0n), bound(0n))), free(1n))).toBe(
    "failed"
  );
  expect(session.exists(exists(member(bound(0n), bound(0n))), free(-1n))).toBe(
    "failed"
  );
  expect(session.exists(exists(member(bound(0n), bound(0n))), free(-2n))).toBe(
    "failed"
  );
  expect(session.exists(exists(member(bound(0n), bound(0n))), bound(1n))).toBe(
    "failed"
  );
  expect(session.exists(exists(member(bound(0n), bound(0n))), bound(0n))).toBe(
    "failed"
  );
  expect(session.exists(exists(member(bound(0n), bound(0n))), bound(-1n))).toBe(
    "failed"
  );
  expect(
    session.exists(exists(member(bound(0n), bound(0n))), parameter(-1n))
  ).toBe("failed");
  expect(
    session.exists(exists(member(bound(0n), bound(0n))), parameter(0n))
  ).toBe("failed");
  expect(
    session.exists(exists(member(bound(0n), bound(0n))), exported(0n))
  ).toBe("failed");
  expect(
    session.exists(exists(member(bound(0n), bound(0n))), exported(-1n))
  ).toBe("failed");
  (session.contexts[0].sentences.get(0) as any).exported = true;
  expect(
    session.exists(exists(member(bound(0n), bound(0n))), exported(0n))
  ).toBe("failed");
  (session.contexts[0].sentences.get(0) as any).sentence = exists(
    member(bound(0n), bound(0n))
  );
  (session.contexts[0].sentences.get(0) as any).exported = false;
  expect(
    session.exists(exists(member(bound(0n), bound(0n))), exported(0n))
  ).toBe("failed");
});
