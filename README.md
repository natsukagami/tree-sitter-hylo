# tree-sitter-hylo

[tree-sitter](https://tree-sitter.github.io) parser and highlighting definitions for the [Hylo programming language](https://www.hylo-lang.org/).
Written as part of my attempt to learn how tree-sitter works, so it's kind of a mess, but it parses the entire Hylo standard library.
No externals needed!

What should not be trusted at the moment:
- Operator precedence is totally borked, Hylo supports custom operators with custom precedence.
- `yield` and `return` expressions *will* accept newlines between the keyword and the expr, but this is **not** allowed by the spec.

Generally it's quite hacky in a few places so you can expect the parser to be wrong here and there, please open an issue with a small minimization!

## Stuff not yet in Spec

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

## License

Apache 2.0, following Hylo itself.
