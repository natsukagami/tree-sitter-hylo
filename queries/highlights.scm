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

; Statements
;; Binding
(binding_decl pattern: (binding_pattern introducer: (binding_introducer) @keyword.storage.modifier))
(binding_decl pattern: (binding_pattern pattern: (identifier) @variable))
(binding_decl "=" @operator.assignment)

; Expr
;; Operators
(infix_operator) @operator.infix
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

; Modifier
(access_modifier) @attribute.access

; Misc
(single_line_comment) @comment
(block_comment)       @comment
