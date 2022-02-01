import { startInteractiveSession, member, bound } from "../theoremProver";

test("rejects invalid sentences", () => {
  const session = startInteractiveSession();
  expect(
    session.imply(member(bound(0n), bound(1n)), member(bound(1n), bound(0n)))
  ).toBe("failed");
});
