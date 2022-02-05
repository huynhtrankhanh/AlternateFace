import {
  and,
  bound,
  equal,
  exists,
  forall,
  or,
  member,
  startInteractiveSession,
} from "../../theoremProver";

test("rightSideOfAnd fails when sentence doesn't exist", () => {
  const session = startInteractiveSession();
  for (let i = -5n; i <= 5n; i++)
    expect(session.rightSideOfAnd(i)).toBe("failed");

  session.contexts[0].sentences = session.contexts[0].sentences.push({
    exported: false,
    sentence: and(
      forall(member(bound(0n), bound(0n))),
      exists(equal(bound(0n), bound(0n)))
    ),
  });

  for (let i = 1n; i <= 5n; i++)
    expect(session.rightSideOfAnd(i)).toBe("failed");
});

test("rightSideOfAnd fails when sentence isn't an and", () => {
  const session = startInteractiveSession();

  session.contexts[0].sentences = session.contexts[0].sentences.push({
    exported: false,
    sentence: or(
      forall(member(bound(0n), bound(0n))),
      exists(equal(bound(0n), bound(0n)))
    ),
  });

  expect(session.rightSideOfAnd(0n)).toBe("failed");
});

test("rightSideOfAnd correctly constructs a new sentence", () => {
  const session = startInteractiveSession();

  session.contexts[0].sentences = session.contexts[0].sentences.push({
    exported: false,
    sentence: and(
      forall(member(bound(0n), bound(0n))),
      exists(equal(bound(0n), bound(0n)))
    ),
  });

  const handle = session.rightSideOfAnd(0n);

  if (handle === "failed") throw new Error("This shouldn't happen.");

  expect(handle).toBe(1n);

  expect(session.contexts[0].sentences.get(1)?.exported).toBe(false);
  expect(session.contexts[0].sentences.get(1)?.sentence).toStrictEqual(
    exists(equal(bound(0n), bound(0n)))
  );
});
