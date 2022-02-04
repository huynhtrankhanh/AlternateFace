import {
  bound,
  exists,
  startInteractiveSession,
  member,
  not,
  forall,
  free,
} from "../../theoremProver";

test("forall rejects everything else", () => {
  const session = startInteractiveSession();
  expect(session.forall(exists(member(bound(0n), bound(0n))))).toBe("failed");
  expect(session.forall(not(forall(member(bound(0n), bound(0n)))))).toBe(
    "failed"
  );
});

test("forall rejects invalid sentences", () => {
  const session = startInteractiveSession();
  expect(session.forall(forall(member(bound(0n), bound(1n))))).toBe("failed");
  expect(session.forall(forall(exists(member(bound(0n), free(1n)))))).toBe(
    "failed"
  );
});

test("when forall accepts a sentence, it correctly creates a subgoal", () => {
  const session = startInteractiveSession();
  expect(session.forall(forall(member(bound(0n), bound(0n))))).toBe(
    "successful"
  );
  expect(session.contexts.length).toBe(2);
  expect(session.contexts[1].goal?.onExit).toStrictEqual(
    forall(member(bound(0n), bound(0n)))
  );
  expect(session.contexts[1].goal?.inContext).toStrictEqual(
    member(free(0n), free(0n))
  );
  expect(session.contexts[1].freeVariableCount).toBe(1n);
});
