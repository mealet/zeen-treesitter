module.exports = grammar({
    name: "zeen",

    extras: ($) => [/\s/, $.line_comment, $.block_comment],

    word: ($) => $.identifier,

    conflicts: ($) => [
        [$.preprocessor_block],
        [$._top_level, $._statement],
        [$._expression, $.generic_type],
        [$.extern_function],
        [$.array_expression, $.slice_type],
        [$.array_expression, $.array_type],
        [$.range_expression, $.typeof_expression],
        [$.typeof_expression, $.typeof_type],
        [$.named_parameter_list, $.function_type],
        [$.range_expression, $.if_expression],
        [$.binary_expression, $.if_expression],
        [$._statement, $._expression],
        [$.literal_pattern, $._expression],
        [$.single_pattern, $._expression],
        [$.range_expression, $.typeof_type],
        [$._expression, $._type],
        [$._type, $.generic_type],
    ],

    rules: {
        program: ($) => repeat($._top_level),

        _top_level: ($) =>
            choice(
                $.function_declaration,
                $.extern_function,
                $.struct_declaration,
                $.enum_declaration,
                $.interface_declaration,
                $.implement_block,
                $.alias_declaration,
                $.use_declaration,
                $.link_declaration,
                $.include_declaration,
                $.const_declaration,
                $.let_declaration,
                $.preprocessor_block,
            ),

        line_comment: () => token(seq("//", /.*/)),

        block_comment: () => token(seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/")),

        identifier: () => /[A-Za-z_][A-Za-z0-9_]*/,

        builtin_type: () =>
            choice(
                "i8",
                "i16",
                "i32",
                "i64",
                "isize",
                "u8",
                "u16",
                "u32",
                "u64",
                "usize",
                "f32",
                "f64",
                "bool",
                "char",
                "void",
                "never"
            ),

        integer: () => /(0x[0-9a-fA-F_]+|0b[01_]+|0o[0-7_]+|[0-9][0-9_]*)/,

        float: () => /[0-9][0-9_]*\.[0-9_]+/,

        char_literal: () =>
            token(seq(optional("b"), "'", choice(/[^'\\\n]/, seq("\\", /./)), "'")),

        string_literal: () =>
            token(
                choice(
                    seq('"', repeat(choice(/[^"\\\n]/, seq("\\", /./))), '"'),
                    seq('r"', /[^"]*/, '"')
                )
            ),

        visibility: () => "pub",

        generic_params: ($) =>
            prec(
                20,
                seq("[", commaSep1($.generic_param), "]")
            ),

        generic_param: ($) =>
            seq(
                field("name", $.identifier),
                optional(seq(":", $._bound_list))
            ),

        _bound_list: ($) => sep1("+", $._type),

        generic_args: ($) => seq("#[", commaSep1($._type), "]"),

        preprocessor_block: ($) =>
            seq(
                field("directive", $.preprocessor_directive),
                field("body", $.preprocessor_body),
                repeat(
                    choice(
                        seq(
                            "else",
                            optional($.preprocessor_directive),
                            field("body", $.preprocessor_body)
                        ),
                        seq(
                            $.preprocessor_directive,
                            field("body", $.preprocessor_body)
                        )
                    )
                )
            ),

        preprocessor_expr: ($) =>
            choice(
                prec(
                    1,
                    seq(
                        field("directive", $.preprocessor_directive),
                        "{",
                        field("value", $._expression),
                        "}",
                        repeat1(
                            choice(
                                seq(
                                    "else",
                                    optional($.preprocessor_directive),
                                    "{",
                                    field("value", $._expression),
                                    "}"
                                ),
                                seq(
                                    $.preprocessor_directive,
                                    "{",
                                    field("value", $._expression),
                                    "}"
                                )
                            )
                        )
                    )
                ),
                seq(
                    field("directive", $.preprocessor_directive),
                    "{",
                    field("value", $._expression),
                    "}"
                )
            ),

        preprocessor_directive: ($) =>
            choice(
                seq(
                    choice("@os", "@arch", "@env", "@target", "@family"),
                    "[",
                    sep1("|", $.preprocessor_value),
                    "]"
                ),
                "@debug",
                "@release"
            ),

        preprocessor_value: () => /[A-Za-z0-9_.-]+/,

        preprocessor_body: ($) => seq("{", repeat(choice($._top_level, $._statement)), "}"),

        preprocessor_var: () => seq("@var", "[", /[^\]]+/, "]"),

        use_declaration: ($) =>
            seq("use", field("path", $.dotted_path), ";"),

        dotted_path: ($) => sep1(".", $.identifier),

        link_declaration: ($) => seq("link", field("path", $.string_literal), ";"),

        include_declaration: ($) =>
            seq("include", field("path", $.string_literal), ";"),

        alias_declaration: ($) =>
            seq(
                optional($.visibility),
                "alias",
                field("name", $.identifier),
                optional($.generic_params),
                "=",
                field("type", $._type),
                ";"
            ),

        const_declaration: ($) =>
            seq(
                optional($.visibility),
                "const",
                field("name", $.identifier),
                ":",
                field("type", $._type),
                "=",
                field("value", $._expression),
                ";"
            ),

        let_declaration: ($) =>
            seq(
                optional($.visibility),
                optional("extern"),
                "let",
                field("name", $.identifier),
                optional(seq(":", field("type", $._type))),
                optional(seq("=", field("value", $._expression))),
                ";"
            ),

        function_declaration: ($) =>
            seq(
                optional($.visibility),
                "fn",
                field("name", $.identifier),
                optional($.generic_params),
                field("parameters", $.parameter_list),
                optional(field("return_type", $._type)),
                field("body", $.block)
            ),

        extern_function: ($) =>
            seq(
                optional($.visibility),
                "extern",
                "fn",
                field("name", $.identifier),
                field("parameters", $.extern_parameter_list),
                optional(field("return_type", $._type)),
                optional(field("body", $.block)),
                optional(";")
            ),

        parameter_list: ($) =>
            seq("(", commaSep($.parameter), optional(","), ")"),

        parameter: ($) =>
            seq(
                optional(seq(field("name", $.identifier), ":")),
                field("type", $._type)
            ),

        extern_parameter_list: ($) =>
            seq(
                "(",
                optional(commaSep(choice($.parameter, $.variadic))),
                optional(","),
                ")"
            ),

        variadic: () => "...",

        struct_declaration: ($) =>
            seq(
                optional($.visibility),
                "struct",
                field("name", $.identifier),
                optional($.generic_params),
                "{",
                repeat(choice($.struct_field, $.function_declaration)),
                "}"
            ),

        struct_field: ($) =>
            seq(
                optional($.visibility),
                field("name", $.identifier),
                ":",
                field("type", $._type),
                ","
            ),

        enum_declaration: ($) =>
            seq(
                optional($.visibility),
                "enum",
                field("name", $.identifier),
                optional($.generic_params),
                "{",
                repeat(choice($.enum_empty_variant, $.enum_tuple_variant, $.enum_struct_variant, $.function_declaration)),
                "}"
            ),

        enum_empty_variant: ($) => seq(field("name", $.identifier), ","),

        enum_tuple_variant: ($) =>
            seq(field("name", $.identifier), ":", field("type", $._type), ","),

        enum_struct_variant: ($) =>
            seq(
                field("name", $.identifier),
                ":",
                "{",
                repeat($.struct_field),
                "}",
                ","
            ),

        interface_declaration: ($) =>
            seq(
                optional($.visibility),
                "interface",
                optional($.generic_params),
                field("name", $.identifier),
                "{",
                repeat(
                    choice(
                        $.function_declaration,
                        $.function_signature
                    )
                ),
                "}"
            ),

        function_signature: ($) =>
            seq(
                optional($.visibility),
                "fn",
                field("name", $.identifier),
                optional($.generic_params),
                field("parameters", $.parameter_list),
                optional(field("return_type", $._type)),
                ";"
            ),

        implement_block: ($) =>
            seq(
                "implement",
                optional($.generic_params),
                field("interface", $._implement_target),
                ":",
                field("target", $._implement_target),
                "{",
                repeat($.function_declaration),
                "}"
            ),

        _implement_target: ($) =>
            choice(
                $.builtin_type,
                $.generic_type,
                $.identifier
            ),

        block: ($) => seq("{", repeat($._statement), optional($._expression), "}"),

        _statement: ($) =>
            choice(
                $.let_declaration,
                $.const_declaration,
                $.assign_statement,
                $.while_statement,
                $.for_statement,
                $.return_statement,
                $.break_statement,
                $.continue_statement,
                $.expression_statement,
                $.if_expression,
                $.switch_expression,
                seq($.block, optional(";")),
                $.preprocessor_block
            ),

        assign_statement: ($) =>
            seq(
                field("left", $._expression),
                choice(
                    "=",
                    "+=",
                    "-=",
                    "*=",
                    "/=",
                    "%=",
                    "<<=",
                    ">>=",
                    "&=",
                    "|=",
                    "^="
                ),
                field("right", $._expression),
                ";"
            ),

        while_statement: ($) =>
            seq(
                "while",
                field("condition", $.parenthesized_expression),
                field("body", $.block),
                optional(";")
            ),

        for_statement: ($) =>
            seq(
                "for",
                "(",
                field("name", $.identifier),
                ":",
                field("iterator", $._expression),
                ")",
                field("body", $.block),
                optional(";")
            ),

        return_statement: ($) => seq("return", optional(field("value", $._expression)), ";"),

        break_statement: () => seq("break", ";"),

        continue_statement: () => seq("continue", ";"),

        expression_statement: ($) => seq(field("value", $._expression), ";"),

        _expression: ($) =>
            choice(
                $.binary_expression,
                $.unary_expression,
                $.range_expression,
                $.call_expression,
                $.field_expression,
                $.index_expression,
                $.struct_expression,
                $.array_expression,
                $.array_repeat_expression,
                $.closure_expression,
                $.macro_call,
                $.if_expression,
                $.switch_expression,
                $.preprocessor_expr,
                $.preprocessor_var,
                $.typeof_expression,
                $.parenthesized_expression,
                $.identifier,
                $.self_type,
                $.integer,
                $.float,
                $.char_literal,
                $.string_literal,
                $.true_literal,
                $.false_literal,
                $.null_literal
            ),

        true_literal: () => "true",

        false_literal: () => "false",

        null_literal: () => "nullptr",

        parenthesized_expression: ($) => seq("(", $._expression, ")"),

        binary_expression: ($) => {
            const table = [
                ["||", 1],
                ["&&", 2],
                ["|", 3],
                ["^", 4],
                ["&", 5],
                ["==", 6],
                ["!=", 6],
                ["<=", 7],
                [">=", 7],
                ["<", 7],
                [">", 7],
                ["<<", 8],
                [">>", 8],
                ["+", 9],
                ["-", 9],
                ["*", 10],
                ["/", 10],
                ["%", 10],
            ];

            return choice(
                ...table.map(([op, level]) =>
                    prec.left(
                        level,
                        seq(
                            field("left", $._expression),
                            field("operator", op),
                            field("right", $._expression)
                        )
                    )
                )
            );
        },

        unary_expression: ($) =>
            prec(
                11,
                seq(
                    field("operator", choice("-", "!", "~", "*", "&")),
                    field("operand", $._expression)
                )
            ),

        range_expression: ($) =>
            prec.left(
                0,
                seq(
                    optional(field("start", $._expression)),
                    "..",
                    optional(choice(field("end", $._expression), seq("=", field("end", $._expression))))
                )
            ),

        call_expression: ($) =>
            prec(
                12,
                seq(
                    field("function", $._expression),
                    optional($.generic_args),
                    field("arguments", $.argument_list)
                )
            ),

        argument_list: ($) => seq("(", commaSep($._expression), optional(","), ")"),

        field_expression: ($) =>
            prec(
                12,
                seq(
                    field("value", $._expression),
                    optional($.generic_args),
                    ".",
                    field("field", $.identifier)
                )
            ),

        index_expression: ($) =>
            prec(
                12,
                seq(
                    field("value", $._expression),
                    "[",
                    field("index", $._expression),
                    "]"
                )
            ),

        struct_expression: ($) =>
            prec(
                2,
                seq(
                    field("type", choice($._type, $.field_expression)),
                    "{",
                    commaSep($.field_init),
                    optional(","),
                    "}"
                )
            ),

        field_init: ($) =>
            seq(".", field("name", $.identifier), "=", field("value", $._expression)),
        array_expression: ($) =>
            seq("[", commaSep($._expression), optional(","), "]"),

        array_repeat_expression: ($) =>
            seq(
                "[",
                field("value", $._expression),
                ";",
                field("count", $._expression),
                "]"
            ),

        closure_expression: ($) =>
            seq(
                "fn",
                field("parameters", $.named_parameter_list),
                optional(field("return_type", $._type)),
                field("body", $.block)
            ),

        named_parameter_list: ($) =>
            seq("(", commaSep($.named_parameter), optional(","), ")"),

        named_parameter: ($) =>
            seq(field("name", $.identifier), ":", field("type", $._type)),

        switch_expression: ($) =>
            seq(
                "switch",
                field("scrutinee", $.parenthesized_expression),
                "{",
                commaSep($.switch_arm),
                optional(","),
                "}"
            ),

        switch_arm: ($) =>
            seq(
                field("pattern", $.or_pattern),
                optional(field("guard", $.switch_guard)),
                "=>",
                field("body", choice($.block, $._expression))
            ),

        switch_guard: ($) => seq("if", field("condition", $.parenthesized_expression)),

        or_pattern: ($) => sep1("|", $.single_pattern),

        single_pattern: ($) =>
            choice(
                $.variant_pattern,
                $.literal_pattern,
                $.range_expression,
                $.wildcard_pattern,
                $.ref_pattern,
                $.binding_pattern
            ),

        variant_pattern: ($) =>
            seq(
                ".",
                field("name", $.identifier),
                optional(seq(
                    "(",
                    field("payload", $.or_pattern),
                    ")"
                ))
            ),

        ref_pattern: ($) =>
            seq("&", field("binding", choice($.binding_pattern, $.wildcard_pattern))),

        literal_pattern: ($) =>
            choice(
                seq(optional("-"), choice($.integer, $.float)),
                $.char_literal,
                $.string_literal,
                $.true_literal,
                $.false_literal
            ),

        wildcard_pattern: () => token(prec(1, "_")),

        binding_pattern: ($) => prec(1, $.identifier),

        if_expression: ($) =>
            choice(
                prec(
                    1,
                    seq(
                        "if",
                        field("condition", $.parenthesized_expression),
                        field("consequence", choice($.block, $._expression)),
                        "else",
                        field("alternative", choice($.block, $._expression))
                    )
                ),
                seq(
                    "if",
                    field("condition", $.parenthesized_expression),
                    field("consequence", choice($.block, $._expression))
                )
            ),

        macro_call: ($) =>
            choice(
                prec(
                    2,
                    seq(
                        field("name", $.type_macro_name),
                        field("arguments", $.type_first_argument_list)
                    )
                ),
                seq(
                    field("name", $.macro_name),
                    field("arguments", $.argument_list)
                )
            ),

        type_macro_name: () =>
            token(prec(2, choice("@as", "@sizeof", "@alignof", "@typename"))),

        type_first_argument_list: ($) =>
            seq(
                "(",
                field("type", $._type),
                optional(seq(",", commaSep1($._expression), optional(","))),
                ")"
            ),

        macro_name: () => token(seq("@", /[A-Za-z_][A-Za-z0-9_]*/)),

        typeof_expression: ($) => seq("typeof", field("value", $._expression)),

        _type: ($) =>
            choice(
                $.builtin_type,
                $.generic_type,
                $.pointer_type,
                $.many_pointer_type,
                $.slice_type,
                $.array_type,
                $.function_type,
                $.typeof_type,
                $.const_type,
                $.self_type,
                $.identifier
            ),

        generic_type: ($) =>
            seq(field("type", $.identifier), "[", commaSep1($._type), "]"),

        pointer_type: ($) =>
            seq("*", field("type", $._type)),

        many_pointer_type: ($) =>
            seq("[*]", field("type", $._type)),

        slice_type: ($) => seq("[", "]", field("type", $._type)),

        array_type: ($) =>
            seq("[", field("length", $._expression), "]", field("type", $._type)),

        function_type: ($) =>
            seq(
                choice("fn", "Fn", "FnOnce"),
                "(",
                commaSep($._type),
                optional(","),
                ")",
                field("return_type", $._type)
            ),

        typeof_type: ($) => seq("typeof", field("value", $._expression)),

        self_type: () => choice("self", "Self"),

        const_type: ($) => seq("const", field("type", $._type)),
    },
});

function commaSep(rule) {
    return optional(commaSep1(rule));
}

function commaSep1(rule) {
    return seq(rule, repeat(seq(",", rule)));
}

function sep1(sep, rule) {
    return seq(rule, repeat(seq(sep, rule)));
}
