import {
  bound,
  forall,
  member,
  startInteractiveSession,
  exists,
  free,
} from "../../theoremProver";

test("getWitness fails if sentence doesn't exist", () => {
  const session = startInteractiveSession();
  for (let i = -5n; i <= 5n; i++) expect(session.getWitness(i)).toBe("failed");

  session.contexts[0].sentences = session.contexts[0].sentences.push({
    exported: false,
    sentence: forall(member(bound(0n), bound(0n))),
  });

  for (let i = 1n; i <= 5n; i++) expect(session.getWitness(i)).toBe("failed");
});

test("getWitness fails if sentence isn't an exists", () => {
  const session = startInteractiveSession();

  session.contexts[0].sentences = session.contexts[0].sentences.push({
    exported: false,
    sentence: forall(member(bound(0n), bound(0n))),
  });

  expect(session.getWitness(0n)).toBe("failed");
});

test("getWitness correctly creates a new sentence", () => {
  const session = startInteractiveSession();

  session.contexts[0].sentences = session.contexts[0].sentences.push({
    exported: false,
    sentence: exists(member(bound(0n), bound(0n))),
  });

  {
    const result = session.getWitness(0n);

    if (result === "failed") throw new Error("This shouldn't happen.");

    const { witnessIndex, sentenceIndex } = result;

    expect(witnessIndex).toBe(0n);
    expect(sentenceIndex).toBe(1n);

    expect(session.contexts[0].sentences.get(1)?.exported).toBe(false);
    expect(session.contexts[0].sentences.get(1)?.sentence).toStrictEqual(
      member(free(0n), free(0n))
    );

    expect(session.contexts[0].freeVariableCount).toBe(1n);
  }

  {
    const result = session.getWitness(0n);

    if (result === "failed") throw new Error("This shouldn't happen.");

    const { witnessIndex, sentenceIndex } = result;

    expect(witnessIndex).toBe(1n);
    expect(sentenceIndex).toBe(2n);

    expect(session.contexts[0].sentences.get(2)?.exported).toBe(false);
    expect(session.contexts[0].sentences.get(2)?.sentence).toStrictEqual(
      member(free(1n), free(1n))
    );

    expect(session.contexts[0].freeVariableCount).toBe(2n);
  }
});
