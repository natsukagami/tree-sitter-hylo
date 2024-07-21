; Scopes
(brace_stmt) @local.scope
(function_decl) @local.scope
(lambda_expr) @local.scope

; Value Definitions
;; General Decls
(namespace_head name: (identifier) @local.definition)
(trait_head name: (identifier) @local.definition)
(associated_type_decl name: (identifier) @local.definition)
(associated_value_decl name: (identifier) @local.definition)
(type_alias_head name: (identifier) @local.definition)
(product_type_head name: (identifier) @local.definition)
(function_name name: (identifier) @local.definition)
(property_head name: (identifier) @local.definition)
;; Function parameters
(parameter_decl label: (identifier) @local.definition !name)
(parameter_decl name: (identifier) @local.definition)
;; Bindings
(binding_pattern pattern: (identifier) @local.definition)
(tuple_pattern_element label: (identifier) @local.definition pattern: (identifier))
(tuple_pattern_element pattern: (identifier) @local.definition !label)

; Value References
(selector_expr (selector (identifier_expr entity: (identifier) @local.reference)))
(selector_expr (selector (identifier_expr entity: (function_entity_identifier name: (identifier) @local.reference))))
