; Function Decl
"fun"  @keyword
(function_memberwise_init) @function.builtin
(function_name (identifier) @function)
(function_name "init" @function.builtin)

; Struct Decl
"type" @keyword
(product_type_head name: (identifier) @type)

; Expr
;; Operators
(infix_operator) @operator.infix
;; Compound Expr
;;; Function / Method calls
(function_call_expr head: (primary_decl_ref identifier: (identifier_expr (identifier) @function)))
(function_call_expr head: (value_member_expr label: (primary_decl_ref identifier: (identifier_expr (identifier) @function.method))))
;; Literals
(integer_literal) @number

; Types
(name_type_expr) @type

; Modifier
(access_modifier) @attribute.access

; Misc
(single_line_comment) @comment
(block_comment)       @comment
