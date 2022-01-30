import { List } from "immutable";

export type SentenceIndex = bigint;
export type DefinitionIndex = bigint;
export type Variable =
  | { type: "free" | "bound"; index: bigint }
  | { type: "witness of exported existential"; sentenceIndex: SentenceIndex }
  | { type: "definition parameter"; index: bigint };

export type Sentence =
  | { type: "forall"; content: Sentence }
  | { type: "exists"; content: Sentence }
  | { type: "and"; a: Sentence; b: Sentence }
  | { type: "or"; a: Sentence; b: Sentence }
  | { type: "imply"; a: Sentence; b: Sentence }
  | { type: "not"; content: Sentence }
  | { type: "member"; a: Variable; b: Variable }
  | { type: "equal"; a: Variable; b: Variable }
  | {
      type: "use definition";
      arguments: Variable[];
      definitionIndex: DefinitionIndex;
    }
  | {
      type: "use definition in sentence scheme";
      arguments: Variable[];
      definitionIndex: DefinitionIndex;
    };

// See https://en.wikipedia.org/wiki/Axiom_schema
// This is called "sentence scheme", not "axiom scheme" (or "axiom schema")
// because a sentence scheme can be proven.
export type SentenceScheme = {
  type: "sentence scheme";
  // A sentence scheme takes one or many definitions to produce a sentence.
  // The number of definitions that the sentence scheme takes is the length of
  // the parameterCounts array. The parameterCounts array represents the parameter
  // counts of the definitions that this sentence scheme takes.
  parameterCounts: bigint[];
  // Now this sentence can refer to the definitions taken by this sentence scheme.
  content: Sentence;
};

const serializeSentence = (a: Sentence) => {
  const dfs = (a: Sentence): string => {
    if (a.type === "forall" || a.type === "exists" || a.type === "not")
      return `(${a.type} ${dfs(a.content)})`;
    if (a.type === "and" || a.type === "or" || a.type === "imply")
      return `(${a.type} ${dfs(a.a)} ${dfs(a.b)})`;

    const printVariable = (x: Variable): string => {
      const { type } = x;
      if (type === "free") return `[${x.index}]`;
      if (type === "witness of exported existential")
        return `(witness ${x.sentenceIndex})`;
      if (type === "bound") return `${x.index}`;
      if (type === "definition parameter") return `(parameter ${x.index})`;
      throw new Error(`This shouldn't happen. Unhandled type: ${type}`);
    };

    if (a.type === "use definition")
      return `(definition ${a.definitionIndex} [${a.arguments
        .map(printVariable)
        .join(", ")}])`;

    if (a.type === "use definition in sentence scheme")
      return `(definitionInScheme ${a.definitionIndex} [${a.arguments
        .map(printVariable)
        .join(", ")}])`;

    return `(${a.type} ${printVariable(a.a)} ${printVariable(a.b)})`;
  };

  return dfs(a);
};

const serializeSentenceScheme = (a: SentenceScheme) => {
  return `(scheme [${a.parameterCounts
    .map((x) => x.toString())
    .join(", ")}] ${serializeSentence(a.content)})`;
};

const serializeSentenceOrScheme = (a: Sentence | SentenceScheme) => {
  if (a.type === "sentence scheme") return serializeSentenceScheme(a);
  return serializeSentence(a);
};

type Goal = {
  inContext: Sentence;
  onExit: Sentence | SentenceScheme;
};

type ContextSentence = {
  sentence: Sentence | SentenceScheme;
  exported: boolean;
};

type Definition = {
  parameterCount: bigint;
  sentence: Sentence | { type: "opaque" };
  exported: boolean;
};

const serializeDefinition = (definition: Definition): string => {
  if (definition.sentence.type === "opaque")
    return `(parameters ${definition.parameterCount} (definition is opaque))`;
  return `(parameters ${definition.parameterCount}) ${serializeSentence(
    definition.sentence
  )}`;
};

type Context = {
  sentences: List<ContextSentence>;
  definitions: List<Definition>;
  goal: Goal | undefined;
  freeVariableCount: bigint;
};

export type WitnessIndex = bigint;

export type Successful = "successful";
export type Failed = "failed";

