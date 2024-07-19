; Function Decl
"fun"  @keyword
;; Function names
(function_memberwise_init) @constructor
(function_name (identifier) @function)
(function_decl head: (function_head (function_name (identifier) @function.abstract)) !body)
(function_name "init" @constructor)
;; Parameters
(parameter_decl label: (identifier) @label)
(parameter_decl label: (identifier) @variable.parameter !name)
(parameter_decl name:  (identifier) @variable.parameter)
(parameter_passing_convention) @keyword.storage.modifier
;; Body
(method_impl (method_introducer) @keyword.storage.modifier)

; Struct Decl
"type" @keyword
(product_type_head name: (identifier) @type)
(product_type_decl body: (binding_decl pattern: (binding_pattern pattern: (identifier) @property)))

; Trait Decl
"trait" @keyword
(trait_head name: (identifier) @type.interface @type.trait @type.abstract)

; Associated Type
(associated_type_decl name: (identifier) @type.abstract)

; Subscript
"subscript" @keyword
(subscript_head name: (identifier) @function.method)
(subscript_impl (subscript_introducer) @keyword.storage.modifier)

; Property
"property" @keyword
(property_head name: (identifier) @variable.member @property)

; Type Alias
"typealias" @keyword
(type_alias_head name: (identifier) @type)
(type_alias_decl "=" @operator.assignment)

; Statements
;; Jumps
"return"   @keyword.control.return
"yield"    @keyword.control.repeat
"break"    @keyword.control
"continue" @keyword.control
;; Conditional
"if"   @keyword.conditional
"else" @keyword.conditional
;; Binding
(binding_decl pattern: (binding_pattern introducer: (binding_introducer) @keyword.storage.modifier))
(binding_decl pattern: (binding_pattern pattern: (identifier) @variable))
(binding_decl "=" @operator.assignment)

; Expr
;; Operators
(infix_operator) @operator.infix
(type_casting_tail operator: "as") @keyword
(type_casting_tail operator: "as!") @keyword.unsafe
;; Inout
(inout_expr "&" @operator.prefix @keyword.storage)
;; Compound Expr
;;; Function / Method calls
(function_call_expr head: (primary_decl_ref identifier: (identifier_expr (identifier) @function)))
(function_call_expr head: (value_member_expr label: (primary_decl_ref identifier: (identifier_expr (identifier) @function.method))))
(call_argument label: (identifier) @label)
(subscript_call_expr "[" @punctuation.bracket.subscript)
(subscript_call_expr "]" @punctuation.bracket.subscript)
;; Tuples
(tuple_expr "(" @punctuation.bracket.tuple)
(tuple_expr ")" @punctuation.bracket.tuple)
;; Literals
(integer_literal) @number  @constant.numeric.integer
(boolean_literal) @boolean @constant.builtin.boolean
(string_literal)  @string

; Types
(name_type_expr) @type
;; Tuple Types
(tuple_type_expr "{" @punctuation.bracket)
(tuple_type_expr "}" @punctuation.bracket)

;; Generic
(generic_type_parameter "@type" @attribute.annotation)
(generic_type_parameter name: (identifier) @type)
(generic_type_parameter "variadic" @attribute.variadic)

;; Where Clauses
"where" @keyword
(trait_composition "&"* @operator.infix)
(trait_composition (name_type_expr)* @type.trait)

; Modifier
(access_modifier) @attribute.access

; Misc
(single_line_comment) @comment.line
(block_comment)       @comment.block
