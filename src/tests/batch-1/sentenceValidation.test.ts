import {
  startInteractiveSession,
  member,
  bound,
  free,
  exists,
  forall,
  parameter,
  and,
  definition,
  not,
  or,
} from "../../theoremProver";

test("rejects invalid sentences", () => {
  const session = startInteractiveSession();
  expect(
    session.imply(member(bound(0n), bound(1n)), member(bound(1n), bound(0n)))
  ).toBe("failed");
});

test("rejects invalid sentences", () => {
  const session = startInteractiveSession();
  expect(session.forall(member(free(0n), free(0n)))).toBe("failed");
});

test("accepts valid sentences", () => {
  const session = startInteractiveSession();
  expect(
    session.excludedMiddle(exists(forall(member(bound(1n), bound(0n))))) !==
      "failed"
  ).toBe(true);
});

test("rejects invalid sentences", () => {
  const session = startInteractiveSession();
  expect(
    session.excludedMiddle(exists(forall(member(bound(1n), bound(3n)))))
  ).toBe("failed");
});

test("accepts valid sentences", () => {
  const session = startInteractiveSession();
  const handle = session.define(
    3n,
    and(
      and(
        member(parameter(0n), parameter(1n)),
        member(parameter(1n), parameter(2n))
      ),
      member(parameter(2n), parameter(0n))
    )
  );
  if (handle === "failed") throw new Error("failed");
  expect(
    session.proveSentenceScheme({
      type: "sentence scheme",
      parameterCounts: [],
      content: forall(
        forall(forall(definition(handle, [bound(0n), bound(1n), bound(2n)])))
      ),
    })
  ).toBe("successful");
});

test("rejects invalid sentences", () => {
  const session = startInteractiveSession();
  const handle = session.define(
    3n,
    and(
      and(
        member(parameter(0n), parameter(1n)),
        member(parameter(1n), parameter(2n))
      ),
      member(parameter(2n), parameter(0n))
    )
  );
  if (handle === "failed") throw new Error("failed");
  expect(
    session.proveSentenceScheme({
      type: "sentence scheme",
      parameterCounts: [],
      content: forall(forall(forall(definition(handle, [bound(0n)])))),
    })
  ).toBe("failed");
});

test("rejects invalid sentences", () => {
  const session = startInteractiveSession();
  const handle = session.define(
    3n,
    and(
      and(
        member(parameter(0n), parameter(1n)),
        member(parameter(1n), parameter(2n))
      ),
      member(parameter(2n), parameter(0n))
    )
  );
  if (handle === "failed") throw new Error("failed");
  expect(
    session.proveSentenceScheme({
      type: "sentence scheme",
      parameterCounts: [],
      content: forall(
        forall(
          forall(
            forall(
              definition(handle, [bound(0n), bound(1n), bound(2n), bound(3n)])
            )
          )
        )
      ),
    })
  ).toBe("failed");
});

test("rejects invalid sentences", () => {
  const session = startInteractiveSession();
  expect(
    session.define(
      0n,
      forall(
        forall(
          and(
            member(bound(0n), bound(1n)),
            member(parameter(0n), parameter(0n))
          )
        )
      )
    )
  ).toBe("failed");
});

test("accepts valid sentences", () => {
  const session = startInteractiveSession();
  expect(
    session.excludedMiddle(
      or(
        exists(member(bound(0n), bound(0n))),
        forall(forall(not(member(bound(1n), bound(1n)))))
      )
    ) !== "failed"
  ).toBe(true);
});

test("rejects invalid sentences", () => {
  const session = startInteractiveSession();
  expect(session.excludedMiddle(member(free(-1n), free(-1n)))).toBe("failed");
});