export type SentenceFactory = (x: Sentence) => Sentence;
export type SentenceFactory2 = (x: Sentence, y: Sentence) => Sentence;
export type SentenceFactory3 = (a: Variable, b: Variable) => Sentence;
export type VariableFactory = (a: bigint) => Variable;

export const forall: SentenceFactory = (x) => ({ type: "forall", content: x });
export const exists: SentenceFactory = (x) => ({ type: "exists", content: x });
export const and: SentenceFactory2 = (a, b) => ({ type: "and", a, b });
export const or: SentenceFactory2 = (a, b) => ({ type: "or", a, b });
export const imply: SentenceFactory2 = (a, b) => ({ type: "imply", a, b });
export const not: SentenceFactory = (x) => ({ type: "not", content: x });
export const member: SentenceFactory3 = (a, b) => ({ type: "member", a, b });
export const free: VariableFactory = (a) => ({ type: "free", index: a });
export const bound: VariableFactory = (a) => ({ type: "bound", index: a });
export const exported: VariableFactory = (a) => ({
  type: "witness of exported existential",
  sentenceIndex: a,
});
export const equal: SentenceFactory3 = (a, b) => ({ type: "equal", a, b });

const checkForExhaustiveness = (_: never): never => {
  throw new Error("This shouldn't happen");
};

