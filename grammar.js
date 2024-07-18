// Token: String
const unicode_escape = /\\u[0-9a-fA-F_]+/;
const simple_escape = choice(`\0`, `\t`, `\n`, `\r`, `\'`, `\"`);
const escape_char = choice(simple_escape, unicode_escape);
const single_quoted_text_item = choice(escape_char, /[^"\x0a\x0d]/);
const single_line_string = seq('"', repeat(token.immediate(single_quoted_text_item)), token.immediate('"'));

module.exports = grammar({
  name: 'hylo',
  rules: {
    source_file: $ => repeat(choice(
      $._function_decl
      // TODO: more
    )),

    // FUNCTIONS

    // group function_decl and function_memberwise_init
    _function_decl: $ => choice(
      $.function_memberwise_init,
      $.function_decl
    ),

    function_decl: $ => seq(
      field('head', $.function_head),
      field('signature', $.function_signature),
      field('body', $.function_body),
    ),

    function_head: $ => seq(
      optional($.access_modifier),
      // TODO: member-modifier
      $.function_name,
      // TODO: generic-clause
      // TODO: capture-list
    ),

    function_signature: $ => seq(
      '(',
      field('params', optional($._parameter_list)),
      ')',
      // receiver-effect? 
      optional(seq("->", field('returns', $.type_expr))),
      // type-aliases-clause?
    ),

    _parameter_list: $ => seq(
      $.parameter_decl,
      repeat(seq(",", $.parameter_decl)),
    ),

    parameter_decl: $ => seq(
      field('label', choice($.identifier, "_")),
      field('name', $.identifier),
      optional(seq(
        ":",
        field('type', $._parameter_type_expr),
      )),
      optional(seq(
        "=",
        field('default_value', $.expr),
      )),
    ),

    _parameter_type_expr: $ => seq(
      optional(field('convention', $.parameter_passing_convention)),
      $.type_expr,
    ),

    parameter_passing_convention: $ => token(choice("let", "inout", "sink", "yield")),

    function_body: $ => choice(
      // TODO method-bundle
      $.brace_stmt
    ),

    function_name: $ => choice(
      'init',
      seq('fun', $.identifier),
      // TODO: operator case
    ),

    function_memberwise_init: $ => "memberwise init",

    // STATEMENTS

    brace_stmt: $ => seq('{', optional($._stmt_list), '}'),

    _stmt_list: $ => seq(
      $.stmt,
      repeat(seq($._stmt_sep, $.stmt))
      // multiple statements
    ),

    _stmt_sep: $ => seq(
      repeat($._horizontal_space),
      repeat1(seq(
        token.immediate(choice('\n', ';')),
        $._horizontal_space
      ))
    ),

    stmt: $ => choice(
      $.brace_stmt,
      // discard-stmt
      // loop-stmt
      // jump-stmt
      // decl-stmt
      $.expr
    ),

    // EXPRESSIONS

    expr: $ => seq($._infix_expr_head, optional($._infix_expr_tail)),

    _infix_expr_head: $ => choice(
      // async-expr
      // await-expr
      // unsafe-expr
      $._prefix_expr
    ), // TODO

    _infix_expr_tail: $ => choice(), // TODO

    _prefix_expr: $ => seq(optional($.prefix_operator), $._postfix_expr),

    _postfix_expr: $ => seq(
      $._compound_expr, repeat($.postfix_operator)
    ),

    _compound_expr: $ => choice(
      // value-member-expr
      // static-value-member-expr
      $.function_call_expr,
      // subscript-call-expr
      $.primary_expr,
    ),

    function_call_expr: $ => seq(
      field('head', $.primary_expr),
      token.immediate("("),
      field('arguments', optional($._call_argument_list)),
      ")",
    ),

    _call_argument_list: $ => seq(
      $.call_argument,
      repeat(seq(',', $.call_argument)),
    ),

    call_argument: $ => seq(
      optional(seq(
        field('label', $.identifier),
        ":",
      )),
      $.expr,
    ),

    primary_expr: $ => choice(
      $._scalar_literal,
      // compound-literal
      $.primary_decl_ref,
      // implicit-member-ref
      // lambda-expr
      $._selection_expr,
      // inout-expr
      // tuple-expr
      "nil",
    ),

    primary_decl_ref: $ => seq(
      field('identifier', $.identifier_expr),
      // repeat($._static_argument_list)
    ),

    conditional_expr: $ => choice(
    ),

    identifier_expr: $ => seq(
      field('entity', $._entity_identifier),
      // field('impls', repeat($._impl_identifier)),
    ),

    _entity_identifier: $ => choice(
      $.identifier,
      //   function-entity-identifier
      //   operator-entity-identifier
    ),

    _selection_expr: $ => choice(
      $.conditional_expr,
      // match-expr
    ),

    conditional_expr: $ => seq(
      "if",
      field('condition', $._conditional_clause),
      field('then', $.brace_stmt),
      optional(seq(
        "else",
        field('else', choice($.conditional_expr, $.brace_stmt)),
      )),
    ),

    _conditional_clause: $ => seq(
      $.conditional_clause_item,
      repeat(seq(",", $.conditional_clause_item)),
    ),

    conditional_clause_item: $ => choice(
      seq($.binding_pattern, "=", $.expr),
      $.expr,
    ),

    // PATTERNS

    binding_pattern: $ => seq(
      field('introducer', $.binding_introducer),
      field('pattern', choice(
        $.tuple_pattern,
        $.wildcard_pattern,
        $.identifier,
      )),
      optional(seq(":", field('annotation', $.type_expr))),
    ),

    binding_introducer: $ => token(choice("let", "var", "sink", "inout")),

    tuple_pattern: $ => choice(), // TODO: tuple-pattern

    wildcard_pattern: $ => choice(), // TODO: wildcard-pattern

    // OPERATORS,

    prefix_operator: $ => seq($._prefix_operator_head, repeat($._raw_operator)),

    _prefix_operator_head: $ => /(?:[-*\/^%&!?])/u, // TODO \p{Sm} without <

    postfix_operator: $ => seq($._postfix_operator_head, repeat($._raw_operator)),

    _postfix_operator_head: $ => /(?:[-*\/^%&!?])/u, // TODO \p{Sm} without >

    _raw_operator: $ => token.immediate(/[-*\/^%&!?\p{Sm}]/u),

    // TYPES
    type_expr: $ => $._type_expr,

    _type_expr: $ => choice(
      // async-type-expr
      // conformance-lens-type-expr
      // existential-type-expr
      // opaque-type-expr
      // indirect-type-expr
      // lambda-type-expr
      $.name_type_expr,
      // stored-projection-type-expr
      // tuple-type-expr
      // union-type-expr
      // wildcard-type-expr
      seq('(', $._type_expr, ')'),
    ),

    name_type_expr: $ => seq(
      optional(seq(field('prefix', $._type_expr), ".")),
      // inlined: primary-type-def-ref
      field('identifier', $._type_identifier),
      // optional(field('arguments', $._type_argument_list)),
    ),

    _type_identifier: $ => $.identifier,

    // MODIFIERS

    access_modifier: $ => choice('public'),

    // IDENTIFIERS

    identifier: $ => token(choice(
      // normal
      seq(
        /[_\p{Lu}\p{Ll}\p{Lt}\p{Lm}\p{Lo}\p{Nl}]/, // identifier-head
        /[\p{Lu}\p{Ll}\p{Lt}\p{Lm}\p{Lo}\p{Mn}\p{Mc}\p{Nl}\p{Nd}\p{Pc}]*/ // identifier-tail
      ),
      // escaped
      /`[^`\x0a\x0d]+`/
    )),

    // LITERALS

    _scalar_literal: $ => choice(
      // boolean-literal
      $.integer_literal,
      // floating-point-literal
      $.string_literal,
      // unicode-scalar-literal
    ),

    string_literal: $ => choice(
      $._single_line_string,
      // multi line string
    ),

    _single_line_string: $ => token(single_line_string),

    integer_literal: $ => choice($.binary_literal, $.octal_literal, $.decimal_literal, $.hexadecimal_literal),
    binary_literal: $ => /0b[01_]+/,
    octal_literal: $ => /0o[0-7_]+/,
    decimal_literal: $ => /[0-9][0-9_]*/,
    hexadecimal_literal: $ => /0x[0-9a-fA-F_]+/,

    // WHITESPACES
    _whitespace: $ => choice($._horizontal_space, $._newline),
    _horizontal_space: $ => choice(
      $._horizontal_space_token,
      $.single_line_comment,
      $.block_comment,
    ),
    _horizontal_space_token: $ => token.immediate(/[ \t]/),
    _newline: $ => token.immediate("\n"),
    single_line_comment: $ => token.immediate(/\/\/[^\r\n\v]*/),
    block_comment: $ => choice(
      seq($._block_comment_open, "*/"),
      seq($._block_comment_open, $.block_comment, "*/")
    ),
    _block_comment_open: $ => token.immediate(/\/[*](?:[^*\/]+|(?:[\/]+|[*]+)[^*\/])*/),
  },

  extras: $ => [$._horizontal_space_token, $.single_line_comment, $.block_comment, $._newline],

  word: $ => $.identifier,
});
