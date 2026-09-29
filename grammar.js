module.exports = grammar({
    name: "zeen",

    extras: ($) => [/\s/, $.line_comment, $.block_comment],

    word: ($) => $.identifier,

    rules: {
        program: ($) => repeat($._top_level),

        _top_level: ($) =>
            choice(
                $.function_declaration,
                $.struct_declaration,
                $.enum_declaration,
                $.use_declaration,
                $.const_declaration,
                $.let_declaration
            ),

        line_comment: () => token(seq("//", /.*/)),

        block_comment: () => token(seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/")),

        identifier: () => /[A-Za-z_][A-Za-z0-9_]*/,

        integer: () => /(0x[0-9a-fA-F_]+|0b[01_]+|0o[0-7_]+|[0-9][0-9_]*)/,

        float: () => /[0-9][0-9_]*\.[0-9_]+/,

        char_literal: () =>
            token(seq("'", choice(/[^'\\\n]/, seq("\\", /./)), "'")),

        string_literal: () =>
            token(seq('"', repeat(choice(/[^"\\\n]/, seq("\\", /./))), '"')),

        visibility: () => "pub",

        use_declaration: ($) =>
            seq("use", field("path", $.dotted_path), ";"),

        dotted_path: ($) => sep1(".", $.identifier),

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
                "let",
                field("name", $.identifier),
                ":",
                field("type", $._type),
                "=",
                field("value", $._expression),
                ";"
            ),

        function_declaration: ($) =>
            seq(
                optional($.visibility),
                "fn",
                field("name", $.identifier),
                field("parameters", $.parameter_list),
                optional(field("return_type", $._type)),
                field("body", $.block)
            ),

        parameter_list: ($) =>
            seq("(", commaSep($.parameter), optional(","), ")"),

        parameter: ($) =>
            seq(field("name", $.identifier), ":", field("type", $._type)),

        struct_declaration: ($) =>
            seq(
                optional($.visibility),
                "struct",
                field("name", $.identifier),
                "{",
                repeat($.struct_field),
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
                "{",
                repeat($.enum_empty_variant),
                "}"
            ),

        enum_empty_variant: ($) => seq(field("name", $.identifier), ","),

        block: ($) => seq("{", repeat($._statement), optional($._expression), "}"),

        _statement: ($) =>
            choice(
                $.let_declaration,
                $.const_declaration,
                $.return_statement,
                $.break_statement,
                $.continue_statement,
                $.expression_statement,
                $.if_statement,
                $.while_statement,
                $.for_statement
            ),

        return_statement: ($) => seq("return", optional(field("value", $._expression)), ";"),

        break_statement: () => seq("break", ";"),

        continue_statement: () => seq("continue", ";"),

        expression_statement: ($) => seq(field("value", $._expression), ";"),

        if_statement: ($) =>
            seq(
                "if",
                field("condition", $.parenthesized_expression),
                field("consequence", $.block),
                optional(seq("else", field("alternative", choice($.block, $.if_statement))))
            ),

        while_statement: ($) =>
            seq("while", field("condition", $.parenthesized_expression), field("body", $.block)),

        for_statement: ($) =>
            seq(
                "for",
                "(",
                field("name", $.identifier),
                ":",
                field("iterator", $._expression),
                ")",
                field("body", $.block)
            ),

        _expression: ($) =>
            choice(
                $.binary_expression,
                $.unary_expression,
                $.call_expression,
                $.field_expression,
                $.parenthesized_expression,
                $.identifier,
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

        call_expression: ($) =>
            prec(
                12,
                seq(
                    field("function", $._expression),
                    field("arguments", $.argument_list)
                )
            ),

        argument_list: ($) => seq("(", commaSep($._expression), optional(","), ")"),

        field_expression: ($) =>
            prec(
                12,
                seq(
                    field("value", $._expression),
                    ".",
                    field("field", $.identifier)
                )
            ),

        _type: ($) =>
            choice(
                $.builtin_type,
                $.named_type
            ),

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

        named_type: ($) => $.identifier,
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
