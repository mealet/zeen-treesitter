; Comments

(line_comment) @comment
(block_comment) @comment

; Keywords

[
  "alias"
  "break"
  "const"
  "continue"
  "else"
  "enum"
  "extern"
  "for"
  "if"
  "implement"
  "include"
  "interface"
  "let"
  "link"

  "struct"
  "typeof"
  "use"
  "while"
] @keyword

(visibility) @keyword

"fn" @keyword.function
"return" @keyword.return
"self" @variable.builtin
"Self" @variable.builtin

; Types

(builtin_type) @type.builtin
(self_type) @type.builtin
type: (identifier) @type

; Declarations

(function_declaration
  name: (identifier) @function)

(function_signature
  name: (identifier) @function)

(struct_declaration
  name: (identifier) @type)

(enum_declaration
  name: (identifier) @type)

(interface_declaration
  name: (identifier) @type)

(alias_declaration
  name: (identifier) @type)

(let_declaration
  name: (identifier) @variable)

(const_declaration
  name: (identifier) @variable)

(parameter
  name: (identifier) @variable.parameter)

(struct_field
  name: (identifier) @property)

(field_init
  name: (identifier) @property)

(enum_empty_variant
  name: (identifier) @variant)

(enum_tuple_variant
  name: (identifier) @variant)

(enum_struct_variant
  name: (identifier) @variant)

(variant_pattern
  name: (identifier) @variant)

(binding_pattern
  (identifier) @variable)

; Calls

(call_expression
  function: (identifier) @function)

(call_expression
  function: (field_expression
    field: (identifier) @function.method))

(field_expression
  field: (identifier) @property)

; Macros and preprocessor

(macro_name) @function.macro
(type_macro_name) @function.macro
(preprocessor_directive) @keyword.directive
(preprocessor_var) @keyword.directive
(preprocessor_value) @string.special

; Literals

(integer) @number
(float) @number
(char_literal) @character
(string_literal) @string
(true_literal) @boolean
(false_literal) @boolean
(null_literal) @constant.builtin

; Operators

[
  "+"
  "-"
  "*"
  "/"
  "%"
  "="
  "+="
  "-="
  "*="
  "/="
  "%="
  "<<="
  ">>="
  "&="
  "|="
  "^="
  "=="
  "!="
  "<"
  "<="
  ">"
  ">="
  "<<"
  ">>"
  "&&"
  "||"
  "&"
  "|"
  "^"
  "!"
  "~"
  "=>"
  ".."
  ":"
] @operator

; Punctuation

[
  "{"
  "}"
  "["
  "]"
  "("
  ")"
] @punctuation.bracket

[
  ";"
  ","
  "."
] @punctuation.delimiter
