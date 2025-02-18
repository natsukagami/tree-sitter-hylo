/// <reference path="node_modules/tree-sitter-cli/dsl.d.ts" />

// Lexing Precedences
const GENERICS_P = 99
const SEPARATOR_P = 96
const COMMENTS_P = 95
const INOUT_P = 91
const OPERATOR_P = 90

// Token: String
const unicode_escape = /\\u[0-9a-fA-F_]+/;
const simple_escape = choice(`\\0`, `\\t`, `\\n`, `\\r`, `\\'`, `\\"`);
const escape_char = choice(simple_escape, unicode_escape);
const single_quoted_text_item = choice(escape_char, /[^"\x0a\x0d]/);
const single_line_string = seq('"', repeat(token.immediate(single_quoted_text_item)), token.immediate('"'));

const m_char = token.immediate(/[^"]|"[^"]|""[^"]/);
const multiline_quoted_text_item = choice(escape_char, m_char);
const multiline_string = seq('"""', repeat1(multiline_quoted_text_item), '"""');

// Token: Whitespace
const newline = "\n";
const horizontal_space_token = /[ \t]/;
const whitespace = token(choice(horizontal_space_token, newline));
const stmt_sep = token(prec(SEPARATOR_P, /\n|;/));

// Token: Operators
const non_assignment = /[-+*\/^%&!?~|<>]/u; // todo: support \p{Sm}
const common_operator = /[-+*\/^%&!?=~|]/u; // todo: support \p{Sm}
const raw_operator = token(prec(OPERATOR_P, choice(common_operator, "<", ">")));
const imm_raw_operator = token.immediate(prec(OPERATOR_P, raw_operator));
const prefix_operator_head = token(prec(OPERATOR_P, choice(common_operator, ">", /\.\.+/)));
const postfix_operator_head = token.immediate(prec(OPERATOR_P, choice(common_operator, "<", /\.\.+/)));
const operator_head = choice(raw_operator, /\.\.+/);
const operator = token(prec(OPERATOR_P, choice(
  non_assignment,
  /\.\.+/,
  seq(operator_head, repeat(imm_raw_operator), token.immediate(non_assignment)),
)));
const assignment_operator = token(prec(OPERATOR_P, seq(
  optional(seq(operator_head, repeat(imm_raw_operator))),
  "=",
)));

// Token: floats
const decimal_literal = /[0-9][0-9_]*/;
const float_suffix = seq(/[0-9]/, optional(decimal_literal));
const exponent_sign = choice("+", "-");
const exponent = seq(choice('e', 'E'), optional(exponent_sign), float_suffix);
const float_fractional_const = seq(decimal_literal, ".", float_suffix);
const floating_point_literal = token(choice(
  seq(float_fractional_const, optional(exponent)),
  seq(decimal_literal, exponent),
));

// Token: Unicode
const c_char = /[^']/;
const unicode_scalar_literal = token(choice(
  seq("'", escape_char, "'"),
  seq("'", c_char, "'"),
));

// Token: generics
const genericsOpen = token.immediate(prec(GENERICS_P, "<"));
const genericsClose = token.immediate(prec(GENERICS_P, ">"));
const genericScope = (...items) => seq(genericsOpen, ...items, genericsClose);

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
      $.namespace_decl,
      $.trait_decl,
      $.type_alias_decl,
      $.product_type_decl,
      $.extension_decl,
      $.conformance_decl,
      $.binding_decl,
      $._function_decl,
      $.subscript_decl,
      $.operator_decl,
    ),

    import_decl: $ => seq(
      "import",
      $.identifier,
    ),

    // NAMESPACE

    namespace_decl: $ => seq(
      $.namespace_head,
      "{",
      field('body', repeat1StmtSep($._namespace_member)),
      "}",
    ),

    namespace_head: $ => seq(
      optional($.access_modifier),
      "namespace",
      field('name', $.identifier)
    ),

    _namespace_member: $ => choice(
      $.namespace_decl,
      $.trait_decl,
      $.type_alias_decl,
      $.product_type_decl,
      $.extension_decl,
      $.conformance_decl,
      $.binding_decl,
      $._function_decl,
      $.subscript_decl,
    ),

    // TRAIT

    trait_decl: $ => declWith($.trait_head, $._trait_requirement_decl),

    trait_head: $ => seq(
      optional($.access_modifier),
      "trait",
      field('name', $.identifier),
      optional(seq(
        ":",
        field('refinements', seq(
          $.name_type_expr,
          repeat(seq(",", $.name_type_expr))
        ))
      )),
    ),

    _trait_requirement_decl: $ => choice(
      $._associated_decl,
      $._function_decl,
      $.subscript_decl,
      $.property_decl,
    ),

    // ASSOCIATED TYPES & VALS
    _associated_decl: $ => choice(
      $.associated_type_decl,
      $.associated_value_decl,
    ),

    associated_type_decl: $ => seq(
      "type",
      field('name', $.identifier),
      optional(choice(
        field('conformance', $.conformance_list),
        seq(
          optional(field('conformance', $.conformance_list)),
          field('where', $.where_clause),
        ),
      )),
      optional(seq(
        "=",
        field('default', $._type_expr),
      )),
    ),

    associated_value_decl: $ => seq(
      "value",
      field('name', $.identifier),
      optional(field('where', $.where_clause)),
      optional(seq(
        "=",
        field('default', $._type_expr),
      )),
    ),

    // TYPE ALIAS

    type_alias_decl: $ => seq(
      $.type_alias_head,
      "=",
      field('rhs', $._type_expr),
    ),

    type_alias_head: $ => seq(
      optional($.access_modifier),
      "typealias",
      field('name', $.identifier),
      optional($.generic_clause),
    ),

    // PRODUCT TYPE

    product_type_decl: $ => declWith($.product_type_head, $._product_type_member_decl),

    product_type_head: $ => seq(
      optional($.access_modifier),
      "type",
      field('name', $.identifier),
      optional($.generic_clause),
      optional($.conformance_list),
    ),

    _product_type_member_decl: $ => choice(
      $._function_decl,
      $.deinit_decl,
      $.subscript_decl,
      $.property_decl,
      $.binding_decl,
      $.product_type_decl,
      $.type_alias_decl,
    ),

    deinit_decl: $ => seq(
      "deinit",
      field('body', $.brace_stmt),
    ),

    // EXTENSION

    extension_decl: $ => declWith($.extension_head, $._extension_member_decl),

    extension_head: $ => seq(
      optional($.access_modifier),
      "extension",
      field('subject', $._type_expr),
      optional($.where_clause),
    ),

    _extension_member_decl: $ => choice(
      $._function_decl,
      $.subscript_decl,
      $.product_type_decl,
      $.type_alias_decl,
    ),

    // CONFORMANCE

    conformance_decl: $ => declWith($.conformance_head, $._conformance_member_decl),

    conformance_head: $ => seq(
      optional($.access_modifier),
      "conformance",
      field('subject', $._type_expr),
      $.conformance_list,
      optional($.where_clause),
    ),

    conformance_list: $ => seq(
      ":",
      $.name_type_expr,
      repeat(seq(",", $.name_type_expr))
    ),

    _conformance_member_decl: $ => choice(
      $._function_decl,
      $.subscript_decl,
      $.property_decl,
      $.product_type_decl,
      $.type_alias_decl,
    ),

    // FUNCTIONS

    _function_decl: $ => choice(
      $.function_memberwise_init,
      $.function_decl
    ),

    function_decl: $ => seq(
      repeat($.decl_attr),
      field('head', $.function_head),
      field('signature', $.function_signature),
      optional(field('body', $._function_body)),
    ),

    function_head: $ => seq(
      optional($.access_modifier),
      optional($._member_modifiers),
      $.function_name,
      optional($.generic_clause),
      optional($.capture_list),
    ),

    function_signature: $ => prec.right(seq(
      '(',
      field('params', optional($._parameter_list)),
      ')',
      optional($.receiver_effect),
      optional(seq("->", field('returns', $._type_expr))),
      optional($.type_aliases_clause),
    )),

    _parameter_list: $ => seq(
      $.parameter_decl,
      repeat(seq(",", $.parameter_decl)),
    ),
    parameter_decl: $ => seq(
      field('label', choice($.identifier, "_")),
      optional(field('name', $.identifier)),
      optional($.implicit_parameter_modifier),
      optional(seq(
        ":",
        field('type', $._parameter_type_expr),
      )),
      optional(seq(
        "=",
        field('default_value', $._expr),
      )),
    ),
    _parameter_type_expr: $ => seq(
      optional(field('convention', $.parameter_passing_convention)),
      $._type_expr,
    ),
    parameter_passing_convention: $ => choice("let", "set", "inout", "sink", "yielded"),

    type_aliases_clause: $ => seq(
      "where",
      $.type_aliases_clause_item,
      repeat(seq(",", $.type_aliases_clause_item)),
    ),
    type_aliases_clause_item: $ => seq(
      "typealias",
      field('lhs', $.identifier),
      "=",
      field('rhs', $._type_expr),
    ),

    _function_body: $ => choice(
      $.method_bundle_body,
      $.brace_stmt
    ),

    method_bundle_body: $ => seq(
      "{",
      repeat1($.method_impl),
      "}",
    ),

    method_impl: $ => seq(
      $.method_introducer,
      optional(field('body', $.brace_stmt)),
    ),

    method_introducer: $ => choice("let", "sink", "inout", "set"),

    function_name: $ => choice(
      'init',
      seq('fun', field('name', $.identifier)),
      seq('fun', $.operator_notation, field('operator', $.operator))
    ),

    function_memberwise_init: $ => seq(optional($.access_modifier), "memberwise", "init"),

    // SUBSCRIPTS

    subscript_decl: $ => seq(
      $.subscript_head,
      $.subscript_signature,
      field('body', $.subscript_body)
    ),

    subscript_head: $ => seq(
      optional($.access_modifier),
      optional($._member_modifiers),
      "subscript",
      optional(field('name', $.identifier)),
      optional($.generic_clause),
      optional($.capture_list),
    ),

    subscript_signature: $ => seq(
      "(",
      optional(field('params', $._parameter_list)),
      ")",
      optional($.receiver_effect),
      ":",
      optional(field('var', "var")),
      field('returns', $._type_expr),
    ),

    subscript_body: $ => choice(
      seq("{", repeat1($.subscript_impl), "}"),
      $.brace_stmt,
    ),

    subscript_impl: $ => seq(
      $.subscript_introducer,
      optional(field('body', $.brace_stmt)),
    ),

    subscript_introducer: $ => choice("let", "sink", "inout", "set"),

    // OPERATOR DECLARATIONS

    operator_decl: $ => seq(
      optional($.access_modifier),
      "operator",
      $.operator_notation,
      field('name', $.operator),
      optional(seq(
        ":",
        $.precedence_group
      )),
    ),

    operator_notation: $ => token(choice("prefix", "infix", "postfix")),

    precedence_group: $ => token(choice("assignment", "disjunction", "conjunction", "comparison", "fallback", "range", "addition", "multiplication", "shift", "exponentiation")),

    // PROPERTIES

    property_decl: $ => seq(
      $.property_head,
      ":",
      field('type', $._type_expr),
      field('body', $.subscript_body),
    ),

    property_head: $ => seq(
      optional($.access_modifier),
      optional($._member_modifiers),
      "property",
      field('name', $.identifier),
    ),

    // CAPTURES

    capture_list: $ => seq(
      "[",
      $.binding_decl,
      repeat(seq(",", $.binding_decl)),
      "]",
    ),

    // STATEMENTS

    brace_stmt: $ => seq('{', optional($._stmt_list), '}'),

    _stmt_list: $ => repeat1StmtSep($.stmt),

    stmt: $ => choice(
      $.brace_stmt,
      $.discard_stmt,
      $._loop_stmt,
      $.jump_stmt,
      $._decl_stmt,
      $._expr
    ),

    discard_stmt: $ => seq("_", "=", $._expr),

    // LOOP STATEMENTS

    _loop_stmt: $ => choice(
      $.do_while_stmt,
      $.while_stmt,
      $.for_stmt,
    ),

    do_while_stmt: $ => seq(
      "do",
      field('body', $.brace_stmt),
      "while",
      field('condition', $._expr),
    ),

    while_stmt: $ => seq(
      "while",
      $.while_condition_list,
      field('body', $.brace_stmt),
    ),
    while_condition_list: $ => seq($.while_condition, repeat(seq(",", $.while_condition))),
    while_condition: $ => seq(
      optional(seq(
        field('binding', $.binding_pattern),
        ":",
      )),
      field('condition', $._expr),
    ),

    for_stmt: $ => seq(
      "for",
      field('binding', $.binding_decl),
      "in",
      field('range', $._expr),
      optional(seq(
        "where",
        field('where', $._expr),
      )),
      field('body', $.brace_stmt),
    ),

    // JUMP STATEMENTS
    jump_stmt: $ => choice( // TODO: handle no newline in return and yield
      $.conditional_binding_stmt,
      seq(
        "return",
        optional(field('return', $._expr)),
      ),
      seq(
        "yield",
        optional(field('yield', $._expr)),
      ),
      "break",
      "continue",
    ),

    conditional_binding_stmt: $ => seq(
      field('binding', $.binding_pattern),
      repeat(stmt_sep),
      "else",
      field('else', choice(
        $.jump_stmt,
        $.brace_stmt,
        $._expr,
      )),
    ),

    // DECLARATION STATEMENTS

    _decl_stmt: $ => choice(
      $.type_alias_decl,
      $.product_type_decl,
      $.extension_decl,
      $.conformance_decl,
      $.function_decl,
      $.subscript_decl,
      $.binding_decl,
    ),

    binding_decl: $ => seq(
      // inlined: binding-head
      optional($.access_modifier),
      optional($._member_modifiers),
      field('pattern', $.binding_pattern),
      optional(seq("=", field('initializer', $._expr))),
    ),

    // EXPRESSIONS

    _expr: $ => prec.right(choice(
      $.assignment_expr,
      $.infix_expr,
      $.unsafe_expr,
      $.prefix_expr,
      $.postfix_expr,
      $.type_casting_expr,
      $._compound_expr,
    )),

    assignment_expr: $ => prec.right("expr_assignment", seq(
      field('lhs', $._expr),
      field('op', $.assignment_operator),
      field('rhs', $._expr),
    )),

    infix_expr: $ => prec.right("expr_infix", seq(
      field('lhs', $._expr),
      repeat1(field('tail', $.infix_operator_tail)),
    )),
    infix_operator_tail: $ => prec.left(seq(
      field('operator', $.infix_operator),
      field('rhs', $._expr),
    )),

    // async_expr: $ => seq(
    //   "async",
    //   field('captures', $.capture_list),
    //   optional(seq(
    //     "->",
    //     field('returns', $._type_expr),
    //   )),
    //   field('body', $.brace_stmt),
    // ),
    // await_expr: $ => seq("await", $._expr),

    unsafe_expr: $ => prec("expr_float", seq("unsafe", $._expr)),

    prefix_expr: $ => prec("expr_prefix", seq(
      field('op', $.prefix_operator), // TODO: disallow any space in-between
      field('expr', $._expr),
    )),

    postfix_expr: $ => prec("expr_postfix", seq(
      field('expr', $._expr),
      field('op', $.postfix_operator),
    )),
    type_casting_expr: $ => prec("expr_postfix", seq(
      field('lhs', $._expr),
      field('operator', choice("as", "as!", "as*")),
      prec.right(field('type', $._type_expr)),
    )),

    // COMPOUND EXPRESSIONS

    _compound_expr: $ => choice(
      $.value_index_expr,
      $.value_member_expr,
      $.function_call_expr,
      $.subscript_call_expr,
      $._primary_expr,
    ),

    value_index_expr: $ => prec("expr_select_on_type", seq(
      field('qualifier', $._compound_expr),
      ".",
      field('index', $.value_member_index),
    )),
    value_member_index: $ => /[0-9]+/,

    value_member_expr: $ => prec.right("expr_select", seq(
      choice(
        field('type_qualifier', $._type_expr),
        field('qualifier', $._compound_expr),
      ),
      repeat1(prec.right("expr_select", seq(".", field('selector', $.selector))))),
    ),

    function_call_expr: $ => prec("expr_select", seq(
      field('head', $._compound_expr),
      token.immediate("("),
      field('arguments', optional($._call_argument_list)),
      ")",
    )),

    subscript_call_expr: $ => prec("expr_select", seq(
      field('head', $._compound_expr),
      token.immediate("["),
      field('arguments', optional($._call_argument_list)),
      "]",
    )),

    _call_argument_list: $ => seq(
      $.call_argument,
      repeat(seq(',', $.call_argument)),
    ),

    call_argument: $ => seq(
      optional(seq(
        field('label', $.identifier),
        ":",
      )),
      $._expr,
    ),

    // PRIMARY EXPRESSIONS

    _primary_expr: $ => choice(
      $.selector_expr,
      $._scalar_literal,
      $._compound_literal,
      $.implicit_member_ref,
      $.lambda_expr,
      $._selection_expr,
      $.inout_expr,
      $.tuple_expr,
      $.pragma_expr,
      "nil",
    ),

    selector_expr: $ => prec("expr_select", $.selector),

    //! TODO: fix possible whitespace in between
    inout_expr: $ => prec("expr_inout", seq(token(prec(INOUT_P, "&")), $._expr)),

    tuple_expr: $ => prec.left(seq(
      "(",
      optional(
        seq(
          $.tuple_expr_element,
          repeat(seq(",", $.tuple_expr_element)),
          optional(",")
        ),
      ),
      ")",
    )),

    tuple_expr_element: $ => prec("expr", seq(
      optional(seq(field('label', $.identifier), ":")),
      $._expr,
    )),

    implicit_member_ref: $ => seq(".", $.selector),

    identifier_expr: $ => seq(
      field('entity', $._entity_identifier),
      optional(seq(".", field('introducer', $.method_introducer))),
    ),

    _entity_identifier: $ => prec("expr", choice(
      $.identifier,
      $.function_entity_identifier,
      $.operator_entity_identifier,
    )),

    lambda_expr: $ => seq(
      "fun",
      optional($.capture_list),
      field('signature', $.function_signature),
      field('body', $.brace_stmt),
    ),

    _selection_expr: $ => choice(
      $.conditional_expr,
      $.match_expr,
    ),

    conditional_expr: $ => seq(
      "if",
      field('condition', $._conditional_clause),
      field('then', $.brace_stmt),
      repeat(stmt_sep),
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
      seq($.binding_pattern, "=", $._expr),
      $._expr,
    ),

    match_expr: $ => seq(
      "match",
      field('subject', $._expr),
      "{",
      repeat($.match_case),
      "}",
    ),

    match_case: $ => seq(
      field('pattern', $.binding_decl),
      optional(seq("where", field('condition', $._expr))),
      field('body', $.brace_stmt),
    ),

    pragma_expr: $ => choice(
      "#file",
      "#line",
      seq("#if", /[^\r\n\v]*/),
      "#else",
      "#endif",
    ),

    // PATTERNS

    _pattern: $ => choice(
      $.binding_pattern,
      $.identifier,
      $.tuple_pattern,
      $.wildcard_pattern,
    ),

    // expr_pattern: $ => $._expr,

    binding_pattern: $ => prec.right(seq(
      field('introducer', $.binding_introducer),
      field('pattern', choice(
        $.tuple_pattern,
        $.wildcard_pattern,
        $.identifier,
      )),
      optional(seq(":", field('annotation', $._type_expr))),
    )),

    binding_introducer: $ => choice("let", "var", "sink", "inout"),

    tuple_pattern: $ => seq(
      "(",
      $.tuple_pattern_element,
      repeat(seq(",", $.tuple_pattern_element)),
      optional(","),
      ")",
    ),
    tuple_pattern_element: $ => seq(
      optional(seq(field('label', $.identifier), ":")),
      field('pattern', $._pattern),
    ),

    wildcard_pattern: $ => "_",

    // OPERATORS

    prefix_operator: $ => token(prec(OPERATOR_P, seq(prefix_operator_head, repeat(imm_raw_operator)))),
    postfix_operator: $ => token.immediate(prec(OPERATOR_P, seq(postfix_operator_head, repeat(imm_raw_operator)))),
    operator: $ => token(prec(OPERATOR_P, choice(operator, assignment_operator))),
    infix_operator: $ => token(prec(OPERATOR_P, choice(
      operator,
      "<=", ">=", "==", "..<", "...",
    ))),
    assignment_operator: $ => assignment_operator,

    // TYPES
    _type_expr: $ => prec("type_simple", choice(
      // async-type-expr
      $.array_type_expr,
      $.conformance_lens_type_expr,
      $.existential_type_expr,
      $.opaque_type_expr,
      // $.indirect_type_expr,
      $.remote_type_expr,
      $.lambda_type_expr,
      // stored-projection-type-expr
      $.tuple_type_expr,
      // union-type-expr
      $.wildcard_type_expr,
      $.name_type_expr,
      seq('(', $._type_expr, ')'),
    )),

    array_type_expr: $ => prec("type_float", seq(
      field('item', $._type_expr),
      token.immediate("["),
      optional(field('size', $._expr)),
      "]",
    )),

    conformance_lens_type_expr: $ => prec("type_select", seq(
      field('subject', $._type_expr),
      "::",
      field('trait', $._type_identifier),
    )),

    existential_type_expr: $ => prec.right("type_float", seq(
      "any",
      field('requires', $.trait_composition),
      optional(field('where', $.where_clause))
    )),

    opaque_type_expr: $ => prec.right("type_float", seq(
      "some",
      choice(
        "_",
        seq(
          field('requires', $.trait_composition),
          optional($.where_clause),
        ),
      ),
    )),

    // indirect_type_expr: $ => prec.right("type_float", seq(
    //   choice("indirect"),
    //   $._type_expr
    // )),

    remote_type_expr: $ => prec.right("type_float", seq(
      choice("remote"),
      field('access', $.parameter_passing_convention),
      field('type', $._type_expr),
    )),

    lambda_type_expr: $ => prec("type_lambda", seq(
      optional($.lambda_environment),
      "(",
      optional(field('params', seq(
        $.lambda_parameter,
        repeat(seq(",", $.lambda_parameter)),
      ))),
      ")",
      optional($.receiver_effect),
      "->",
      field('returns', $._type_expr),
    )),

    lambda_environment: $ => choice(
      "thin",
      seq("[", optional($._type_expr), "]"),
    ),

    lambda_parameter: $ => prec("type_lambda", seq(
      optional(seq(
        field('label', $.identifier),
        ":",
      )),
      optional(field('convention', $.parameter_passing_convention)),
      field('type', $._type_expr),
    )),

    tuple_type_expr: $ => seq(
      "{",
      optional(
        seq(
          $.tuple_type_element,
          repeat(seq(",", $.tuple_type_element)),
          optional(",")
        ),
      ),
      "}",
    ),

    tuple_type_element: $ => seq(
      optional(seq(
        field('label', $.identifier),
        ":",
      )),
      $._type_expr,
    ),

    wildcard_type_expr: $ => prec("type_wildcard", "_"),

    name_type_expr: $ => prec.right("type_select", choice(
      field('qualifier', $.selector),
      seq(
        field('qualifier', choice($.selector, $._type_expr)),
        repeat1(prec.right("type_select", seq(".", field('selector', $.selector)))),
      ),
    )),

    _type_identifier: $ => prec("type", $.identifier),

    // GENERICS AND WHERE CLAUSES

    generic_clause: $ => genericScope(
      $._generic_parameter,
      repeat(seq(",", $._generic_parameter)),
      optional($.where_clause),
    ),

    _generic_parameter: $ => choice(
      $.generic_type_parameter,
      $.generic_value_parameter,
    ),

    generic_type_parameter: $ => seq(
      optional("@type"),
      field('name', $.identifier),
      optional(alias("...", 'variadic')),
      optional(seq(":", field('requires', $.trait_composition))),
      optional(seq("=", field('default', $._type_expr))),
    ),

    generic_value_parameter: $ => seq(
      "@value",
      field('name', $.identifier),
      ":",
      field('type', $._type_expr),
      optional(seq("=", field('default', $._expr))),
    ),

    where_clause: $ => prec.left("type_where", seq("where",
      $._where_clause_constraint,
      repeat(seq(",", $._where_clause_constraint)),
    )),

    _where_clause_constraint: $ => choice(
      $.equality_constraint,
      $.conformance_constraint,
      $.value_constraint_expr,
    ),

    equality_constraint: $ => prec.left("type_infix", seq(
      field('lhs', $.name_type_expr),
      "==",
      field('rhs', $._type_expr),
    )),

    conformance_constraint: $ => prec("type_infix", seq(
      field('subject', $.name_type_expr),
      ":",
      field('requires', $.trait_composition),
    )),

    value_constraint_expr: $ => prec.right(seq(
      "@value",
      $._expr,
    )),

    trait_composition: $ => prec("type_where", seq(
      $.name_type_expr,
      repeat(prec("type_where", seq("&", $.name_type_expr))),
    )),

    // MODIFIERS

    access_modifier: $ => choice('public', 'private', 'internal'),

    _member_modifiers: $ => prec.left(choice(
      $.receiver_modifier,
      $.static_modifier,
      seq($.receiver_modifier, $.static_modifier),
      seq($.static_modifier, $.receiver_modifier),
    )),
    receiver_modifier: $ => choice("sink", "inout", "yielded"),
    static_modifier: $ => "static",

    receiver_effect: $ => choice("inout", "sink", "let"),

    implicit_parameter_modifier: $ => token.immediate("?"),

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

    function_entity_identifier: $ => seq(
      field('name', $.identifier),
      token.immediate("("),
      repeat1(seq(field('label', $.identifier), ":")),
      token.immediate(")"),
    ),

    operator_entity_identifier: $ => seq(
      $.operator_notation,
      field('operator', $.operator),

    ),

    selector: $ => seq(
      field('identifier', $.identifier_expr),
      optional(field('static_args', $.static_argument_list)),
    ),

    static_argument_list: $ => genericScope(
      $.static_argument,
      repeat(seq(",", $.static_argument)),
    ),

    static_argument: $ => {
      const make = (prefix, main) => seq(
        prefix,
        optional(seq(
          field('label', $.identifier),
          ":",
        )),
        main,
      );
      return choice(
        make("@value", field('expr', $._expr)),
        make(optional("@type"), field('type', $._type_expr)),
      )
    },

    // COMPOUND LITERALS

    _compound_literal: $ => choice($.buffer_literal, $.map_literal),

    buffer_literal: $ => seq(
      "[",
      optional(seq(
        field('item', $._expr),
        repeat(seq(",", field('item', $._expr))),
        optional(","),
      )),
      "]",
    ),

    buffer_literal: $ => seq(
      "[",
      optional(seq(
        field('item', $._expr),
        repeat(seq(",", field('item', $._expr))),
        optional(","),
      )),
      "]",
    ),

    map_literal: $ => seq(
      "[",
      choice(
        // empty
        ":",
        seq(
          field('item', $.map_component),
          repeat(seq(",", field('item', $.map_component))),
          optional(","),
        )
      ),
      "]",
    ),
    map_component: $ => seq(
      field('key', $._expr),
      ":",
      field('value', $._expr),
    ),

    // LITERALS

    _scalar_literal: $ => choice(
      $.boolean_literal,
      $.integer_literal,
      $.floating_point_literal,
      $.string_literal,
      $.unicode_scalar_literal,
    ),

    boolean_literal: $ => choice("true", "false"),

    string_literal: $ => choice(
      $.simple_string,
      $.multiline_string,
    ),

    unicode_scalar_literal: $ => unicode_scalar_literal,

    floating_point_literal: $ => floating_point_literal,

    simple_string: $ => token(single_line_string),
    multiline_string: $ => token(multiline_string),

    integer_literal: $ => choice($.binary_literal, $.octal_literal, $.decimal_literal, $.hexadecimal_literal),
    binary_literal: $ => /0b[01_]+/,
    octal_literal: $ => /0o[0-7_]+/,
    decimal_literal: $ => decimal_literal,
    hexadecimal_literal: $ => /0x[0-9a-fA-F_]+/,

    // DECLARATION ATTRIBUTES
    decl_attr: $ => seq(
      $.attribute_name,
      optional($.attribute_argument_list),
    ),
    attribute_name: $ => token(seq("@", field('name', /[a-zA-Z_]+/))),
    attribute_argument_list: $ => seq(
      "(",
      $.attribute_argument,
      repeat(seq(",", $.attribute_argument)),
      ")",
    ),
    attribute_argument: $ => choice($.simple_string, $.decimal_literal),

    // WHITESPACES
    single_line_comment: $ => token(prec(COMMENTS_P, /\/\/[^\r\n\v]*/)),
    block_comment: $ => seq($._block_comment_open, "*/"),
    _block_comment_open: $ => token(prec(COMMENTS_P, /\/[*](?:[^*\/]+|(?:[\/]+|[*]+)[^*\/])*/)),
  },

  extras: $ => [whitespace, $.single_line_comment, $.block_comment],

  word: $ => $.identifier,

  conflicts: $ => [
    // method bundle needs to see the whole set to know, but should be short (3 items)
    [$.method_introducer, $.receiver_modifier],
    [$.subscript_introducer, $.receiver_modifier],
    [$.brace_stmt, $.tuple_type_expr],
    [$.identifier_expr], // Look at next token
    [$.conditional_expr], // Look at next token
    [$._entity_identifier, $.function_entity_identifier], // Look at next token to know whether it's a function entity
    [$.conditional_binding_stmt, $.binding_decl],
  ],

  precedences: $ => [
    // Expressions: select > suffix > prefix > infix > float > inout
    ["expr_select", "expr_select_on_type", "expr_inout", "expr_postfix", "expr_prefix", "expr_float", "expr_infix", "expr_assignment"],
    // Type Expressions: 
    ["type_wildcard", "type_simple", "expr_select", "type_select", "type_float", "type_where", "type_lambda", "type_infix"],
    // Type vs Expression clash, prefer types
    ["type", "pattern", "expr"],
    // Generic brackets have higher precedence than operators
    ["generics", "operators"],
  ],
});

/// Repeats `item` with stmt-separator.
function repeat1StmtSep(item) {
  return seq(
    repeat(";"),
    item,
    repeat(seq(stmt_sep, optional(item)))
  )
}

function declWith(head, member) {
  return seq(
    head,
    "{",
    field('body', repeat(choice(member, ";"))),
    "}",
  )
}
