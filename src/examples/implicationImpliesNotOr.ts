import {
  forall,
  imply,
  or,
  not,
  member,
  bound,
  free,
  startInteractiveSession,
} from "../theoremProver";

const session = startInteractiveSession();
if (
  session.forall(
    forall(
      forall(
        forall(
          imply(
            imply(member(bound(1n), bound(0n)), member(bound(2n), bound(0n))),
            or(not(member(bound(1n), bound(0n))), member(bound(2n), bound(0n)))
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
