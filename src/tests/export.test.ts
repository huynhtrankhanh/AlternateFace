import {
  and,
  bound,
  exists,
  forall,
  member,
  startInteractiveSession,
  not,
  parameter,
  free,
  imply,
  or,
} from "../theoremProver";

test("can't export sentence in subgoal", () => {
  const session = startInteractiveSession();
  const sentence = session.imply(
    and(
      forall(forall(member(bound(0n), bound(1n)))),
      exists(member(bound(0n), bound(0n)))
    ),
    forall(member(bound(0n), bound(0n)))
  );

  if (sentence === "failed") throw new Error("failed");

  expect(session.exportSentence(sentence)).toBe("failed");
});

test("can export definition", () => {
  const session = startInteractiveSession();
  const handle = session.define(
    0n,
    and(
      forall(forall(member(bound(0n), bound(1n)))),
      forall(member(bound(0n), bound(0n)))
    )
  );
  if (handle === "failed") throw new Error("failed");
  expect(session.exportDefinition(handle)).toBe("successful");
});

test("can't export definition in subgoal", () => {
  const session = startInteractiveSession();
  if (
    session.imply(
      forall(
        exists(
          forall(
            exists(
              forall(
                exists(
                  forall(exists(forall(exists(member(bound(0n), bound(2n))))))
                )
              )
            )
          )
        )
      ),
      forall(not(member(bound(0n), bound(0n))))
    ) === "failed"
  )
    throw new Error("failed");

  const handle = session.define(3n, exists(member(bound(0n), parameter(0n))));
  if (handle === "failed") throw new Error("failed");
  expect(session.exportDefinition(handle)).toBe("failed");
});

test("can export sentence exactly once", () => {
  const session = startInteractiveSession();
  if (
    session.forall(
      forall(
        forall(
          forall(
            imply(
              imply(member(bound(1n), bound(0n)), member(bound(2n), bound(0n))),
              or(
                not(member(bound(1n), bound(0n))),
                member(bound(2n), bound(0n))
              )
            )
          )
        )
      )
    ) === "failed"
  )
    throw new Error("failed");
  if (
    session.forall(
      forall(
        forall(
          imply(
            imply(member(bound(1n), bound(0n)), member(free(0n), bound(0n))),
            or(not(member(bound(1n), bound(0n))), member(free(0n), bound(0n)))
          )
        )
      )
    ) === "failed"
  )
    throw new Error("failed");
  if (
    session.forall(
      forall(
        imply(
          imply(member(free(1n), bound(0n)), member(free(0n), bound(0n))),
          or(not(member(free(1n), bound(0n))), member(free(0n), bound(0n)))
        )
      )
    ) === "failed"
  )
    throw new Error("failed");

  const P = member(free(1n), free(2n));
  const Q = member(free(0n), free(2n));

  const h = session.excludedMiddle(P);
  const h1 = session.disjunctionImply(P, not(P), or(not(P), Q));
  const h2 = session.imply(imply(P, Q), or(not(P), Q));
  if (h2 === "failed") throw new Error("failed");
  const h3 = (() => {
    const h3 = session.imply(P, or(not(P), Q));
    if (h3 === "failed") throw new Error("failed");
    const h4 = session.modusPonens(h3, h2);
    if (h4 === "failed") throw new Error("failed");
    const h5 = session.introduceDisjunctionRight(not(P), h4);
    if (h5 === "failed") throw new Error("failed");
    return session.resolveGoal(h5);
  })();
  const h4 = (() => {
    const h3 = session.imply(not(P), or(not(P), Q));
    if (h3 === "failed") throw new Error("failed");
    const h4 = session.introduceDisjunctionLeft(h3, Q);
    if (h4 === "failed") throw new Error("failed");
    return session.resolveGoal(h4);
  })();
  if (h3 === "failed") throw new Error("failed");
  if (h4 === "failed") throw new Error("failed");
  const h5 = session.introduceConjunction(h3, h4);
  if (h5 === "failed") throw new Error("failed");
  if (h1 === "failed") throw new Error("failed");
  const h6 = session.modusPonens(h5, h1);
  if (h6 === "failed") throw new Error("failed");
  if (h === "failed") throw new Error("failed");
  const h7 = session.modusPonens(h, h6);
  if (h7 === "failed") throw new Error("failed");
  const m = session.resolveGoal(h7);
  if (m === "failed") throw new Error("failed");
  const n = session.resolveGoal(m);
  if (n === "failed") throw new Error("failed");
  const o = session.resolveGoal(n);
  if (o === "failed") throw new Error("failed");
  const p = session.resolveGoal(o);
  if (p === "failed") throw new Error("failed");
  expect(session.exportSentence(p)).toBe("successful");

  for (let i = 0n; i < 10n; i++)
    expect(session.exportSentence(p)).toBe("failed");
});

test("can't export sentence", () => {
  const session = startInteractiveSession();
  for (let i = -10n; i <= 10n; i++)
    expect(session.exportSentence(i)).toBe("failed");
});

test("can't export definition", () => {
  const session = startInteractiveSession();
  for (let i = -10n; i <= 10n; i++)
    expect(session.exportDefinition(i)).toBe("failed");
});
