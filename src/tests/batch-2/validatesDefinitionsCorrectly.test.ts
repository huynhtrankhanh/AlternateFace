import {
  bound,
  forall,
  member,
  parameter,
  and,
  Sentence,
  startInteractiveSession,
  not,
} from "../../theoremProver";

test("validates definitions correctly", () => {
  const validate = (parameterCount: bigint, sentence: Sentence) => {
    const session = startInteractiveSession();
    return session.define(parameterCount, sentence) !== "failed";
  };

  expect(validate(0n, member(bound(0n), bound(1n)))).toBe(false);
  expect(validate(0n, forall(member(bound(0n), bound(1n))))).toBe(false);
  expect(validate(0n, forall(forall(member(bound(0n), bound(1n)))))).toBe(true);
  expect(validate(1n, forall(not(member(parameter(0n), bound(0n)))))).toBe(
    true
  );
  expect(
    validate(
      2n,
      and(
        forall(member(parameter(0n), parameter(1n))),
        not(member(parameter(1n), parameter(1n)))
      )
    )
  ).toBe(true);
  expect(
    validate(-12394812348n, not(not(not(forall(member(bound(0n), bound(0n)))))))
  ).toBe(false);
  expect(
    validate(
      1n,
      not(not(not(forall(member(bound(0n), parameter(-23784238n))))))
    )
  ).toBe(false);
  expect(
    validate(1n, not(not(not(forall(member(bound(0n), parameter(2n)))))))
  ).toBe(false);
  expect(
    validate(
      1n,
      not(not(not(forall(member(bound(0n), parameter(237894378294n))))))
    )
  ).toBe(false);
});
