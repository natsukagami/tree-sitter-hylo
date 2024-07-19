# Stuff not yet in Spec

- [ ] `?` implicit modifier
- [ ] `#pragma` in primary expr
- [ ] Lambda environment can be empty

- [ ] What are `remote` types?

- `type_argument_list` is not defined (used in `type_expr`). We give it something similar to `generics_clause`.

## Precedences that ~seems ok

- Selection on types doesn't work on "floating" types (e.g. `some blalala`).
- Where clauses are right-associative.
- Expressions are left-associative (this might bite me in the butt).
