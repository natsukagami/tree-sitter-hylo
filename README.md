# Stuff not yet in Spec

- [ ] `?` implicit modifier
- [ ] `#pragma` in primary expr
- [ ] Lambda environment can be empty
- [ ] Array types (`Int[]` and `Int[2]`)

The following exists in stdlib:
- `exponentiation` as a precedence group
- `.` in operators (parser currently allows infix operators with `\.\.+` prefixes)
- `internal` access modifier
- `as*` pointer conversion
- `parameter_passing_convention` has `yielded` instead of `yield`
- what are `remote` types? (`remote let T`)

- `type_argument_list` is not defined (used in `type_expr`). We give it something similar to `generics_clause`.
- `deinit` not really used anywhere, perhaps replaced by `Deinitializable` trait. We highlight both.
- `set` is a parameter passing convention not in the Spec.
- `let` is a receiver effect not in the Spec.

- `async`/`await` seems deprecated, it is commented out in the grammar.

- `expr_pattern` is very weird, allow only `identifier` for now.

## Precedences that ~seems ok

- Selection on types doesn't work on "floating" types (e.g. `some blalala`).
- Where clauses are right-associative.
- Expressions are left-associative (this might bite me in the butt).

## Paths and expressions

`value_member_expr` and `static_value_member_expr` and `name_type_expr` are highly confusing for the parser,
so `value_member_expr` combines the first two and parses ambiguous paths as value paths.
