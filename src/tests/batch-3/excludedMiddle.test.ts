import {
  forall,
  member,
  startInteractiveSession,
  bound,
  or,
  not,
} from "../../theoremProver";

test("if sentence validation fails, excludedMiddle doesn't add a new sentence", () => {
  const session = startInteractiveSession();
  expect(session.excludedMiddle(forall(member(bound(1n), bound(0n))))).toBe(
    "failed"
  );
  expect(session.contexts[0].sentences.size).toEqual(0);
});

test("if sentence validation succeeds, excludedMiddle adds a new sentence", () => {
  const session = startInteractiveSession();
  expect(
    session.excludedMiddle(forall(member(bound(0n), bound(0n)))) !== "failed"
  ).toBe(true);
  expect(session.contexts[0].sentences.get(0)?.sentence).toStrictEqual(
    or(
      forall(member(bound(0n), bound(0n))),
      not(forall(member(bound(0n), bound(0n))))
    )
  );
});
