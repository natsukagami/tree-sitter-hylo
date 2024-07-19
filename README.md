# Stuff not yet in Spec

- [ ] `?` implicit modifier
- [ ] `#pragma` in primary expr
- [ ] Lambda environment can be empty

- [ ] What are `remote` types?

- `type_argument_list` is not defined (used in `type_expr`). We give it something similar to `generics_clause`.
- `deinit` not really used anywhere, perhaps replaced by `Deinitializable` trait. We highlight both.

- `async`/`await` seems deprecated, it is commented out in the grammar.

## Precedences that ~seems ok

- Selection on types doesn't work on "floating" types (e.g. `some blalala`).
- Where clauses are right-associative.
- Expressions are left-associative (this might bite me in the butt).
