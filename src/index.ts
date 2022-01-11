import { List } from "immutable";

type Variable = { type: "free" | "bound"; index: bigint };

type Sentence =
  | { type: "forall"; content: Sentence }
  | { type: "exists"; content: Sentence }
  | { type: "and" | "or" | "imply"; a: Sentence; b: Sentence }
  | { type: "not"; content: Sentence }
  | { type: "member"; a: Variable; b: Variable };

type Goal = {
  inContext: Sentence;
  onExit: Sentence;
};

type Context = {
  sentences: List<Sentence>;
  goal: Goal | undefined;
  freeVariableCount: bigint;
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
const or: SentenceFactory2 = (a, b) => ({ type: "and", a, b });
const imply: SentenceFactory2 = (a, b) => ({ type: "and", a, b });
const not: SentenceFactory = (x) => ({ type: "exists", content: x });
const member: SentenceFactory3 = (a, b) => ({ type: "member", a, b });
const free: VariableFactory = (a) => ({ type: "free", index: a });
const bound: VariableFactory = (a) => ({ type: "bound", index: a });

function startInteractiveSession() {
  const contexts: Context[] = [
    { sentences: List(), goal: undefined, freeVariableCount: 0n },
  ];

  const getCurrentContext = () => contexts[contexts.length - 1];

  const retrieve = (
    sentences: List<Sentence>,
    index: bigint
  ): Failed | Sentence => {
    if (index > Number.MAX_SAFE_INTEGER || index < 0) return "failed";
    return sentences.get(Number(index), "failed");
  };

  const identical = (a: Sentence, b: Sentence): boolean =>
    JSON.stringify(a) === JSON.stringify(b);

  const validateSentence = (
    a: Sentence,
    freeVariableCount: bigint
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

      if (a.type === "forall" || a.type === "exists" || a.type === "not")
        return { type: a.type, content: dfs(a.content, depth + 1n) };

      if (a.type === "and" || a.type === "or" || a.type === "imply")
        return { type: a.type, a: dfs(a.a), b: dfs(a.b, depth + 1n) };
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

      if (identical(goal.inContext, candidate)) {
        contexts.pop();
        const context = getCurrentContext();
        context.sentences = context.sentences.push(goal.onExit);
        return BigInt(sentences.size);
      }

      return "failed";
    },
    excludedMiddle: (sentence: Sentence): bigint | Failed => {
      const { sentences, freeVariableCount } = getCurrentContext();
      if (!validateSentence(sentence, freeVariableCount)) return "failed";

      getCurrentContext().sentences = sentences.push({
        type: "or",
        a: sentence,
        b: { type: "not", content: sentence },
      });

      return BigInt(sentences.size);
    },
    forall: (sentence: Sentence): Successful | Failed => {
      const { sentences, freeVariableCount } = getCurrentContext();
      if (!validateSentence(sentence, freeVariableCount)) return "failed";
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
        sentences,
      });

      return "successful";
    },
    exists: (sentence: Sentence, variable: Variable): Successful | Failed => {
      const { sentences, freeVariableCount } = getCurrentContext();
      if (!validateSentence(sentence, freeVariableCount)) return "failed";
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
        sentences,
      });

      return "successful";
    },
    leftSideOfAnd: (sentenceIndex: SentenceIndex): SentenceIndex | Failed => {
      const { sentences } = getCurrentContext();
      const sentence = retrieve(sentences, sentenceIndex);
      if (sentence === "failed") return "failed";
      if (sentence.type !== "and") return "failed";

      getCurrentContext().sentences = sentences.push(sentence.a);

      return BigInt(sentences.size);
    },
    rightSideOfAnd: (sentenceIndex: SentenceIndex): SentenceIndex | Failed => {
      const { sentences } = getCurrentContext();
      const sentence = retrieve(sentences, sentenceIndex);
      if (sentence === "failed") return "failed";
      if (sentence.type !== "and") return "failed";

      getCurrentContext().sentences = sentences.push(sentence.b);

      return BigInt(sentences.size);
    },
    imply: (a: Sentence, b: Sentence): Successful | Failed => {
      const { sentences, freeVariableCount } = getCurrentContext();
      if (!validateSentence(a, freeVariableCount)) return "failed";
      if (!validateSentence(b, freeVariableCount)) return "failed";

      contexts.push({
        freeVariableCount,
        sentences: sentences.push(a),
        goal: {
          inContext: b,
          onExit: { type: "imply", a, b },
        },
      });
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

      if (y.type !== "imply") return "failed";
      if (!identical(y.a, x)) return "failed";

      getCurrentContext().sentences = sentences.push(y.b);

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
        type: "and",
        a: x,
        b: y,
      });

      return BigInt(sentences.size);
    },
    introduceDisjunctionLeft: (
      a: SentenceIndex,
      b: Sentence
    ): SentenceIndex | Failed => {
      const { sentences, freeVariableCount } = getCurrentContext();
      if (!validateSentence(b, freeVariableCount)) return "failed";

      const x = retrieve(sentences, a);
      if (x === "failed") return "failed";

      getCurrentContext().sentences = sentences.push({ type: "or", a: x, b });

      return BigInt(sentences.size);
    },
    introduceDisjunctionRight: (
      a: Sentence,
      b: SentenceIndex
    ): SentenceIndex | Failed => {
      const { sentences, freeVariableCount } = getCurrentContext();
      if (!validateSentence(a, freeVariableCount)) return "failed";

      const y = retrieve(sentences, b);
      if (y === "failed") return "failed";

      getCurrentContext().sentences = sentences.push({ type: "or", a, b: y });

      return BigInt(sentences.size);
    },
    // Produces ((a => c) and (b => c)) => ((a or b) => c).
    disjunctionImply: (
      a: Sentence,
      b: Sentence,
      c: Sentence
    ): SentenceIndex | Failed => {
      const { sentences, freeVariableCount } = getCurrentContext();
      if (!validateSentence(a, freeVariableCount)) return "failed";
      if (!validateSentence(b, freeVariableCount)) return "failed";
      if (!validateSentence(c, freeVariableCount)) return "failed";

      getCurrentContext().sentences = sentences.push({
        type: "imply",
        a: {
          type: "and",
          a: { type: "imply", a: a, b: c },
          b: { type: "imply", a: b, b: c },
        },
        b: { type: "imply", a: { type: "or", a, b }, b: c },
      });

      return BigInt(sentences.size);
    },
    notForall: (a: SentenceIndex): SentenceIndex | Failed => {
      const { sentences } = getCurrentContext();

      const x = retrieve(sentences, a);
      if (x === "failed") return "failed";
      if (x.type !== "not") return "failed";
      if (x.content.type !== "forall") return "failed";

      getCurrentContext().sentences = sentences.push({
        type: "exists",
        content: {
          type: "not",
          content: x.content.content,
        },
      });

      return BigInt(sentences.size);
    },
    notExists: (a: SentenceIndex): SentenceIndex | Failed => {
      const { sentences } = getCurrentContext();

      const x = retrieve(sentences, a);
      if (x === "failed") return "failed";
      if (x.type !== "not") return "failed";
      if (x.content.type !== "exists") return "failed";

      getCurrentContext().sentences = sentences.push({
        type: "forall",
        content: {
          type: "not",
          content: x.content.content,
        },
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
      const { sentences, freeVariableCount } = getCurrentContext();

      const x = retrieve(sentences, a);
      const y = retrieve(sentences, b);

      if (x === "failed" || y === "failed") return "failed";
      if (y.type !== "not") return "failed";

      if (!identical(x, y.content)) return "failed";

      if (!validateSentence(c, freeVariableCount)) return "failed";

      getCurrentContext().sentences = sentences.push(c);

      return BigInt(sentences.size);
    },
  };
}

const session = startInteractiveSession();
