import { List } from "immutable";

type Variable = { type: "free" | "bound" | "exported"; index: bigint };

type Sentence =
  | { type: "forall"; content: Sentence }
  | { type: "exists"; content: Sentence }
  | { type: "and"; a: Sentence; b: Sentence }
  | { type: "or"; a: Sentence; b: Sentence }
  | { type: "imply"; a: Sentence; b: Sentence }
  | { type: "not"; content: Sentence }
  | { type: "member"; a: Variable; b: Variable };

const serializeSentence = (a: Sentence) => {
  const dfs = (a: Sentence): string => {
    if (a.type === "forall" || a.type === "exists" || a.type === "not")
      return `(${a.type} ${dfs(a.content)})`;
    if (a.type === "and" || a.type === "or" || a.type === "imply")
      return `(${a.type} ${dfs(a.a)} ${dfs(a.b)})`;

    const printVariable = (x: Variable) => {
      if (x.type === "free") return `[${x.index}]`;
      return `${x.index}`;
    };

    return `(${a.type} ${printVariable(a.a)} ${printVariable(a.b)})`;
  };

  return dfs(a);
};

type Goal = {
  inContext: Sentence;
  onExit: Sentence;
};

type ContextSentence = {
  sentence: Sentence;
  exported: boolean;
};

type Context = {
  sentences: List<ContextSentence>;
  goal: Goal | undefined;
  freeVariableCount: bigint;
  exportedVariableCount: bigint;
};

type SentenceIndex = bigint;

type Successful = "successful";
type Failed = "failed";

type SentenceFactory = (x: Sentence) => Sentence;
type SentenceFactory2 = (x: Sentence, y: Sentence) => Sentence;
type SentenceFactory3 = (a: Variable, b: Variable) => Sentence;
type VariableFactory = (a: bigint) => Variable;

const forall: SentenceFactory = (x) => ({ type: "forall", content: x });
const exists: SentenceFactory = (x) => ({ type: "exists", content: x });
const and: SentenceFactory2 = (a, b) => ({ type: "and", a, b });
const or: SentenceFactory2 = (a, b) => ({ type: "or", a, b });
const imply: SentenceFactory2 = (a, b) => ({ type: "imply", a, b });
const not: SentenceFactory = (x) => ({ type: "not", content: x });
const member: SentenceFactory3 = (a, b) => ({ type: "member", a, b });
const free: VariableFactory = (a) => ({ type: "free", index: a });
const bound: VariableFactory = (a) => ({ type: "bound", index: a });
const exported: VariableFactory = (a) => ({ type: "exported", index: a });

