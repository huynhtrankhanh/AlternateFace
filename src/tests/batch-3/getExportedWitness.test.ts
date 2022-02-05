import {
  bound,
  forall,
  member,
  startInteractiveSession,
  exists,
  exported,
} from "../../theoremProver";

test("getExportedWitness fails if sentence doesn't exist", () => {
  const session = startInteractiveSession();
  for (let i = -5n; i <= 5n; i++)
    expect(session.getExportedWitness(i)).toBe("failed");

  session.contexts[0].sentences = session.contexts[0].sentences.push({
    exported: false,
    sentence: forall(member(bound(0n), bound(0n))),
  });

  for (let i = 1n; i <= 5n; i++)
    expect(session.getExportedWitness(i)).toBe("failed");
});

test("getExportedWitness fails if sentence isn't an exists", () => {
  const session = startInteractiveSession();

  session.contexts[0].sentences = session.contexts[0].sentences.push({
    exported: true,
    sentence: forall(member(bound(0n), bound(0n))),
  });

  expect(session.getExportedWitness(0n)).toBe("failed");
});

test("getExportedWitness fails if sentence isn't exported", () => {
  const session = startInteractiveSession();

  session.contexts[0].sentences = session.contexts[0].sentences.push({
    exported: false,
    sentence: exists(member(bound(0n), bound(0n))),
  });

  expect(session.getExportedWitness(0n)).toBe("failed");
});

test("getExportedWitness correctly creates a new sentence", () => {
  const session = startInteractiveSession();

  session.contexts[0].sentences = session.contexts[0].sentences.push({
    exported: true,
    sentence: exists(member(bound(0n), bound(0n))),
  });

  {
    const sentenceIndex = session.getExportedWitness(0n);

    if (sentenceIndex === "failed") throw new Error("This shouldn't happen.");

    expect(sentenceIndex).toBe(1n);

    expect(session.contexts[0].sentences.get(1)?.exported).toBe(false);
    expect(session.contexts[0].sentences.get(1)?.sentence).toStrictEqual(
      member(exported(0n), exported(0n))
    );

    expect(session.contexts[0].freeVariableCount).toBe(0n);
  }

  {
    const sentenceIndex = session.getExportedWitness(0n);

    if (sentenceIndex === "failed") throw new Error("This shouldn't happen.");

    expect(sentenceIndex).toBe(2n);

    expect(session.contexts[0].sentences.get(2)?.exported).toBe(false);
    expect(session.contexts[0].sentences.get(2)?.sentence).toStrictEqual(
      member(exported(0n), exported(0n))
    );

    expect(session.contexts[0].freeVariableCount).toBe(0n);
  }
});
