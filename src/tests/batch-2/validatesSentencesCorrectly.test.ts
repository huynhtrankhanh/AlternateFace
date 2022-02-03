import { startInteractiveSession } from "../../theoremProver";
import tests, { TestCase } from "./sentenceSamplesForValidation";

// Throws an error if test fails.
const runTest = (test: TestCase, index: number): void => {
  // This test will be checked by runTest2.
  if (test[1].type === "sentence scheme") return;

  const session = startInteractiveSession();
  session.contexts.length = 0;
  session.contexts.push(test[0]);

  if (session.validateSentence(test[1], [], 0n) !== test[2]) {
    session.getState();
    throw new Error("This shouldn't happen. Test " + index);
  }
};

const runTest2 = (test: TestCase, index: number): void => {
  const session = startInteractiveSession();
  session.contexts.length = 0;
  session.contexts.push(test[0]);

  if (session.validateSentenceOrScheme(test[1]) !== test[2]) {
    session.getState();
    throw new Error("This shouldn't happen. Test " + index);
  }
};

test("validates sentences correctly", () => {
  tests.forEach(runTest);
  tests.forEach(runTest2);
});
