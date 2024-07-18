/// <reference path="node_modules/tree-sitter-cli/dsl.d.ts" />

// Token: String
const unicode_escape = /\\u[0-9a-fA-F_]+/;
const simple_escape = choice(`\\0`, `\\t`, `\\n`, `\\r`, `\\'`, `\\"`);
const escape_char = choice(simple_escape, unicode_escape);
const single_quoted_text_item = choice(escape_char, /[^"\x0a\x0d]/);
const single_line_string = seq('"', repeat(token.immediate(single_quoted_text_item)), token.immediate('"'));

// Token: Whitespace
const newline = "\n";
const horizontal_space_token = /[ \t]/;
const whitespace = token(choice(horizontal_space_token, newline));

// Token: Operators
const common_operator = /[-+*\/^%&!?=~|]/u; // todo: support \p{Sm}
const raw_operator = token(choice(common_operator, "<", ">"));
const imm_raw_operator = token.immediate(raw_operator);
const prefix_operator_head = token(choice(common_operator, ">"));
const postfix_operator_head = token.immediate(choice(common_operator, "<"));
const operator = token(seq(raw_operator, repeat(imm_raw_operator)));

module.exports = grammar({
  name: 'hylo',
  rules: {
    source_file: $ => optional(repeat1StmtSep($._module_scope_stmt)),

    // MODULE

    _module_scope_stmt: $ => choice(
      $._module_scope_decl,
      $.import_decl,
    ),

    _module_scope_decl: $ => choice(
      // namespace-decl
      // trait-decl
      // type-alias-decl
      $.product_type_decl,
      // extension-decl
      // conformance-decl
      $.binding_decl,
      $._function_decl,
      // subscript-decl
      // operator-decl
    ),

    import_decl: $ => seq(
      "import",
      $.identifier,
    ),

    // PRODUCT TYPE

    product_type_decl: $ => seq(
      $.product_type_head,
      "{",
      repeat(choice($._product_type_member_decl, ";")),
      "}",
    ),

    product_type_head: $ => seq(
      optional($.access_modifier),
      "type",
      field('name', $.identifier),
      // generic-clause?
      // conformance-list?
    ),

    _product_type_member_decl: $ => choice(
      $._function_decl,
      // deinit-decl
      // subscript-decl
      // property-decl
      $.binding_decl,
      $.product_type_decl,
      // type-alias-decl
    ),

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
      repeat($.member_modifier),
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

    _stmt_list: $ => repeat1StmtSep($.stmt),

    // _stmt_sep: $ => repeat1(seq(
    //   token.immediate(choice('\n', ';')),
    //   $._horizontal_space
    // )),

    stmt: $ => choice(
      $.brace_stmt,
      // discard-stmt
      // loop-stmt
      $.jump_stmt,
      $._decl_stmt,
      $.expr
    ),

    // JUMP STATEMENTS
    jump_stmt: $ => choice( // TODO: handle no newline in return and yield
      // conditional-binding-stmt
      seq(
        "return",
        field('return', $.expr),
      ),
      seq(
        "yield",
        field('yield', $.expr),
      ),
      "break",
      "continue",
    ),
    // jump-stmt ::= (no-implicit-whitespace)
    //   'return' (horizontal-space* expr)?
    //   'yield' horizontal-space* expr
    //   'break'
    //   'continue'

    // DECLARATION STATEMENTS

    _decl_stmt: $ => choice(
      // type-alias-decl
      // product-type-decl
      // extension-decl
      // conformance-decl
      // function-decl
      // subscript-decl
      $.binding_decl,
    ),

    binding_decl: $ => seq(
      // inlined: binding-head
      optional($.access_modifier),
      repeat($.member_modifier),
      field('pattern', $.binding_pattern),
      optional(seq("=", field('initializer', $.expr))),
    ),

    // EXPRESSIONS

    expr: $ => seq($._infix_expr_head, repeat(seq($._infix_expr_tail))),

    _infix_expr_head: $ => prec(2, choice(
      // async-expr
      // await-expr
      // unsafe-expr
      $._prefix_expr
    )), // TODO

    _infix_expr_tail: $ => choice(
      // type-casting-tail
      $.infix_operator_tail,
    ),

    infix_operator_tail: $ => seq(
      field('operator', $.infix_operator),
      field('rhs', $._prefix_expr),
    ),

    _prefix_expr: $ => seq(optional($.prefix_operator), $._postfix_expr),

    _postfix_expr: $ => choice(
      $._compound_expr,
      seq(
        $._postfix_expr,
        $.postfix_operator,
      ),
    ),

    // COMPOUND EXPRESSIONS

    _compound_expr: $ => choice(
      $.value_member_expr,
      // static-value-member-expr
      $.function_call_expr,
      // subscript-call-expr
      $._primary_expr,
    ),

    value_member_expr: $ => seq(
      field('qualifier', $._compound_expr),
      ".",
      choice(
        field('label', $.primary_decl_ref),
        field('index', /[0-9]+/),
      ),
    ),

    function_call_expr: $ => seq(
      field('head', $._compound_expr),
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

    // PRIMARY EXPRESSIONS

    _primary_expr: $ => choice(
      $._scalar_literal,
      // compound-literal
      $.primary_decl_ref,
      // implicit-member-ref
      $.lambda_expr,
      $._selection_expr,
      // inout-expr
      $.tuple_expr,
      "nil",
    ),

    tuple_expr: $ => seq(
      "(",
      optional(seq(
        $.tuple_expr_element,
        repeat(seq(",", $.tuple_expr_element)),
      )),
      ")",
    ),

    tuple_expr_element: $ => seq(
      optional(seq(field('label', $.identifier), ":")),
      $.expr,
    ),

    primary_decl_ref: $ => seq(
      field('identifier', $.identifier_expr),
      // repeat($._static_argument_list)
    ),

    identifier_expr: $ => seq(
      field('entity', $._entity_identifier),
      // field('impls', repeat($._impl_identifier)),
    ),

    _entity_identifier: $ => choice(
      $.identifier,
      // function-entity-identifier
      //   operator-entity-identifier
    ),

    lambda_expr: $ => seq(
      "fun",
      // capture-list?
      field('signature', $.function_signature),
      field('body', $.brace_stmt),
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

    // OPERATORS

    prefix_operator: $ => seq(prefix_operator_head, repeat(imm_raw_operator)),
    postfix_operator: $ => seq(postfix_operator_head, repeat(imm_raw_operator)),
    operator: $ => operator,
    infix_operator: $ => token(choice(
      operator,
      "=", "==", "..<", "...",
    )),

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

    member_modifier: $ => choice(
      field("receiver_modifier", choice("sink", "inout", "yielded")),
      field("static_modifier", "static"),
    ),

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
    single_line_comment: $ => prec(99, token(/\/\/[^\r\n\v]*/)),
    block_comment: $ => prec(100, choice(
      seq($._block_comment_open, "*/"),
      seq($._block_comment_open, $.block_comment, "*/")
    )),
    _block_comment_open: $ => token(/\/[*](?:[^*\/]+|(?:[\/]+|[*]+)[^*\/])*/),
  },

  extras: $ => [whitespace, $.single_line_comment, $.block_comment],

  word: $ => $.identifier,
});

/// Repeats `item` with stmt-separator.
function repeat1StmtSep(item) {
  return seq(
    item,
    repeat(seq(choice("\n", ";"), optional(item)))
  )
}
