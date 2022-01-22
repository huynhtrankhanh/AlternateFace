// This file assumes that all parameters are valid in the current context.
// This is the responsibility of the theoremProver.ts file, and this file makes
// no effort to validate the parameters.

import {
  Variable,
  forall,
  Sentence,
  member,
  bound,
  and,
  imply,
  equal,
  exists,
  not,
  or,
} from "./theoremProver";

const iff = (a: Sentence, b: Sentence) => and(imply(a, b), imply(b, a));

const axiomExtensionality: Sentence = forall(
  forall(
    iff(
      forall(iff(member(bound(0n), bound(2n)), member(bound(0n), bound(1n)))),
      equal(bound(1n), bound(0n))
    )
  )
);

type BoundVariableIndex = bigint;

const notEmpty = (a: BoundVariableIndex): Sentence =>
  exists(member(bound(0n), bound(a + 1n)));

const disjoint = (a: BoundVariableIndex, b: BoundVariableIndex): Sentence =>
  forall(
    or(
      not(member(bound(0n), bound(a + 1n))),
      not(member(bound(0n), bound(b + 1n)))
    )
  );

const axiomRegularity: Sentence = forall(
  imply(
    notEmpty(0n),
    exists(and(member(bound(0n), bound(1n)), disjoint(0n, 1n)))
  )
);

// const axiomSpecification = (a:forall(exists())

// todo: support predicates/definitions
