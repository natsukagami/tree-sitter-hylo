; Function Decl
"fun"  @keyword
;; Function names
(function_memberwise_init) @function.builtin
(function_name (identifier) @function)
(function_name "init" @function.builtin)
;; Parameters
(parameter_decl label: (identifier) @label)
(parameter_decl label: (identifier) @variable.parameter !name)
(parameter_decl name:  (identifier) @variable.parameter)

; Struct Decl
"type" @keyword
(product_type_head name: (identifier) @type)

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
(property_head name: (identifier) @variable.member @variable.other.member)

; Type Alias
"typealias" @keyword
(type_alias_head name: (identifier) @type)
(type_alias_decl "=" @operator.assignment)

; Statements
;; Binding
(binding_decl pattern: (binding_pattern introducer: (binding_introducer) @keyword.storage.modifier))
(binding_decl pattern: (binding_pattern pattern: (identifier) @variable))
(binding_decl "=" @operator.assignment)

; Expr
;; Operators
(infix_operator) @operator.infix
;; Inout
(inout_expr "&" @operator.prefix @keyword.storage)
;; Compound Expr
;;; Function / Method calls
(function_call_expr head: (primary_decl_ref identifier: (identifier_expr (identifier) @function)))
(function_call_expr head: (value_member_expr label: (primary_decl_ref identifier: (identifier_expr (identifier) @function.method))))
(call_argument label: (identifier) @label)
;; Literals
(integer_literal) @number  @constant.numeric.integer
(boolean_literal) @boolean @constant.builtin.boolean

; Types
(name_type_expr) @type

;; Generic
(generic_type_parameter "@type" @attribute.annotation)
(generic_type_parameter name: (identifier) @type)
(generic_type_parameter "variadic" @attribute.variadic)

; Modifier
(access_modifier) @attribute.access

; Misc
(single_line_comment) @comment.line
(block_comment)       @comment.block
