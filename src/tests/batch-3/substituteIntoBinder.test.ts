import {
  substituteIntoBinder,
  forall,
  exists,
  member,
  equal,
  not,
  and,
  or,
  imply,
  bound,
  free,
  definition,
  definitionInScheme,
} from "../../theoremProver";

test("substituteIntoBinder works correctly", () => {
  expect(() =>
    substituteIntoBinder(member(free(1n), free(3n)), free(3n))
  ).toThrow();
  expect(() =>
    substituteIntoBinder(equal(free(1n), free(3n)), free(3n))
  ).toThrow();
  expect(() =>
    substituteIntoBinder(not(equal(free(1n), free(3n))), free(3n))
  ).toThrow();
  expect(
    substituteIntoBinder(forall(equal(bound(0n), bound(0n))), free(1n))
  ).toEqual(equal(free(1n), free(1n)));
  expect(() =>
    substituteIntoBinder(not(forall(member(free(1n), bound(0n)))), free(1n))
  ).toThrow();
  expect(
    substituteIntoBinder(
      exists(
        and(
          forall(forall(member(bound(0n), bound(2n)))),
          member(free(1n), bound(0n))
        )
      ),
      free(3n)
    )
  ).toEqual(
    and(forall(forall(member(bound(0n), free(3n)))), member(free(1n), free(3n)))
  );
  expect(
    substituteIntoBinder(
      exists(
        or(
          forall(forall(member(bound(0n), bound(2n)))),
          member(free(1n), bound(0n))
        )
      ),
      free(3n)
    )
  ).toEqual(
    or(forall(forall(member(bound(0n), free(3n)))), member(free(1n), free(3n)))
  );
  expect(
    substituteIntoBinder(
      exists(
        imply(
          forall(forall(member(bound(0n), bound(2n)))),
          member(free(1n), bound(0n))
        )
      ),
      free(3n)
    )
  ).toEqual(
    imply(
      forall(forall(member(bound(0n), free(3n)))),
      member(free(1n), free(3n))
    )
  );
  expect(
    substituteIntoBinder(
      forall(
        and(
          forall(forall(member(bound(0n), bound(2n)))),
          member(free(1n), bound(0n))
        )
      ),
      free(3n)
    )
  ).toEqual(
    and(forall(forall(member(bound(0n), free(3n)))), member(free(1n), free(3n)))
  );
  expect(
    substituteIntoBinder(
      forall(
        or(
          forall(forall(member(bound(0n), bound(2n)))),
          member(free(1n), bound(0n))
        )
      ),
      free(3n)
    )
  ).toEqual(
    or(forall(forall(member(bound(0n), free(3n)))), member(free(1n), free(3n)))
  );
  expect(
    substituteIntoBinder(
      forall(
        imply(
          forall(forall(member(bound(0n), bound(2n)))),
          member(free(1n), bound(0n))
        )
      ),
      free(3n)
    )
  ).toEqual(
    imply(
      forall(forall(member(bound(0n), free(3n)))),
      member(free(1n), free(3n))
    )
  );
  expect(
    substituteIntoBinder(
      forall(
        or(
          not(not(not(not(forall(forall(member(bound(0n), bound(2n)))))))),
          member(free(1n), bound(0n))
        )
      ),
      free(3n)
    )
  ).toEqual(
    or(
      not(not(not(not(forall(forall(member(bound(0n), free(3n)))))))),
      member(free(1n), free(3n))
    )
  );
  expect(
    substituteIntoBinder(
      forall(
        or(
          not(not(not(not(exists(forall(member(bound(0n), bound(2n)))))))),
          member(free(1n), bound(0n))
        )
      ),
      free(3n)
    )
  ).toEqual(
    or(
      not(not(not(not(exists(forall(member(bound(0n), free(3n)))))))),
      member(free(1n), free(3n))
    )
  );
  expect(
    substituteIntoBinder(
      forall(
        and(
          forall(forall(definition(29n, [bound(0n), bound(2n)]))),
          member(free(1n), bound(0n))
        )
      ),
      free(3n)
    )
  ).toEqual(
    and(
      forall(forall(definition(29n, [bound(0n), free(3n)]))),
      member(free(1n), free(3n))
    )
  );
  expect(
    substituteIntoBinder(
      forall(
        or(
          not(not(not(not(forall(forall(member(bound(0n), bound(2n)))))))),
          definition(2384n, [])
        )
      ),
      free(3n)
    )
  ).toEqual(
    or(
      not(not(not(not(forall(forall(member(bound(0n), free(3n)))))))),
      definition(2384n, [])
    )
  );
  expect(
    substituteIntoBinder(
      forall(
        or(
          not(
            not(
              not(
                not(
                  forall(
                    forall(
                      definition(12394n, [bound(0n), bound(2n), free(1010n)])
                    )
                  )
                )
              )
            )
          ),
          member(free(1n), bound(0n))
        )
      ),
      free(3n)
    )
  ).toEqual(
    or(
      not(
        not(
          not(
            not(
              forall(
                forall(definition(12394n, [bound(0n), free(3n), free(1010n)]))
              )
            )
          )
        )
      ),
      member(free(1n), free(3n))
    )
  );
  expect(
    substituteIntoBinder(
      forall(
        or(
          not(
            not(
              not(
                not(
                  forall(
                    forall(
                      definitionInScheme(12394n, [
                        bound(0n),
                        bound(2n),
                        free(1010n),
                      ])
                    )
                  )
                )
              )
            )
          ),
          member(free(1n), bound(0n))
        )
      ),
      free(3n)
    )
  ).toEqual(
    or(
      not(
        not(
          not(
            not(
              forall(
                forall(
                  definitionInScheme(12394n, [bound(0n), free(3n), free(1010n)])
                )
              )
            )
          )
        )
      ),
      member(free(1n), free(3n))
    )
  );
});
