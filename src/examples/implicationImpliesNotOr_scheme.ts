import {
  imply,
  or,
  not,
  startInteractiveSession,
  Sentence,
} from "../theoremProver";

const session = startInteractiveSession();
session.proveSentenceScheme({
  parameterCounts: [0n, 0n],
  type: "sentence scheme",
  content: imply(
    imply(
      {
        type: "use definition in sentence scheme",
        definitionIndex: 0n,
        arguments: [],
      },
      {
        type: "use definition in sentence scheme",
        definitionIndex: 1n,
        arguments: [],
      }
    ),
    or(
      not({
        type: "use definition in sentence scheme",
        definitionIndex: 0n,
        arguments: [],
      }),
      {
        type: "use definition in sentence scheme",
        definitionIndex: 1n,
        arguments: [],
      }
    )
  ),
});

session.getState();

const P: Sentence = {
  type: "use definition",
  definitionIndex: 0n,
  arguments: [],
};

const Q: Sentence = {
  type: "use definition",
  definitionIndex: 1n,
  arguments: [],
};

const handle = session.imply(imply(P, Q), or(not(P), Q));

const split = session.excludedMiddle(P);
const splitCases = session.disjunctionImply(P, not(P), or(not(P), Q));

const handle2 = session.imply(P, or(not(P), Q));

if (handle2 === "failed") throw new Error("failed");
if (handle === "failed") throw new Error("failed");

const target1 = session.modusPonens(handle2, handle);
if (target1 === "failed") throw new Error("failed");
const result1 = session.introduceDisjunctionRight(not(P), target1);
if (result1 === "failed") throw new Error("failed");
const branch1 = session.resolveGoal(result1);

const handle3 = session.imply(not(P), or(not(P), Q));
if (handle3 === "failed") throw new Error("failed");

const result2 = session.introduceDisjunctionLeft(handle3, Q);
if (result2 === "failed") throw new Error("failed");
const branch2 = session.resolveGoal(result2);

if (branch1 === "failed") throw new Error("failed");
if (branch2 === "failed") throw new Error("failed");
const conjunction = session.introduceConjunction(branch1, branch2);
if (conjunction === "failed") throw new Error("failed");
if (splitCases === "failed") throw new Error("failed");
const close = session.modusPonens(conjunction, splitCases);
if (close === "failed") throw new Error("failed");
if (split === "failed") throw new Error("failed");
const goal = session.modusPonens(split, close);
if (goal === "failed") throw new Error("failed");
session.resolveGoal(goal);
session.resolveGoal(handle);
session.getState();