export function startInteractiveSession() {
  const contexts: Context[] = [
    {
      sentences: List(),
      definitions: List(),
      goal: undefined,
      freeVariableCount: 0n,
    },
  ];

  const getCurrentContext = () => contexts[contexts.length - 1];

  const isNonnegativeInteger = (index: bigint): boolean =>
    index <= Number.MAX_SAFE_INTEGER && index >= 0;
  const retrieveDefinition = (index: bigint): Failed | Definition => {
    if (isNonnegativeInteger(index)) return "failed";
    return getCurrentContext().definitions.get(Number(index), "failed");
  };

  const retrieve = (index: bigint): Failed | ContextSentence => {
    if (isNonnegativeInteger(index)) return "failed";
    return getCurrentContext().sentences.get(Number(index), "failed");
  };

  const exportedSentences = (() => {
    const exportedSentences = new Set<string>();

    const add = (sentence: Sentence | SentenceScheme) => {
      exportedSentences.add(serializeSentenceOrScheme(sentence));
    };

    const isPresent = (sentence: Sentence | SentenceScheme): boolean =>
      exportedSentences.has(serializeSentenceOrScheme(sentence));

    return { add, isPresent };
  })();

  const exportedDefinitions = (() => {
    const exportedDefinitions = new Set<string>();

    const add = (definition: Definition) => {
      exportedDefinitions.add(serializeDefinition(definition));
    };

    const isPresent = (definition: Definition): boolean =>
      exportedDefinitions.has(serializeDefinition(definition));

    return { add, isPresent };
  })();

  // **This function assumes that the sentence or sentence scheme is already valid.**
  // This is true for all sentences in the contexts.
  // IF YOU MODIFY THE IMPLEMENTATION OF THIS FUNCTION, PLEASE MAKE SURE NOT TO
  // DUPLICATE THE WORK DONE IN THE `validateSentence` CALL.
  // A sentence can be exported if and only if it only refers to exported variables
  // and bound variables.
  const canExportSentence = (sentence: Sentence | SentenceScheme): boolean => {
    const dfs = (a: Sentence): boolean => {
      if (a.type === "forall" || a.type === "exists" || a.type === "not")
        return dfs(a.content);
      if (a.type === "and" || a.type === "or" || a.type === "imply")
        return dfs(a.a) && dfs(a.b);

      const isAcceptable = (x: Variable) =>
        x.type === "bound" ||
        x.type === "witness of exported existential" ||
        // Because canExportSentence is called by canExportDefinition, this variable type
        // is also acceptable.
        x.type === "definition parameter";

      if (a.type === "use definition") {
        const definition = retrieveDefinition(a.definitionIndex);
        if (definition === "failed") return false;
        if (!definition.exported) return false;
        return a.arguments.every(isAcceptable);
      }

      if (a.type === "use definition in sentence scheme")
        return a.arguments.every(isAcceptable);

      return isAcceptable(a.a) && isAcceptable(a.b);
    };

    if (sentence.type === "sentence scheme") return dfs(sentence.content);
    return dfs(sentence);
  };

  const canExportDefinition = (definition: Definition): boolean => {
    if (definition.sentence.type == "opaque") {
      // Opaque definitions are only present in a subgoal. If this branch is hit,
      // this indicates a bug in the program.
      throw new Error("This shouldn't happen.");
    }
    return canExportSentence(definition.sentence);
  };

  const identical = (a: Sentence, b: Sentence): boolean =>
    serializeSentence(a) === serializeSentence(b);

  // The parameterCounts parameter is the parameterCounts field in a SentenceScheme.
  // Callers of this function:
  // 1. validateSentenceOrScheme(sentence) passes an empty array to the
  //    parameterCounts parameter if `sentence` is of type Sentence, and
  //    `sentence.parameterCounts` if `sentence` is of type SentenceScheme. This
  //    caller always passes 0 to the definitionParameterCount parameter.
  // 2. define() always passes an empty array to the parameterCounts parameter.
  //    It passes an appropriate definitionParameterCount value depending on
  //    how many parameters the definition takes.

  const validateSentence = (
    a: Sentence,
    parameterCounts: bigint[],
    definitionParameterCount: bigint
  ): boolean => {
    const { freeVariableCount } = getCurrentContext();

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

      // This function only modifies the isValid variable in the outer scope
      // and doesn't return anything.
      const validateVariable = (x: Variable) => {
        if (x.type === "bound") {
          if (x.index >= binderCount || x.index < 0n) isValid = false;
          return;
        }
        if (x.type === "free") {
          if (x.index >= freeVariableCount || x.index < 0n) isValid = false;
          return;
        }
        if (x.type === "witness of exported existential") {
          const sentence = retrieve(x.sentenceIndex);
          if (sentence === "failed") {
            isValid = false;
            return;
          }
          if (!sentence.exported) {
            isValid = false;
            return;
          }
          if (sentence.sentence.type !== "exists") {
            isValid = false;
            return;
          }
          return;
        }
        if (x.type === "definition parameter") {
          if (x.index >= definitionParameterCount || x.index < 0n)
            isValid = false;
          return;
        }

        checkForExhaustiveness(x.type);
      };

      if (a.type === "member" || a.type === "equal") {
        validateVariable(a.a);
        validateVariable(a.b);

        return;
      }

      if (a.type === "use definition") {
        const definition = retrieveDefinition(a.definitionIndex);
        if (definition === "failed") {
          isValid = false;
          return;
        }

        if (BigInt(a.arguments.length) !== definition.parameterCount) {
          isValid = false;
          return;
        }

        return;
      }

      if (a.type === "use definition in sentence scheme") {
        if (a.definitionIndex < 0n) {
          isValid = false;
          return;
        }

        const definitionCount = BigInt(parameterCounts.length);
        if (a.definitionIndex >= definitionCount) {
          isValid = false;
          return;
        }

        const parameterCount = parameterCounts[Number(a.definitionIndex)];
        if (BigInt(a.arguments.length) !== parameterCount) {
          isValid = false;
          return;
        }

        return;
      }

      checkForExhaustiveness(a);
    };

    dfs(a, 0n);

    return isValid;
  };

  const validateSentenceOrScheme = (sentence: Sentence | SentenceScheme) => {
    if (sentence.type === "sentence scheme")
      return validateSentence(sentence.content, sentence.parameterCounts, 0n);
    return validateSentence(sentence, [], 0n);
  };

  const substituteIntoBinder = (a: Sentence, b: Variable): Sentence => {
    if (a.type !== "forall" && a.type !== "exists")
      throw new Error("This shouldn't happen.");

    const dfs = (a: Sentence, depth: bigint = 0n): Sentence => {
      const replace = (a: Variable): Variable => {
        if (a.type !== "bound") return a;
        if (a.index === depth) return b;
        return { index: a.index, type: "bound" };
      };

      if (a.type === "member" || a.type === "equal") {
        return { type: "member", a: replace(a.a), b: replace(a.b) };
      }

      if (a.type === "forall" || a.type === "exists")
        return { type: a.type, content: dfs(a.content, depth + 1n) };

      if (a.type === "not")
        return { type: a.type, content: dfs(a.content, depth) };

      if (a.type === "and" || a.type === "or" || a.type === "imply")
        return { type: a.type, a: dfs(a.a, depth), b: dfs(a.b, depth) };

      if (
        a.type === "use definition" ||
        a.type === "use definition in sentence scheme"
      )
        return { ...a, arguments: a.arguments.map(replace) };

      return checkForExhaustiveness(a);
    };

    return dfs(a.content);
  };

  const isFreeInContext = (variable: Variable): boolean => {
    const { freeVariableCount } = getCurrentContext();

    if (variable.type !== "free") return false;
    if (variable.index < 0n || variable.index >= freeVariableCount)
      return false;
    return true;
  };

  const isExportedInContext = (variable: Variable): boolean => {
    if (variable.type !== "witness of exported existential") return false;
    if (variable.sentenceIndex < 0n) return false;
    const sentence = retrieve(variable.sentenceIndex);
    if (sentence === "failed") return false;
    if (!sentence.exported) return false;
    if (sentence.sentence.type !== "exists") return false;
    return true;
  };

  const isValidUnboundVariable = (variable: Variable): boolean =>
    isFreeInContext(variable) || isExportedInContext(variable);

  return {
    resolveGoal: (sentenceIndex: SentenceIndex): SentenceIndex | Failed => {
      const { goal } = getCurrentContext();
      if (goal === undefined)
        // There is nothing to prove.
        return "failed";

      const candidate = retrieve(sentenceIndex);

      if (candidate === "failed") return "failed";
      if (candidate.sentence.type === "sentence scheme") return "failed";

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
      const { sentences } = getCurrentContext();
      if (!validateSentenceOrScheme(sentence)) return "failed";

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
      const { freeVariableCount } = getCurrentContext();
      if (!validateSentenceOrScheme(sentence)) return "failed";
      if (sentence.type !== "forall") return "failed";

      contexts.push({
        ...getCurrentContext(),
        goal: {
          onExit: sentence,
          inContext: substituteIntoBinder(sentence, {
            type: "free",
            index: freeVariableCount,
          }),
        },
        freeVariableCount: freeVariableCount + 1n,
      });

      return "successful";
    },
    substituteIntoForall: (
      sentenceIndex: SentenceIndex,
      variable: Variable
    ): SentenceIndex | Failed => {
      const { sentences } = getCurrentContext();
      const sentence = retrieve(sentenceIndex);
      if (sentence === "failed") return "failed";
      if (sentence.sentence.type !== "forall") return "failed";
      if (!isValidUnboundVariable(variable)) return "failed";

      getCurrentContext().sentences = sentences.push({
        exported: false,
        sentence: substituteIntoBinder(sentence.sentence, variable),
      });

      return BigInt(sentences.size);
    },
    exists: (sentence: Sentence, variable: Variable): Successful | Failed => {
      if (!validateSentenceOrScheme(sentence)) return "failed";
      if (sentence.type !== "exists") return "failed";

      if (!isValidUnboundVariable(variable)) return "failed";

      contexts.push({
        ...getCurrentContext(),
        goal: {
          onExit: sentence,
          inContext: substituteIntoBinder(sentence, variable),
        },
      });

      return "successful";
    },
    getWitness: (
      sentenceIndex: SentenceIndex
    ):
      | { witnessIndex: WitnessIndex; sentenceIndex: SentenceIndex }
      | Failed => {
      const { sentences, freeVariableCount } = getCurrentContext();
      const sentence = retrieve(sentenceIndex);
      if (sentence === "failed") return "failed";
      if (sentence.sentence.type !== "exists") return "failed";

      getCurrentContext().sentences = sentences.push({
        sentence: substituteIntoBinder(
          sentence.sentence,
          free(freeVariableCount)
        ),
        exported: false,
      });
      getCurrentContext().freeVariableCount += 1n;

      return {
        witnessIndex: freeVariableCount,
        sentenceIndex: BigInt(sentences.size),
      };
    },
    exportSentence: (sentenceIndex: SentenceIndex): Successful | Failed => {
      // It makes no sense to export sentences that are only present in a subgoal.
      if (contexts.length !== 1) return "failed";

      const { sentences } = getCurrentContext();
      const sentence = retrieve(sentenceIndex);
      if (sentence === "failed") return "failed";
      if (!canExportSentence(sentence.sentence)) return "failed";
      if (exportedSentences.isPresent(sentence.sentence)) return "failed";

      // It is safe to cast sentenceIndex to number here because sentenceIndex is
      // already validated in the `retrieve` call.
      getCurrentContext().sentences = sentences.set(Number(sentenceIndex), {
        ...sentence,
        exported: true,
      });

      exportedSentences.add(sentence.sentence);

      return "successful";
    },
    getExportedWitness: (
      sentenceIndex: SentenceIndex
    ): SentenceIndex | Failed => {
      // It makes no sense to export witnesses that are only present in a subgoal.
      if (contexts.length !== 1) return "failed";

      const { sentences } = getCurrentContext();
      const sentence = retrieve(sentenceIndex);
      if (sentence === "failed") return "failed";
      if (!sentence.exported) return "failed";
      if (sentence.sentence.type !== "exists") return "failed";

      const hypothesis = substituteIntoBinder(
        sentence.sentence,
        exported(sentenceIndex)
      );

      getCurrentContext().sentences = sentences.push({
        exported: false,
        sentence: hypothesis,
      });

      return BigInt(sentences.size);
    },
    leftSideOfAnd: (sentenceIndex: SentenceIndex): SentenceIndex | Failed => {
      const { sentences } = getCurrentContext();
      const sentence = retrieve(sentenceIndex);
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
      const sentence = retrieve(sentenceIndex);
      if (sentence === "failed") return "failed";
      if (sentence.sentence.type !== "and") return "failed";

      getCurrentContext().sentences = sentences.push({
        sentence: sentence.sentence.b,
        exported: false,
      });

      return BigInt(sentences.size);
    },
    imply: (a: Sentence, b: Sentence): SentenceIndex | Failed => {
      const { sentences, freeVariableCount } = getCurrentContext();
      if (!validateSentenceOrScheme(a)) return "failed";
      if (!validateSentenceOrScheme(b)) return "failed";

      contexts.push({
        ...getCurrentContext(),
        freeVariableCount,
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
      const x = retrieve(a);
      const y = retrieve(b);
      if (x === "failed" || y === "failed") return "failed";

      if (y.sentence.type !== "imply") return "failed";
      if (x.sentence.type === "sentence scheme") return "failed";
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
      const x = retrieve(a);
      const y = retrieve(b);
      if (x === "failed" || y === "failed") return "failed";
      if (
        x.sentence.type === "sentence scheme" ||
        y.sentence.type === "sentence scheme"
      )
        return "failed";

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
      const { sentences } = getCurrentContext();
      if (!validateSentenceOrScheme(b)) return "failed";

      const x = retrieve(a);
      if (x === "failed") return "failed";
      if (x.sentence.type === "sentence scheme") return "failed";

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
      const { sentences } = getCurrentContext();
      if (!validateSentenceOrScheme(a)) return "failed";

      const y = retrieve(b);
      if (y === "failed") return "failed";
      if (y.sentence.type === "sentence scheme") return "failed";

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
      const { sentences } = getCurrentContext();
      if (!validateSentenceOrScheme(a)) return "failed";
      if (!validateSentenceOrScheme(b)) return "failed";
      if (!validateSentenceOrScheme(c)) return "failed";

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

      const x = retrieve(a);
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

      const x = retrieve(a);
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
      const { sentences } = getCurrentContext();

      const x = retrieve(a);
      const y = retrieve(b);

      if (x === "failed" || y === "failed") return "failed";
      if (y.sentence.type !== "not") return "failed";
      if (x.sentence.type === "sentence scheme") return "failed";

      if (!identical(x.sentence, y.sentence.content)) return "failed";

      if (!validateSentenceOrScheme(c)) return "failed";

      getCurrentContext().sentences = sentences.push({
        sentence: c,
        exported: false,
      });

      return BigInt(sentences.size);
    },
    // Given a hypothesis that states A = B, this rule replaces all occurrences of
    // A with B in `sentence`. If `reverseDirection = true` is supplied, this
    // function replaces B with A instead.
    rewrite: (
      equalHypothesisIndex: SentenceIndex,
      sentenceIndex: SentenceIndex,
      reverseDirection = false
    ): SentenceIndex | Failed => {
      const { sentences } = getCurrentContext();

      const equalHypothesis = retrieve(equalHypothesisIndex);
      if (equalHypothesis === "failed") return "failed";
      const sentence = retrieve(sentenceIndex);
      if (sentence === "failed") return "failed";

      if (equalHypothesis.sentence.type !== "equal") return "failed";
      if (sentence.sentence.type === "sentence scheme") return "failed";

      // These are sanity checks to catch bugs in other parts of the program.
      // These are invariants that are kept throughout the course of the program.
      if (
        equalHypothesis.sentence.a.type !== "free" &&
        equalHypothesis.sentence.a.type !== "witness of exported existential"
      )
        throw new Error("This shouldn't happen");
      if (
        equalHypothesis.sentence.b.type !== "free" &&
        equalHypothesis.sentence.b.type !== "witness of exported existential"
      )
        throw new Error("This shouldn't happen");

      const [variable1, variable2] = (() => {
        if (!reverseDirection)
          return [equalHypothesis.sentence.a, equalHypothesis.sentence.b];
        return [equalHypothesis.sentence.b, equalHypothesis.sentence.a];
      })();

      const dfs = (sentence: Sentence): Sentence => {
        if (
          sentence.type === "and" ||
          sentence.type === "or" ||
          sentence.type === "imply"
        )
          return { ...sentence, a: dfs(sentence.a), b: dfs(sentence.b) };

        if (
          sentence.type === "not" ||
          sentence.type === "forall" ||
          sentence.type === "exists"
        )
          return { ...sentence, content: dfs(sentence.content) };

        const replace = (a: Variable): Variable => {
          if (a.type === "free" && variable1.type === "free")
            if (a.index === variable1.index) return variable2;

          if (
            a.type === "witness of exported existential" &&
            variable1.type === "witness of exported existential"
          )
            if (a.sentenceIndex === variable1.sentenceIndex) return variable2;
          return a;
        };

        if (
          sentence.type === "use definition" ||
          sentence.type === "use definition in sentence scheme"
        )
          return { ...sentence, arguments: sentence.arguments.map(replace) };

        return { ...sentence, a: replace(sentence.a), b: replace(sentence.b) };
      };

      const newHypothesis = dfs(sentence.sentence);

      getCurrentContext().sentences = sentences.push({
        exported: false,
        sentence: newHypothesis,
      });

      return BigInt(sentences.size);
    },
    define: (
      parameterCount: bigint,
      sentence: Sentence
    ): DefinitionIndex | Failed => {
      if (!validateSentence(sentence, [], parameterCount)) return "failed";

      const { definitions } = getCurrentContext();

      getCurrentContext().definitions = definitions.push({
        parameterCount,
        sentence,
        exported: false,
      });

      return BigInt(definitions.size);
    },
    exportDefinition: (definitionIndex: bigint): Successful | Failed => {
      const { definitions } = getCurrentContext();

      // It makes no sense to export definitions that are only present in a subgoal.
      if (definitions.size !== 1) return "failed";
      const definition = retrieveDefinition(definitionIndex);
      if (definition === "failed") return "failed";
      if (!canExportDefinition(definition)) return "failed";
      if (exportedDefinitions.isPresent(definition)) return "failed";

      // It is safe to cast definitionIndex to number here because definitionIndex is
      // already validated in the `retrieveDefinition` call.
      getCurrentContext().definitions = definitions.set(
        Number(definitionIndex),
        { ...definition, exported: true }
      );

      exportedDefinitions.add(definition);

      return "successful";
    },
    // Produces a sentence that can be used to fold or unfold a definition.
    foldOrUnfoldDefinition: (
      definitionIndex: bigint,
      foldOrUnfold: "fold" | "unfold"
    ): SentenceIndex | Failed => {
      const definition = retrieveDefinition(definitionIndex);
      if (definition === "failed") return "failed";
      if (definition.sentence.type === "opaque") return "failed";

      const { sentence, parameterCount } = definition;
      const { sentences } = getCurrentContext();

      const change = (x: Variable) => {
        if (x.type !== "definition parameter") return x;
        return bound(parameterCount - 1n - x.index);
      };

      const dfs = (a: Sentence): Sentence => {
        if (a.type === "and" || a.type === "or" || a.type === "imply")
          return { ...a, a: dfs(a.a), b: a.b };
        if (a.type === "forall" || a.type === "exists" || a.type === "not")
          return { ...a, content: dfs(a.content) };
        if (a.type === "member" || a.type === "equal")
          return { ...a, a: change(a.a), b: change(a.b) };
        if (
          a.type === "use definition" ||
          a.type === "use definition in sentence scheme"
        )
          return { ...a, arguments: a.arguments.map(change) };
        return checkForExhaustiveness(a);
      };

      const wrap = (a: Sentence): Sentence => {
        let result = a;
        for (let i = 0n; i < parameterCount; i++) result = forall(result);
        return result;
      };

      if (!isNonnegativeInteger(parameterCount)) return "failed";

      if (foldOrUnfold === "fold") {
        const toInsert = wrap(
          imply(
            {
              type: "use definition",
              definitionIndex,
              arguments: Array(parameterCount)
                .fill(0n)
                .map((_, index) => bound(BigInt(index))),
            },
            dfs(sentence)
          )
        );

        getCurrentContext().sentences = sentences.push({
          sentence: toInsert,
          exported: false,
        });
        return BigInt(sentences.size);
      }

      if (foldOrUnfold === "unfold") {
        const toInsert = wrap(
          imply(dfs(sentence), {
            type: "use definition",
            definitionIndex,
            arguments: Array(parameterCount)
              .fill(0n)
              .map((_, index) => bound(BigInt(index))),
          })
        );

        getCurrentContext().sentences = sentences.push({
          sentence: toInsert,
          exported: false,
        });
        return BigInt(sentences.size);
      }

      return checkForExhaustiveness(foldOrUnfold);
    },
    applySentenceScheme: (
      sentenceIndex: SentenceIndex,
      definitions: DefinitionIndex[]
    ): SentenceIndex | Failed => {
      const sentence = retrieve(sentenceIndex);
      if (sentence === "failed") return "failed";
      if (sentence.sentence.type !== "sentence scheme") return "failed";

      if (definitions.length !== sentence.sentence.parameterCounts.length)
        return "failed";

      for (const [index, definitionIndex] of definitions.entries()) {
        const definition = retrieveDefinition(definitionIndex);
        if (definition === "failed") return "failed";
        if (
          definition.parameterCount !== sentence.sentence.parameterCounts[index]
        )
          return "failed";
      }

      const dfs = (a: Sentence): Sentence => {
        if (a.type === "and" || a.type === "or" || a.type === "imply")
          return { ...a, a: dfs(a.a), b: dfs(a.b) };
        if (a.type === "forall" || a.type === "exists" || a.type === "not")
          return { ...a, content: dfs(a.content) };
        if (
          a.type === "member" ||
          a.type === "equal" ||
          a.type === "use definition"
        )
          return a;
        if (a.type == "use definition in sentence scheme") {
          return {
            type: "use definition",
            arguments: a.arguments,
            // Already bounds checked by validateSentenceOrScheme.
            definitionIndex: definitions[Number(a.definitionIndex)],
          };
        }
        return checkForExhaustiveness(a);
      };

      const { sentences } = getCurrentContext();

      const toInsert = dfs(sentence.sentence.content);
      getCurrentContext().sentences = sentences.push({
        sentence: toInsert,
        exported: false,
      });

      return BigInt(sentences.size);
    },
    // This function is primarily for debugging.
    getState: () => {
      console.log(
        contexts.map((x) => ({
          ...x,
          definitions: x.definitions
            .map(
              (a) => (a.exported ? "[EXPORTED] " : "") + serializeDefinition(a)
            )
            .toJS(),
          sentences: x.sentences
            .map(
              (a) =>
                (a.exported ? "[EXPORTED] " : "") +
                serializeSentenceOrScheme(a.sentence)
            )
            .toJS(),
          goal:
            x.goal === undefined
              ? undefined
              : {
                  inContext: serializeSentence(x.goal.inContext),
                  onExit: serializeSentenceOrScheme(x.goal.onExit),
                },
        }))
      );
    },
  };
}