function startInteractiveSession() {
  const contexts: Context[] = [
    {
      sentences: List(),
      goal: undefined,
      freeVariableCount: 0n,
      exportedVariableCount: 0n,
    },
  ];

  const getCurrentContext = () => contexts[contexts.length - 1];

  const retrieve = (
    sentences: List<ContextSentence>,
    index: bigint
  ): Failed | ContextSentence => {
    if (index > Number.MAX_SAFE_INTEGER || index < 0) return "failed";
    return sentences.get(Number(index), "failed");
  };

  const identical = (a: Sentence, b: Sentence): boolean =>
    serializeSentence(a) === serializeSentence(b);

  const validateSentence = (
    a: Sentence,
    freeVariableCount: bigint,
    exportedVariableCount: bigint
  ): boolean => {
    let isValid = true;

    const dfs = (a: Sentence, binderCount: bigint) => {
      if (a.type === "exists" || a.type === "forall") {
        dfs(a.content, binderCount + 1n);
        return;
      }

      if (a.type === "and" || a.type === "or" || a.type === "imply") {
        dfs(a.a, binderCount);
        dfs(a.b, binderCount);
        return;
      }

      if (a.type === "not") {
        dfs(a.content, binderCount);
        return;
      }

      if (a.type === "member") {
        const x = a.a;
        const y = a.b;

        if (x.index < 0n) isValid = false;
        if (y.index < 0n) isValid = false;
        if (x.type === "bound" && x.index >= binderCount) isValid = false;
        if (y.type === "bound" && y.index >= binderCount) isValid = false;
        if (x.type === "free" && x.index >= freeVariableCount) isValid = false;
        if (y.type === "free" && y.index >= freeVariableCount) isValid = false;
        if (x.type === "exported" && x.index >= exportedVariableCount)
          isValid = false;
        if (y.type === "exported" && y.index >= exportedVariableCount)
          isValid = false;

        return;
      }
    };

    dfs(a, 0n);

    return isValid;
  };

  const substituteIntoBinder = (a: Sentence, b: Variable): Sentence => {
    if (a.type !== "forall" && a.type !== "exists")
      throw new Error("This shouldn't happen.");

    const dfs = (a: Sentence, depth: bigint = 0n): Sentence => {
      if (a.type === "member") {
        const replace = (a: Variable): Variable => {
          if (a.type !== "bound") return a;
          if (a.index === depth) return b;
          return { index: a.index, type: "bound" };
        };

        return { type: "member", a: replace(a.a), b: replace(a.b) };
      }

      if (a.type === "forall" || a.type === "exists")
        return { type: a.type, content: dfs(a.content, depth + 1n) };

      if (a.type === "not")
        return { type: a.type, content: dfs(a.content, depth) };

      if (a.type === "and" || a.type === "or" || a.type === "imply")
        return { type: a.type, a: dfs(a.a, depth), b: dfs(a.b, depth) };

      return a;
    };

    return dfs(a.content);
  };

  return {
    resolveGoal: (sentenceIndex: SentenceIndex): SentenceIndex | Failed => {
      const { goal, sentences } = getCurrentContext();
      if (goal === undefined)
        // There is nothing to prove.
        return "failed";

      const candidate = retrieve(sentences, sentenceIndex);

      if (candidate === "failed") return "failed";

      if (identical(goal.inContext, candidate.sentence)) {
        contexts.pop();
        const context = getCurrentContext();
        context.sentences = context.sentences.push({
          sentence: goal.onExit,
          exported: false,
        });
        return BigInt(context.sentences.size - 1);
      }

      return "failed";
    },
    excludedMiddle: (sentence: Sentence): bigint | Failed => {
      const { sentences, freeVariableCount, exportedVariableCount } =
        getCurrentContext();
      if (!validateSentence(sentence, freeVariableCount, exportedVariableCount))
        return "failed";

      getCurrentContext().sentences = sentences.push({
        sentence: {
          type: "or",
          a: sentence,
          b: { type: "not", content: sentence },
        },
        exported: false,
      });

      return BigInt(sentences.size);
    },
    forall: (sentence: Sentence): Successful | Failed => {
      const { sentences, freeVariableCount, exportedVariableCount } =
        getCurrentContext();
      if (!validateSentence(sentence, freeVariableCount, exportedVariableCount))
        return "failed";
      if (sentence.type !== "forall") return "failed";

      contexts.push({
        goal: {
          onExit: sentence,
          inContext: substituteIntoBinder(sentence, {
            type: "free",
            index: freeVariableCount,
          }),
        },
        freeVariableCount: freeVariableCount + 1n,
        exportedVariableCount,
        sentences,
      });

      return "successful";
    },
    exists: (sentence: Sentence, variable: Variable): Successful | Failed => {
      const { sentences, freeVariableCount, exportedVariableCount } =
        getCurrentContext();
      if (!validateSentence(sentence, freeVariableCount, exportedVariableCount))
        return "failed";
      if (sentence.type !== "exists") return "failed";

      // The variable must be a free variable in the local context.
      if (variable.type !== "free") return "failed";
      if (variable.index < 0n || variable.index >= freeVariableCount)
        return "failed";

      contexts.push({
        goal: {
          onExit: sentence,
          inContext: substituteIntoBinder(sentence, variable),
        },
        freeVariableCount,
        exportedVariableCount,
        sentences,
      });

      return "successful";
    },
    leftSideOfAnd: (sentenceIndex: SentenceIndex): SentenceIndex | Failed => {
      const { sentences } = getCurrentContext();
      const sentence = retrieve(sentences, sentenceIndex);
      if (sentence === "failed") return "failed";
      if (sentence.sentence.type !== "and") return "failed";

      getCurrentContext().sentences = sentences.push({
        sentence: sentence.sentence.a,
        exported: false,
      });

      return BigInt(sentences.size);
    },
    rightSideOfAnd: (sentenceIndex: SentenceIndex): SentenceIndex | Failed => {
      const { sentences } = getCurrentContext();
      const sentence = retrieve(sentences, sentenceIndex);
      if (sentence === "failed") return "failed";
      if (sentence.sentence.type !== "and") return "failed";

      getCurrentContext().sentences = sentences.push({
        sentence: sentence.sentence.b,
        exported: false,
      });

      return BigInt(sentences.size);
    },
    imply: (a: Sentence, b: Sentence): SentenceIndex | Failed => {
      const { sentences, freeVariableCount, exportedVariableCount } =
        getCurrentContext();
      if (!validateSentence(a, freeVariableCount, exportedVariableCount))
        return "failed";
      if (!validateSentence(b, freeVariableCount, exportedVariableCount))
        return "failed";

      contexts.push({
        freeVariableCount,
        exportedVariableCount,
        sentences: sentences.push({ sentence: a, exported: false }),
        goal: {
          inContext: b,
          onExit: { type: "imply", a, b },
        },
      });

      return BigInt(sentences.size);
    },
    // If a represents P and b represents P => Q, this rule produces a sentence that represents Q.
    modusPonens: (
      a: SentenceIndex,
      b: SentenceIndex
    ): SentenceIndex | Failed => {
      const { sentences } = getCurrentContext();
      const x = retrieve(sentences, a);
      const y = retrieve(sentences, b);
      if (x === "failed" || y === "failed") return "failed";

      if (y.sentence.type !== "imply") return "failed";
      if (!identical(y.sentence.a, x.sentence)) return "failed";

      getCurrentContext().sentences = sentences.push({
        sentence: y.sentence.b,
        exported: false,
      });

      return BigInt(sentences.size);
    },
    introduceConjunction: (
      a: SentenceIndex,
      b: SentenceIndex
    ): SentenceIndex | Failed => {
      const { sentences } = getCurrentContext();
      const x = retrieve(sentences, a);
      const y = retrieve(sentences, b);
      if (x === "failed" || y === "failed") return "failed";

      getCurrentContext().sentences = sentences.push({
        sentence: {
          type: "and",
          a: x.sentence,
          b: y.sentence,
        },
        exported: false,
      });

      return BigInt(sentences.size);
    },
    introduceDisjunctionLeft: (
      a: SentenceIndex,
      b: Sentence
    ): SentenceIndex | Failed => {
      const { sentences, freeVariableCount, exportedVariableCount } =
        getCurrentContext();
      if (!validateSentence(b, freeVariableCount, exportedVariableCount))
        return "failed";

      const x = retrieve(sentences, a);
      if (x === "failed") return "failed";

      getCurrentContext().sentences = sentences.push({
        sentence: { type: "or", a: x.sentence, b },
        exported: false,
      });

      return BigInt(sentences.size);
    },
    introduceDisjunctionRight: (
      a: Sentence,
      b: SentenceIndex
    ): SentenceIndex | Failed => {
      const { sentences, freeVariableCount, exportedVariableCount } =
        getCurrentContext();
      if (!validateSentence(a, freeVariableCount, exportedVariableCount))
        return "failed";

      const y = retrieve(sentences, b);
      if (y === "failed") return "failed";

      getCurrentContext().sentences = sentences.push({
        sentence: { type: "or", a, b: y.sentence },
        exported: false,
      });

      return BigInt(sentences.size);
    },
    // Produces ((a => c) and (b => c)) => ((a or b) => c).
    disjunctionImply: (
      a: Sentence,
      b: Sentence,
      c: Sentence
    ): SentenceIndex | Failed => {
      const { sentences, freeVariableCount, exportedVariableCount } =
        getCurrentContext();
      if (!validateSentence(a, freeVariableCount, exportedVariableCount))
        return "failed";
      if (!validateSentence(b, freeVariableCount, exportedVariableCount))
        return "failed";
      if (!validateSentence(c, freeVariableCount, exportedVariableCount))
        return "failed";

      getCurrentContext().sentences = sentences.push({
        sentence: {
          type: "imply",
          a: {
            type: "and",
            a: { type: "imply", a: a, b: c },
            b: { type: "imply", a: b, b: c },
          },
          b: { type: "imply", a: { type: "or", a, b }, b: c },
        },
        exported: false,
      });

      return BigInt(sentences.size);
    },
    notForall: (a: SentenceIndex): SentenceIndex | Failed => {
      const { sentences } = getCurrentContext();

      const x = retrieve(sentences, a);
      if (x === "failed") return "failed";
      if (x.sentence.type !== "not") return "failed";
      if (x.sentence.content.type !== "forall") return "failed";

      getCurrentContext().sentences = sentences.push({
        sentence: {
          type: "exists",
          content: {
            type: "not",
            content: x.sentence.content.content,
          },
        },
        exported: false,
      });

      return BigInt(sentences.size);
    },
    notExists: (a: SentenceIndex): SentenceIndex | Failed => {
      const { sentences } = getCurrentContext();

      const x = retrieve(sentences, a);
      if (x === "failed") return "failed";
      if (x.sentence.type !== "not") return "failed";
      if (x.sentence.content.type !== "exists") return "failed";

      getCurrentContext().sentences = sentences.push({
        sentence: {
          type: "forall",
          content: {
            type: "not",
            content: x.sentence.content.content,
          },
        },
        exported: false,
      });

      return BigInt(sentences.size);
    },
    // If a represents P and b represents not P, this rule produces a sentence c. This sentence
    // can be anything because we already have a contradiction.
    exfalso: (
      a: SentenceIndex,
      b: SentenceIndex,
      c: Sentence
    ): SentenceIndex | Failed => {
      const { sentences, freeVariableCount, exportedVariableCount } =
        getCurrentContext();

      const x = retrieve(sentences, a);
      const y = retrieve(sentences, b);

      if (x === "failed" || y === "failed") return "failed";
      if (y.sentence.type !== "not") return "failed";

      if (!identical(x.sentence, y.sentence.content)) return "failed";

      if (!validateSentence(c, freeVariableCount, exportedVariableCount))
        return "failed";

      getCurrentContext().sentences = sentences.push({
        sentence: c,
        exported: false,
      });

      return BigInt(sentences.size);
    },
    // This function is primarily for debugging.
    getState: () => {
      console.log(
        contexts.map((x) => ({
          freeVariableCount: x.freeVariableCount,
          sentences: x.sentences
            .map(
              (a) =>
                (a.exported ? "[EXPORTED] " : "") +
                serializeSentence(a.sentence)
            )
            .toJS(),
          goal:
            x.goal === undefined
              ? undefined
              : {
                  inContext: serializeSentence(x.goal.inContext),
                  onExit: serializeSentence(x.goal.onExit),
                },
        }))
      );
    },
  };
}

const session = startInteractiveSession();
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
);
session.forall(
  forall(
    forall(
      imply(
        imply(member(bound(1n), bound(0n)), member(free(0n), bound(0n))),
        or(not(member(bound(1n), bound(0n))), member(free(0n), bound(0n)))
      )
    )
  )
);
session.forall(
  forall(
    imply(
      imply(member(free(1n), bound(0n)), member(free(0n), bound(0n))),
      or(not(member(free(1n), bound(0n))), member(free(0n), bound(0n)))
    )
  )
);

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

session.getState();
