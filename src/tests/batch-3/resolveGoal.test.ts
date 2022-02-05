import { List } from "immutable";
import {
  bound,
  exists,
  forall,
  member,
  startInteractiveSession,
} from "../../theoremProver";

test("resolveGoal fails if there's no goal", () => {
  const session = startInteractiveSession();
  session.contexts[0].sentences = session.contexts[0].sentences.push({
    sentence: forall(member(bound(0n), bound(0n))),
    exported: false,
  });

  expect(session.resolveGoal(0n)).toBe("failed");
});

test("resolveGoal fails if sentence doesn't exist", () => {
  const session = startInteractiveSession();
  session.contexts.push({
    definitions: List(),
    freeVariableCount: 0n,
    sentences: List([
      { sentence: forall(member(bound(0n), bound(0n))), exported: false },
    ]),
    goal: {
      inContext: forall(member(bound(0n), bound(0n))),
      onExit: forall(member(bound(0n), bound(0n))),
    },
  });

  expect(session.resolveGoal(1n)).toBe("failed");
});

test("resolveGoal succeeds if sentence matches goal", () => {
  const session = startInteractiveSession();
  session.contexts.push({
    definitions: List(),
    freeVariableCount: 0n,
    sentences: List([
      { sentence: forall(member(bound(0n), bound(0n))), exported: false },
    ]),
    goal: {
      inContext: forall(member(bound(0n), bound(0n))),
      onExit: forall(member(bound(0n), bound(0n))),
    },
  });

  expect(session.resolveGoal(0n) === "failed").toBe(false);

  expect(session.contexts.length === 1);

  expect(session.contexts[0].sentences.get(0)?.sentence).toStrictEqual(
    forall(member(bound(0n), bound(0n)))
  );

  expect(session.contexts[0].sentences.get(0)?.exported).toBe(false);
});

test("resolveGoal fails if sentence doesn't match goal", () => {
  const session = startInteractiveSession();
  session.contexts.push({
    definitions: List(),
    freeVariableCount: 0n,
    sentences: List([
      { sentence: forall(member(bound(0n), bound(0n))), exported: false },
    ]),
    goal: {
      inContext: exists(member(bound(0n), bound(0n))),
      onExit: forall(member(bound(0n), bound(0n))),
    },
  });

  expect(session.resolveGoal(0n)).toBe("failed");
});
